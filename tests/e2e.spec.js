/**
 * Regressão ponta a ponta do GHUB.
 *
 * A suíte unitária cobre funções puras; ela NÃO pega regressão no
 * encadeamento completo — que é exatamente o risco das Fases 2 e 3 do plano
 * (ordem de renderização vs. processamento, e a CSP).
 *
 * Roda sobre o PDF sintético de tests/fixtures: dados fictícios, nenhuma
 * folha de ponto real entra no repositório. Para rodar também contra os seus
 * PDFs reais, veja tests/README.md — eles ficam em validacao/pdfs/, que está
 * no .gitignore.
 */
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PDF = path.join(__dirname, 'fixtures', 'ponto-sintetico.pdf');
const PDF_LAYOUT = path.join(__dirname, 'fixtures', 'ponto-sintetico-layout-producao.pdf');
const { PAGINAS, LAYOUT_PRODUCAO } = require('./fixtures/gerar-pdf-sintetico.js');

/** Processa o PDF e devolve o estado observável da aplicação. */
async function processar(page, pdf = PDF) {
  await page.goto('/index.html');
  await page.setInputFiles('#fi', pdf);
  await page.waitForSelector('#res', { state: 'visible', timeout: 180000 });
  await page.waitForFunction(
    () => /Conclu|Erro/.test(document.getElementById('sm')?.textContent || ''),
    null, { timeout: 180000 });
  return page.evaluate(() => ({
    stats: {
      comAtm: document.getElementById('sa').textContent,
      saldoNeg: document.getElementById('satr').textContent,
      em12x36: document.getElementById('s1').textContent,
      comFaltas: document.getElementById('sft').textContent,
    },
    emps: (typeof allEmps !== 'undefined' ? allEmps : []).map(e => ({
      nome: e.name, cpf: e.cpf, atm: e.atm, is12: e.is12,
      dias: e.atmDays.map(d => d.display), motor: e.detectionReport?.motorUsado,
      faltaQtd: e.faltas.quantidade,
      faltaDsr: e.faltas.dsr,
      faltaConf: e.faltas.conferencia,
      faltaLidos: e.faltas.dias.map(d => d.day),
      faltaPulados: e.faltas.pulados,
      faltaDatas: e.faltas.dias.map(d => d.display),
      atrasoDatas: (e.atrasoDias || []).map(d => d.display),
      atrasoMin: (e.atrasoDias || []).reduce((t, d) => t + d.minutos, 0),
    })),
    tabela: [...document.querySelectorAll('#tbd tr')]
      .map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()).join('|')).join('\n'),
  }));
}

test.describe('Regras de negócio ponta a ponta', () => {
  /* Cada página do PDF sintético carrega a verdade conferida à mão.
     Isto é o que protege as REGRAS 1 e 2 — o núcleo contratual do produto. */
  for (const p of PAGINAS) {
    test(`${p.nome} — ${p.nota}`, async ({ page }) => {
      const r = await processar(page);
      const emp = r.emps.find(e => e.nome === p.nome);
      expect(emp, `funcionário não reconhecido: ${p.nome}`).toBeTruthy();
      expect(emp.atm).toBe(p.esperado.atm);
      expect(emp.is12).toBe(p.esperado.is12);
      expect(emp.dias).toEqual(p.esperado.dias);
      /* CPF completo, só dígitos, com o zero à esquerda preservado. */
      expect(emp.cpf).toBe(p.esperado.cpf);
      /* Faltas: QUANTIDADE depois das regras de escala, DSR e conferência.
         Ver docs/REGRA_FALTAS_DSR.md. */
      expect(emp.faltaQtd,  'QUANTIDADE de faltas').toBe(p.esperado.faltaQtd);
      expect(emp.faltaDsr,  'DSR').toBe(p.esperado.faltaDsr);
      expect(emp.faltaConf, 'conferência').toBe(p.esperado.faltaConf);
    });
  }

  test('contadores do painel batem com a amostra', async ({ page }) => {
    const r = await processar(page);
    expect(r.stats.comAtm).toBe(String(PAGINAS.filter(p => p.esperado.atm > 0).length));
    expect(r.stats.em12x36).toBe(String(PAGINAS.filter(p => p.esperado.is12).length));
    expect(r.stats.comFaltas).toBe(String(PAGINAS.filter(p => p.esperado.faltaQtd > 0).length));
  });

  test('snapshot da tabela renderizada, célula a célula', async ({ page }) => {
    const r = await processar(page);
    expect(JSON.stringify({ stats: r.stats, tabela: r.tabela }, null, 2))
      .toMatchSnapshot('tabela-sintetica.json');
  });
});

/* Regressão do layout de produção.

   O fixture principal desenhava o cabeçalho OBSERVAÇÃO e o texto da coluna no
   mesmo x. No PDF real o cabeçalho é centralizado e o texto alinhado à
   esquerda — 52pt de distância — e o agrupamento por x-mais-próximo do
   identifyTableColumns descartava a célula, zerando TODAS as faltas sem
   nenhum aviso. Esta página reproduz a geometria real. */
test.describe('Layout de produção', () => {
  test('as faltas são lidas com o cabeçalho centralizado e o texto à esquerda', async ({ page }) => {
    const r = await processar(page, PDF_LAYOUT);
    const emp = r.emps.find(e => e.nome === LAYOUT_PRODUCAO.nome);
    expect(emp, 'funcionário não reconhecido no layout de produção').toBeTruthy();
    expect(emp.faltaLidos, 'dias lidos na coluna OBSERVAÇÃO').toEqual([7, 8, 13, 14, 23, 24]);
    expect(emp.faltaQtd).toBe(LAYOUT_PRODUCAO.esperado.faltaQtd);
    expect(emp.faltaDsr).toBe(LAYOUT_PRODUCAO.esperado.faltaDsr);
    expect(emp.faltaConf).toBe(LAYOUT_PRODUCAO.esperado.faltaConf);
  });

  /* O valor largo da JORNADA começa à esquerda do próprio cabeçalho; se ele
     vazasse para a OBSERVAÇÃO, o texto da célula deixaria de ser só "FALTA". */
  test('o valor largo da JORNADA não vaza para a coluna OBSERVAÇÃO', async ({ page }) => {
    const r = await processar(page, PDF_LAYOUT);
    const emp = r.emps.find(e => e.nome === LAYOUT_PRODUCAO.nome);
    expect(emp.faltaLidos.length).toBe(6);
  });

  /* A coluna SALDO traz o saldo de cada dia. A soma dos dias negativos tem
     de fechar com o SALDO DE HORAS do rodapé — é o que garante que a leitura
     por dia é a mesma coisa que o total já conhecido. */
  test('os dias de atraso saem da coluna SALDO e somam o total do rodapé', async ({ page }) => {
    const r = await processar(page, PDF_LAYOUT);
    const emp = r.emps.find(e => e.nome === LAYOUT_PRODUCAO.nome);
    expect(emp.atrasoDatas).toEqual(LAYOUT_PRODUCAO.esperado.atrasoDatas);
    expect(emp.atrasoMin).toBe(LAYOUT_PRODUCAO.esperado.atrasoMinutos);
  });

  /* A LOTAÇÃO tem o conteúdo à esquerda do próprio cabeçalho e invade a faixa
     do SALDO; o saldo é achado pelo formato, não pela borda da coluna. */
  test('a LOTAÇÃO não é confundida com o saldo do dia', async ({ page }) => {
    const r = await processar(page, PDF_LAYOUT);
    const emp = r.emps.find(e => e.nome === LAYOUT_PRODUCAO.nome);
    expect(emp.atrasoDatas.length).toBe(3);
  });
});

/* As datas das três ocorrências aparecem ao expandir a linha. */
test.describe('Datas na linha expandida', () => {
  test('atestados, faltas e atrasos aparecem cada um no seu grupo', async ({ page }) => {
    await processar(page, PDF_LAYOUT);
    await page.locator('#tbd tr.mr').first().click();
    const detalhe = page.locator('#tbd tr.dr');
    await expect(detalhe).toBeVisible();
    const texto = await detalhe.textContent();
    expect(texto).toContain('Faltas');
    expect(texto).toContain('Atrasos');
    for (const d of LAYOUT_PRODUCAO.esperado.faltaDatas)  expect(texto).toContain(d);
    for (const d of LAYOUT_PRODUCAO.esperado.atrasoDatas) expect(texto).toContain(d);
    expect(texto, 'o atraso mostra os minutos do dia').toContain('45 min');
  });

  test('funcionário sem ocorrência nenhuma não abre detalhe', async ({ page }) => {
    await processar(page);                       // fixture principal
    const linha = page.locator('#tbd tr.mr', { hasText: 'EDUARDO SANTOS RIBEIRO' });
    await linha.click();
    expect(await page.locator('#tbd tr.dr').count()).toBe(0);
  });
});

/* A planilha é o único lugar onde a contagem por escala e a DSR aparecem.
   A tela e o relatório TXT continuam mostrando o número cru do PDF — estes
   testes guardam essa separação nos dois sentidos. */
test.describe('Planilha gerada', () => {
  /** Baixa o CSV com os filtros pedidos e devolve as linhas já separadas. */
  async function csv(page, testInfo, filtros) {
    await processar(page, PDF_LAYOUT);
    for (const f of filtros) await page.check(f);
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#bcsv')]);
    const dest = testInfo.outputPath(d.suggestedFilename());
    await d.saveAs(dest);
    return fs.readFileSync(dest, 'utf8').replace(/^\uFEFF/, '')
      .split('\r\n').filter(Boolean).map(l => l.split(';'));
  }

  test('a planilha de FALTAS traz a quantidade por escala e a DSR', async ({ page }, testInfo) => {
    const linhas = await csv(page, testInfo, ['#ff']);
    const cab = linhas[0], dados = linhas[1];
    expect(cab).toContain('QUANTIDADE');
    expect(cab).toContain('DSR');
    /* O PDF imprime 6; o 12×36 com três pares de dias corridos vale 3. */
    expect(dados[cab.indexOf('QUANTIDADE')]).toBe(String(LAYOUT_PRODUCAO.esperado.faltaQtd));
    expect(dados[cab.indexOf('DSR')]).toBe(String(LAYOUT_PRODUCAO.esperado.faltaDsr));
  });

  test('a planilha de ATRASOS traz o saldo em minutos, positivo', async ({ page }, testInfo) => {
    const linhas = await csv(page, testInfo, ['#fd']);
    const cab = linhas[0], dados = linhas[1];
    expect(cab).toContain('QUANTIDADE');
    /* -2 HORA(S) E 15 MINUTO(S) → 135, sem sinal e sem "hh:mm". */
    const v = dados[cab.indexOf('QUANTIDADE')];
    expect(v).toBe(String(LAYOUT_PRODUCAO.esperado.atrasoMinutos));
    expect(v).not.toContain('-');
    expect(v).not.toContain(':');
  });
});

/* O relatório TXT e a tela NÃO seguem a contagem por escala: mostram o número
   cru impresso no PDF, como sempre fizeram. */
test.describe('Relatório e tela ficam no número cru', () => {
  test('o relatório TXT mostra o total impresso, não a quantidade da planilha', async ({ page }, testInfo) => {
    await processar(page, PDF_LAYOUT);
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#blr')]);
    const dest = testInfo.outputPath(d.suggestedFilename());
    await d.saveAs(dest);
    const txt = fs.readFileSync(dest, 'utf8');
    const cru = LAYOUT_PRODUCAO.esperado.faltaImpresso;
    expect(txt).toContain(`Total de Faltas: ${cru} dias`);
    expect(txt).toContain(`Total de dias de falta: ${cru}`);
    expect(txt, 'o relatório não deve trazer DSR').not.toContain('DSR');
  });

  /* A seção de cada verba segue os filtros marcados, em qualquer combinação —
     antes só ATESTADOS, ATRASOS e ATESTADOS_E_ATRASOS eram reconhecidos. */
  test('o relatório traz a seção de cada filtro marcado, também combinados', async ({ page }) => {
    await processar(page);
    const casos = [
      { filtros: ['#fa', '#ff'],        atm: true,  atrasos: false },
      { filtros: ['#ff', '#fd'],        atm: false, atrasos: true },
      { filtros: ['#fa', '#ff', '#fd'], atm: true,  atrasos: true },
    ];
    for (const c of casos) {
      for (const f of ['#fa', '#ff', '#fd']) await page.setChecked(f, c.filtros.includes(f));
      const [d] = await Promise.all([page.waitForEvent('download'), page.click('#blr')]);
      const txt = fs.readFileSync(await d.path(), 'utf8');
      expect(txt.includes('─ ATESTADOS'), `seção de atestados com ${c.filtros}`).toBe(c.atm);
      expect(txt.includes('─ ATRASOS'), `seção de atrasos com ${c.filtros}`).toBe(c.atrasos);
    }
  });

  test('a tabela na tela mostra o total impresso', async ({ page }) => {
    const r = await processar(page, PDF_LAYOUT);
    expect(r.stats.comFaltas).toBe('1');
    expect(r.tabela).toContain(`${LAYOUT_PRODUCAO.esperado.faltaImpresso} dias`);
    expect(r.tabela, 'a tela não deve ganhar coluna de DSR').not.toContain('|3|');
  });
});

test.describe('Fluxo completo', () => {
  test('processar, filtrar, ordenar, expandir, tema, 3 downloads e reset', async ({ page }, testInfo) => {
    const erros = [];
    page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));

    await processar(page);
    expect(await page.locator('#tbd tr').count()).toBe(PAGINAS.length);

    await page.check('#fa');
    expect(await page.locator('#tbd tr').count()).toBe(PAGINAS.filter(p => p.esperado.atm > 0).length);
    await page.uncheck('#fa');

    await page.check('#ff');
    expect(await page.locator('#tbd tr').count()).toBe(PAGINAS.filter(p => p.esperado.faltaQtd > 0).length);
    await page.uncheck('#ff');

    /* Regressão do bug `only`: lista vazia com busca vazia derrubava o render.
       Ninguém na amostra tem saldo de horas negativo. */
    await page.check('#fd');
    await expect(page.locator('#tbd tr').first()).toContainText('filtros selecionados');
    await page.uncheck('#fd');

    await page.click('th.sortable[data-col="name"]');
    await page.locator('#tbd tr.mr').first().click();
    expect(await page.locator('#tbd tr').count()).toBe(PAGINAS.length + 1);
    await page.locator('#tbd tr.mr').first().click();

    await page.click('#themeToggle');
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');
    await page.click('#themeToggle');

    for (const [nome, sel] of [['pdf', '#bdl'], ['xlsx', '#bcs'], ['txt', '#blr']]) {
      const [d] = await Promise.all([page.waitForEvent('download'), page.click(sel)]);
      const dest = testInfo.outputPath(d.suggestedFilename());
      await d.saveAs(dest);
      expect(fs.statSync(dest).size, `download vazio: ${nome}`).toBeGreaterThan(500);
    }

    await page.evaluate(() => resetTool());
    expect(await page.evaluate(() => document.getElementById('res').style.display)).toBe('none');
    for (const sel of ['#bdl', '#bcs', '#bcsv', '#bdsr', '#blr'])
      await expect(page.locator(sel), `${sel} continua ativo depois do "Novo"`).toBeDisabled();
    expect(erros).toEqual([]);
  });
});

test.describe('Segurança', () => {
  test('a CSP de produção não bloqueia nada do fluxo', async ({ page }) => {
    const csp = fs.readFileSync(path.join(__dirname, '..', '_headers'), 'utf8')
      .split('\n').find(l => l.trim().startsWith('Content-Security-Policy:'))
      .replace(/^\s*Content-Security-Policy:\s*/, '').trim();

    const violacoes = [];
    page.on('console', m => {
      if (/Content Security Policy|Refused to/i.test(m.text())) violacoes.push(m.text());
    });
    await page.route('**/index.html', async r => {
      const resp = await r.fetch();
      r.fulfill({ response: resp, headers: { ...resp.headers(), 'content-security-policy': csp } });
    });

    await processar(page);
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#bcs')]);
    expect(d.suggestedFilename()).toMatch(/\.xlsx$/);
    expect(violacoes, 'a CSP bloqueou algo do fluxo').toEqual([]);
  });

  test('a página não faz nenhuma requisição a terceiros', async ({ page }) => {
    const externas = [];
    page.on('request', r => {
      const h = new URL(r.url()).hostname;
      if (!['localhost', '127.0.0.1'].includes(h)) externas.push(r.url());
    });
    await processar(page);
    expect(externas, 'requisição externa detectada').toEqual([]);
  });
});

/* Um PDF escolhido no meio do processamento de outro substitui o anterior.
   Antes os funcionários dos dois se misturavam em allEmps, e o PDF exportado
   copiava páginas do arquivo errado. */
test.describe('Troca de arquivo', () => {
  test('um segundo PDF no meio do processamento substitui o primeiro', async ({ page }) => {
    await page.goto('/index.html');
    /* segura cada página um pouco, para o segundo arquivo chegar com o
       primeiro ainda no meio — sem isso a corrida depende da máquina */
    await page.evaluate(() => {
      const original = renderPageToCache;
      renderPageToCache = async (...a) => { await new Promise(r => setTimeout(r, 150)); return original(...a); };
    });
    await page.setInputFiles('#fi', PDF);
    await page.waitForFunction(() => /Analisando página/.test(document.getElementById('sm').textContent));
    await page.setInputFiles('#fi', PDF_LAYOUT);
    await page.waitForFunction(
      () => /Conclu|Erro/.test(document.getElementById('sm')?.textContent || ''),
      null, { timeout: 180000 });
    await page.waitForTimeout(1500);   // o bastante para o processamento antigo terminar, se ainda rodasse
    expect(await page.evaluate(() => allEmps.map(e => e.name))).toEqual([LAYOUT_PRODUCAO.nome]);
  });
});

/* ─── Infrequência SME ─────────────────────────────────────────────────── */
const SIGLAS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Planilha de ponto fictícia com o cabeçalho num mês diferente do esperado
    (o anterior ao atual) — o que obriga a confirmação do mês antes de gerar.
    As linhas sem ocorrência só servem para o iframe ficar alto como o real. */
function csvMesDivergente() {
  const esperado = (new Date().getMonth() + 11) % 12;          // mês anterior, 0 = janeiro
  const sigla = SIGLAS[(esperado + 4) % 12];
  const dias = Array.from({ length: 28 }, (_, i) => `${String(i + 1).padStart(2, '0')}/${sigla}`);
  const linha = (nome, cpf, empresa, falta) =>
    [nome, cpf, 'AUXILIAR', empresa, ...dias.map((_, i) => (i + 1 === falta ? 'F' : '')), falta ? 1 : 0, 0, 0].join(';');
  return Buffer.from([
    ['FUNCIONÁRIO', 'CPF', 'FUNÇÃO', 'EMPRESA', ...dias, 'F', 'ATM', 'TRE'].join(';'),
    linha('FUNC ALFA', '52998224725', 'ALFA', 3),
    linha('FUNC BETA', '11144477735', 'BETA', 4),
    ...Array.from({ length: 40 }, (_, i) => linha(`SEM OCORRENCIA ${i + 1}`, '', i % 2 ? 'ALFA' : 'BETA', 0)),
  ].join('\n'), 'utf8');
}

test.describe('Infrequência SME', () => {
  /** Abre a Infrequência dentro do Folha Fácil, como o usuário usa, e carrega a planilha. */
  async function abrir(page) {
    await page.setViewportSize({ width: 1400, height: 800 });
    await page.goto('/index.html');
    await page.click('#toolBtnInfreq');
    const iframe = await page.waitForSelector('#toolInfrequencia');
    const frame = await iframe.contentFrame();
    await frame.waitForSelector('#file', { state: 'attached' });
    await frame.setInputFiles('#file', { name: 'ponto.csv', mimeType: 'text/csv', buffer: csvMesDivergente() });
    await frame.waitForSelector('#actionbar:not(.hide)');
    return { iframe, frame };
  }

  /* O iframe tem a altura do conteúdo inteiro: centralizado nele, o balão caía
     milhares de pixels abaixo da tela, só o fundo cinza aparecia e a aba
     travava até o F5. Agora ele vai para o trecho visível e a rolagem fica
     travada enquanto estiver aberto — sem desfoque, que pesava a rolagem. */
  test('o balão do mês aparece na tela, trava a rolagem e Esc cancela', async ({ page }) => {
    const { iframe, frame } = await abrir(page);
    const naTela = async () => {
      const f = await iframe.boundingBox();
      const c = await frame.$eval('.modal-box', e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
      return f.y + c.top >= 0 && f.y + c.bottom <= page.viewportSize().height;
    };
    const rolagem = () => page.evaluate(() => scrollY);
    /* clique de mouse de verdade: o frame.click do Playwright rola a página até
       o botão, e com o scroll-behavior:smooth do site essa animação seguiria
       depois da trava e confundiria a medida */
    const gerar = async () => {
      const b = await (await frame.$('#btn-modelo')).boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    };
    await gerar();
    await frame.waitForSelector('#modal:not(.hide)');
    expect(await naTela(), 'balão fora da tela').toBe(true);
    expect(await frame.$eval('#modal', e => getComputedStyle(e).backdropFilter)).toBe('none');

    const antes = await rolagem();
    await page.mouse.move(700, 700);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(400);
    expect(await rolagem(), 'a página rolou com o balão aberto').toBe(antes);
    expect(await naTela()).toBe(true);

    await page.keyboard.press('Escape');
    await expect(frame.locator('#modal')).toBeHidden();
    await page.mouse.wheel(0, 600);                         // fechado, a rolagem volta
    await expect.poll(rolagem).toBeGreaterThan(antes);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));

    await gerar();                                          // clique fora do balão também cancela
    const y = await frame.$eval('.modal-box', e => Math.round(e.getBoundingClientRect().top + 20));
    await frame.click('#modal', { position: { x: 60, y } });
    await expect(frame.locator('#modal')).toBeHidden();

    /* trocar de ferramenta com o balão aberto cancela e solta a trava — senão
       o Guardião ficaria sem rolagem */
    await gerar();
    await frame.waitForSelector('#modal:not(.hide)');
    await page.click('#toolBtnPonto');
    await expect(frame.locator('#modal')).toBeHidden();
    expect(await page.evaluate(() => [document.body.style.overflow, document.documentElement.style.scrollbarGutter]))
      .toEqual(['', '']);
  });

  /* Confirmar o mês recriava a lista de empresas e o filtro voltava a "Todas"
     antes de a planilha ser montada. */
  test('confirmar o mês mantém a empresa escolhida no filtro', async ({ page }) => {
    const { frame } = await abrir(page);
    await frame.selectOption('#f-empresa', 'ALFA');
    await frame.click('#btn-modelo');
    await frame.waitForSelector('#modal:not(.hide)');
    const [d] = await Promise.all([page.waitForEvent('download'), frame.click('#modal-esp')]);
    expect(d.suggestedFilename()).toContain('_ALFA_');
    expect(await frame.inputValue('#f-empresa')).toBe('ALFA');
    const b64 = fs.readFileSync(await d.path()).toString('base64');
    const nomes = await frame.evaluate(b64 => {
      const wb = XLSX.read(Uint8Array.from(atob(b64), c => c.charCodeAt(0)), { type: 'array' });
      return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).map(r => r['Funcionário']);
    }, b64);
    expect(nomes).toEqual(['FUNC ALFA']);
  });

  /* A lista neumórfica (ui/neu.js) media o espaço pelo innerHeight do iframe
     — a altura do conteúdo inteiro — e sempre abria para baixo, mesmo com o
     seletor no pé da tela. Agora usa o trecho realmente visível. */
  test('a lista de um seletor abre dentro da tela, mesmo com pouco espaço embaixo', async ({ page }) => {
    const { iframe, frame } = await abrir(page);
    await page.setViewportSize({ width: 1400, height: 450 });
    const b = await (await frame.$('#f-tipo')).boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    const lista = frame.locator('.neu-pop');
    await expect(lista).toBeVisible();
    const f = await iframe.boundingBox();
    const r = await lista.evaluate(e => e.getBoundingClientRect().toJSON());
    expect(f.y + r.top, 'lista acima do topo da tela').toBeGreaterThanOrEqual(0);
    expect(f.y + r.bottom, 'lista abaixo do pé da tela').toBeLessThanOrEqual(450);
    await expect(lista).toHaveClass(/neu-acima/);
  });

  /* Cabeçalho de dia gravado como data (células dd/mmm), como o SheetJS grava
     no fuso de Brasília — 01/ago vinha 31/jul 23:59:59, e o nome do arquivo
     levava a data inteira ("SATAUG012026..."). */
  test.describe('cabeçalho de dia em formato de data', () => {
    test.use({ timezoneId: 'America/Sao_Paulo' });

    test('lê o dia certo e o arquivo sai com a sigla do mês', async ({ page }) => {
      await page.goto('/infrequencia.html');
      const { b64, sigla } = await page.evaluate(() => {
        const { mes, ano } = mesAnterior();
        const cab = ['FUNCIONÁRIO', 'CPF', 'FUNÇÃO', 'EMPRESA'];
        const n = diasNoMes(mes, ano);
        for (let d = 1; d <= n; d++) cab.push(new Date(ano, mes - 1, d));
        const linha = ['FUNC DATA', '52998224725', 'AUXILIAR', 'ALFA', ...Array.from({ length: n }, (_, i) => (i === 0 ? 'F' : ''))];
        const ws = XLSX.utils.aoa_to_sheet([cab, linha], { cellDates: true });
        for (let c = 4; c < 4 + n; c++) ws[XLSX.utils.encode_cell({ r: 0, c })].z = 'dd/mmm';
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'P');
        return { b64: XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }), sigla: SIGLAS[mes - 1] };
      });
      await page.setInputFiles('#file', { name: 'ponto.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from(b64, 'base64') });
      await page.waitForSelector('#actionbar:not(.hide)');
      const lido = await page.evaluate(() => ({ primeiro: STATE.days[0].dia, falta: STATE.rows[0].marcas.indexOf('F') }));
      expect(lido).toEqual({ primeiro: 1, falta: 0 });
      const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btn-modelo')]);
      expect(d.suggestedFilename()).toBe(`MODELO_TODAS_FALTAS-ATESTADOS_${sigla.toUpperCase()}.xlsx`);
    });
  });
});

/* ─── Conciliador de Planilhas ─────────────────────────────────────────── */
test.describe('Conciliador de Planilhas', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' });

  /* O número de série do Excel é meia-noite em UTC; formatado em UTC-3 caía no
     dia anterior — nascimento, admissão e início de vigência saíam um dia antes
     nas planilhas de dependentes e de transferências. */
  test('data lida do .xlsx sai no mesmo dia no fuso de Brasília', async ({ page }) => {
    await page.goto('/conciliadorde-planilha.html');
    expect(await page.evaluate(() => [xlDate(32947), xlDate(46235), xlDate(46235.75)]))
      .toEqual(['15/03/1990', '01/08/2026', '01/08/2026']);
  });
});

/* ─── Varredura geral: regressões dos bugs corrigidos ──────────────────── */
test.describe('Guardião — arquivo recusado, PDF quebrado e tela estreita', () => {
  /* O aviso morava dentro do painel de resultados: um arquivo inválido logo no
     início abria o painel vazio — cartão sem nome, contadores em zero e tabela
     só com o cabeçalho. */
  test('arquivo que não é PDF mostra só o aviso, sem abrir o painel vazio', async ({ page }) => {
    await page.goto('/index.html');
    await page.setInputFiles('#fi', { name: 'planilha.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('x') });
    await expect(page.locator('#alrt')).toBeVisible();
    await expect(page.locator('#alrt')).toContainText('Arquivo inválido');
    await expect(page.locator('#res')).toBeHidden();
  });

  /* O arquivo novo trocava curFile e pdfBytes antes de abrir: um PDF quebrado
     deixava a tabela do anterior com o nome e os bytes do novo, e a barra de
     progresso parada em 5% embaixo do erro. */
  test('um PDF quebrado depois de um bom mantém o anterior inteiro', async ({ page }) => {
    await processar(page);
    const antes = await page.evaluate(() => ({ nome: curFile.name, bytes: pdfBytes.length, emps: allEmps.length }));
    await page.setInputFiles('#fi', { name: 'quebrado.pdf', mimeType: 'application/pdf', buffer: Buffer.from('isto nao e um pdf') });
    await page.waitForFunction(() => /Erro/.test(document.getElementById('sm').textContent));
    await expect(page.locator('#sm')).toContainText('não é um PDF válido');
    await expect(page.locator('#pw')).toBeHidden();
    expect(await page.evaluate(() => ({ nome: curFile.name, bytes: pdfBytes.length, emps: allEmps.length }))).toEqual(antes);
    await expect(page.locator('#fn')).toHaveText(antes.nome);
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#bcs')]);
    expect(d.suggestedFilename()).toBe('ponto-sintetico_GERAL.xlsx');
  });

  /* A tabela tem ~760px de largura mínima e o contêiner cortava o resto com
     overflow:hidden: no celular ATM, Faltas, Saldo e Páginas sumiam. */
  test('no celular a tabela rola para o lado em vez de cortar colunas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await processar(page);
    const r = await page.$eval('.tw', tw => ({ overflow: getComputedStyle(tw).overflowX, cabe: tw.scrollWidth <= tw.clientWidth }));
    expect(r.overflow).toBe('auto');
    expect(r.cabe).toBe(false);
    await page.$eval('.tw', tw => { tw.scrollLeft = tw.scrollWidth; });
    const [tw, th] = await Promise.all([
      page.$eval('.tw', e => e.getBoundingClientRect().toJSON()),
      page.$eval('th:nth-child(7)', e => e.getBoundingClientRect().toJSON()),
    ]);
    expect(th.right, 'coluna Páginas continua fora do alcance').toBeLessThanOrEqual(tw.right + 1);
  });

  /* A seção de faltas do relatório aparecia com qualquer filtro; as de
     atestados e atrasos já seguiam o que estava marcado. */
  test('a seção de faltas do relatório segue o filtro marcado', async ({ page }) => {
    await page.goto('/index.html');
    const relatorio = async (filtro) => {
      await page.evaluate(f => {
        allEmps = [{ name: 'TESTE', cpf: null, pages: [1], atm: 1, is12: false, saldoHoras: null,
                     atmDays: [{ display: '04/05/2026 (Seg)', confidence: 1 }], totalFaltas: 2,
                     faltas: { quantidade: 2, dsr: 1, conferencia: 'conferido', dias: [], impresso: 2 },
                     detectionReport: { motorUsado: 'coluna-horizontal' } }];
        for (const id of ['fa', 'ff', 'fd']) document.getElementById(id).checked = id === f;
      }, filtro);
      const [d] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => dlReport())]);
      return fs.readFileSync(await d.path(), 'utf8');
    };
    const soAtm = await relatorio('fa');
    expect(soAtm).toContain('─ ATESTADOS');
    expect(soAtm).not.toContain('─ FALTAS');
    expect(soAtm).not.toContain('Total de Faltas');
    const soFaltas = await relatorio('ff');
    expect(soFaltas).toContain('─ FALTAS');
    expect(soFaltas).toContain('Total de Faltas: 2 dias');
  });
});

test.describe('Infrequência — nomes, empresas e proventos', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' });

  /** Planilha no mês esperado (sem balão de confirmação), uma ocorrência por
      funcionário no primeiro dia útil. */
  async function carregar(page, linhas) {
    await page.goto('/infrequencia.html');
    const b64 = await page.evaluate(linhas => {
      const { mes, ano } = mesAnterior();
      const n = diasNoMes(mes, ano);
      let util = 1; while ([0, 6].includes(new Date(ano, mes - 1, util).getDay())) util++;
      const cab = ['FUNCIONÁRIO', 'CPF', 'FUNÇÃO', 'EMPRESA'];
      for (let d = 1; d <= n; d++) cab.push(String(d).padStart(2, '0') + '/' + SIGLAS[mes - 1]);
      const aoa = [cab, ...linhas.map(([nome, cpf, empresa, marca]) =>
        [nome, cpf, 'AUXILIAR', empresa, ...Array.from({ length: n }, (_, i) => (i + 1 === util ? marca : ''))])];
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'P');
      return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    }, linhas);
    await page.setInputFiles('#file', { name: 'ponto.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from(b64, 'base64') });
    await page.waitForSelector('#actionbar:not(.hide)');
  }
  async function linhasDoXlsx(page, d) {
    const b64 = fs.readFileSync(await d.path()).toString('base64');
    return page.evaluate(b64 => {
      const wb = XLSX.read(b64, { type: 'base64' });
      return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    }, b64);
  }

  test('nome com HTML aparece como texto, na tabela, nas críticas e na busca', async ({ page }) => {
    await carregar(page, [['ANA <img src=x onerror="window.__xss=1">', '123', 'ALFA', 'F']]);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await page.$$eval('#tbl img, #issues img', e => e.length)).toBe(0);
    await expect(page.locator('#tbl tbody td.name')).toContainText('ANA <img src=x');
    await expect(page.locator('#issues')).toContainText('ANA <img src=x');
    await page.fill('#busca', '<i>ninguem</i>');
    await expect(page.locator('#tbl tbody td.empty')).toContainText('<i>ninguem</i>');
  });

  /* Sem value explícito o navegador junta os espaços duplos do texto da
     <option>, e o filtro deixava de bater com r.empresa: "Nada a exportar". */
  test('empresa com espaço duplo no nome continua filtrável', async ({ page }) => {
    await carregar(page, [['FUNC UM', '52998224725', 'EMPRESA  DUPLA', 'F'], ['FUNC DOIS', '11144477735', 'OUTRA', 'F']]);
    await page.selectOption('#f-empresa', 'EMPRESA  DUPLA');
    expect(await page.inputValue('#f-empresa')).toBe('EMPRESA  DUPLA');
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btn-modelo')]);
    expect((await linhasDoXlsx(page, d)).map(l => l['Funcionário'])).toEqual(['FUNC UM']);
  });

  /* Quando "Provento TRE" foi renomeado para "Provento DSR", as linhas de TRE
     continuaram lendo o mesmo campo e saíam com o código da DSR. */
  test('TRE usa o Provento TRE e a DSR usa o Provento DSR', async ({ page }) => {
    await carregar(page, [['FUNC FALTA', '52998224725', 'ALFA', 'F'], ['FUNC TRE', '11144477735', 'ALFA', 'D']]);
    await page.selectOption('#f-tipo', 'FAD');
    await page.fill('#p-falta', '504');
    await page.fill('#p-tre', '777');
    await page.fill('#p-dsr', '999');
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
    const porTipo = Object.fromEntries((await linhasDoXlsx(page, d)).map(l => [l.Tipo, l.PROVENTO]));
    expect(porTipo).toEqual({ FALTA: 504, TRE: 777 });
    await page.selectOption('#f-tipo', 'DSR');
    const [d2] = await Promise.all([page.waitForEvent('download'), page.click('#btn-modelo')]);
    expect((await linhasDoXlsx(page, d2)).map(l => l.PROVENTO)).toEqual([999]);
  });
});
