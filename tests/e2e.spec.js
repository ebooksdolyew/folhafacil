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
const { PAGINAS } = require('./fixtures/gerar-pdf-sintetico.js');

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
      nome: e.name, atm: e.atm, is12: e.is12,
      dias: e.atmDays.map(d => d.display), motor: e.detectionReport?.motorUsado,
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
    });
  }

  test('contadores do painel batem com a amostra', async ({ page }) => {
    const r = await processar(page);
    expect(r.stats.comAtm).toBe(String(PAGINAS.filter(p => p.esperado.atm > 0).length));
    expect(r.stats.em12x36).toBe(String(PAGINAS.filter(p => p.esperado.is12).length));
  });

  test('snapshot da tabela renderizada, célula a célula', async ({ page }) => {
    const r = await processar(page);
    expect(JSON.stringify({ stats: r.stats, tabela: r.tabela }, null, 2))
      .toMatchSnapshot('tabela-sintetica.json');
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

    /* Regressão do bug `only`: lista vazia com busca vazia derrubava o render. */
    await page.check('#ff');   // ninguém na amostra tem faltas
    await expect(page.locator('#tbd tr').first()).toContainText('filtros selecionados');
    await page.uncheck('#ff');

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
