/**
 * Gera uma folha de ponto SINTÉTICA para testes de regressão do GHUB.
 *
 * Os dados são fictícios de ponta a ponta — nenhum dado real de funcionário
 * entra no repositório. O layout reproduz o do PDF de produção:
 * DIA / ENT1 / SAI1 / ENT2 / SAI2 / JORNADA / OBSERVAÇÃO, uma linha por dia
 * do mês, e o rodapé com TOTAL DE FALTAS.
 *
 * Uso:  node tests/fixtures/gerar-pdf-sintetico.js [saida.pdf]
 * Requer: npm i pdf-lib@1.17.1
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

/* Maio/2026 — 01/05 é sexta-feira. Sábados: 2, 9, 16, 23, 30. Domingos: 3, 10, 17, 24, 31. */
const PERIODO = { mes: '05', ano: '2026' };
const DIAS_NO_MES = 31;

/**
 * Cada página descreve um funcionário.
 *
 *   atm      dias com ATM na coluna ENT1
 *   jornada  texto da coluna JORNADA por dia (ausente = vazio)
 *   faltas   dias com "FALTA" na coluna OBSERVAÇÃO
 *   obs      outros textos da coluna OBSERVAÇÃO, por dia — nenhum deles conta
 *   impresso força o número do rodapé (ausente = o próprio total de `faltas`)
 *
 * `esperado` é a verdade conferida à mão — o que o GHUB DEVE produzir.
 * Regra de faltas e DSR em docs/REGRA_FALTAS_DSR.md.
 */
const PAGINAS = [
  {
    nome: 'ANTONIO PEREIRA LIMA',
    cpf: '012.345.678-90',              // zero à esquerda + pontuação → precisa virar "01234567890"
    escala: null,                       // Convencional
    atm: [4, 5, 9],                     // 9 é sábado → REGRA 1 rejeita
    jornada: {},
    faltas: [],
    obs: {},
    esperado: {
      atm: 2, is12: false, dias: ['04/05/2026 (Seg)', '05/05/2026 (Ter)'], cpf: '01234567890',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'REGRA 1: ATM em dia útil conta; ATM em sábado é descartado. CPF com zero à esquerda.',
  },
  {
    nome: 'BEATRIZ SOUZA ROCHA',
    cpf: '123.456.789-09',
    escala: '12x36',
    atm: [2, 6],                        // 2 é sábado → válido em 12x36
    jornada: { 2: '07:00-19:00', 6: '07:00-19:00' },
    faltas: [],
    obs: {},
    esperado: {
      atm: 2, is12: true, dias: ['02/05/2026 (Sáb)', '06/05/2026 (Qua)'], cpf: '12345678909',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'REGRA 2: 12x36 com JORNADA preenchida conta, inclusive em fim de semana.',
  },
  {
    nome: 'CARLOS EDUARDO NUNES',
    cpf: '987.654.321-00',
    escala: '12x36',
    atm: [8, 12],
    jornada: { 8: '07:00-19:00' },      // dia 12 sem JORNADA → rejeitado
    faltas: [],
    obs: {},
    esperado: {
      atm: 1, is12: true, dias: ['08/05/2026 (Sex)'], cpf: '98765432100',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'REGRA 2: 12x36 com JORNADA vazia é rejeitado.',
  },
  {
    nome: 'DANIELA MARTINS ALVES',
    cpf: '045.678.912-34',              // outro zero à esquerda
    escala: '12x36',
    atm: [14],
    jornada: { 14: 'Folga' },           // caso da divergência da Fase 4
    faltas: [],
    obs: {},
    esperado: {
      atm: 1, is12: true, dias: ['14/05/2026 (Qui)'], cpf: '04567891234',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'FASE 4: 12x36 com JORNADA="Folga". O motor tabular conta; o legado descartaria.',
  },
  {
    nome: 'EDUARDO SANTOS RIBEIRO',
    cpf: '321.654.987-11',
    escala: null,
    atm: [],                            // funcionário limpo
    jornada: {},
    faltas: [],
    obs: {},
    esperado: {
      atm: 0, is12: false, dias: [], cpf: '32165498711',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'Caso limpo: nenhuma ocorrência. Exercita o gatilho de fallback da Fase 4.',
  },
  {
    nome: 'FERNANDA COSTA BARROS',
    cpf: '159.753.486-22',
    escala: null,
    atm: [11, 13, 15],
    jornada: {},
    faltas: [],
    obs: {},
    esperado: {
      atm: 3, is12: false, dias: ['11/05/2026 (Seg)', '13/05/2026 (Qua)', '15/05/2026 (Sex)'], cpf: '15975348622',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'Vários ATMs em dias úteis.',
  },

  /* ── FALTAS (docs/REGRA_FALTAS_DSR.md) ─────────────────────────────── */

  {
    nome: 'GISELE ANDRADE PINTO',
    cpf: '741.852.963-01',
    escala: '12x36',
    atm: [],
    jornada: {},
    faltas: [7, 8, 13, 14, 23, 24],     // três pares de dias corridos
    obs: {},
    esperado: {
      atm: 0, is12: true, dias: [], cpf: '74185296301',
      // F2: conta 7, pula 8; conta 13, pula 14; conta 23, pula 24
      faltaQtd: 3, faltaDsr: 3, faltaConf: 'conferido',
    },
    nota: 'F2: 12x36 com dias corridos — conta o 1º, pula o 2º. DSR = 1 por falta contada.',
  },
  {
    nome: 'HELENA BORGES TAVARES',
    cpf: '852.963.741-02',
    escala: null,
    atm: [],
    jornada: {},
    faltas: [6, 15, 20, 22, 27, 29],    // 20 e 22 na mesma semana; 27 e 29 também
    obs: {},
    esperado: {
      atm: 0, is12: false, dias: [], cpf: '85296374102',
      // Convencional conta todos os dias; DSR por semana distinta (4 semanas)
      faltaQtd: 6, faltaDsr: 4, faltaConf: 'conferido',
    },
    nota: 'Convencional: seis faltas em quatro semanas distintas — QUANTIDADE 6, DSR 4.',
  },
  {
    nome: 'IGOR MENEZES CAMPOS',
    cpf: '963.741.852-03',
    escala: '12x36',
    atm: [],
    jornada: {},
    faltas: Array.from({ length: 30 }, (_, i) => i + 1),   // dias 1 a 30
    obs: {},
    esperado: {
      atm: 0, is12: true, dias: [], cpf: '96374185203',
      // F1 vem antes da F2: 30 >= 29 → integral, sem DSR
      faltaQtd: 30, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'F1: 29, 30 ou 31 faltas contam integralmente, sem dia sim/dia não e sem DSR.',
  },
  {
    nome: 'JULIANA REIS FONSECA',
    cpf: '147.258.369-04',
    escala: null,
    atm: [],
    jornada: {},
    faltas: [2, 4],                     // 2 é sábado — no Guardião ele conta
    obs: {},
    esperado: {
      atm: 0, is12: false, dias: [], cpf: '14725836904',
      // sábado 02 pertence à semana de 27/04; segunda 04 à semana de 04/05
      faltaQtd: 2, faltaDsr: 2, faltaConf: 'conferido',
    },
    nota: 'Convencional: falta em fim de semana CONTA no Guardião (sem filtro de sábado/domingo).',
  },
  {
    nome: 'KLEBER AZEVEDO PRADO',
    cpf: '258.369.147-05',
    escala: null,
    atm: [],
    jornada: {},
    faltas: [],
    obs: {                              // nada disso pode virar falta
      1:  'FERIADO (Dia do Trabalho)',
      5:  'BATIDAS FORA DA MARGEM',
      7:  'batida fora de margem.',
      12: 'ATESTADO 2 DIAS*',
      19: 'PONTO ABONADO COM ACORDO DA DIRECAO',
      26: 'FALTA JUSTIFICADA',
    },
    esperado: {
      atm: 0, is12: false, dias: [], cpf: '25836914705',
      faltaQtd: 0, faltaDsr: null, faltaConf: 'conferido',
    },
    nota: 'Só a palavra FALTA conta: nenhuma outra observação entra, nem "FALTA JUSTIFICADA".',
  },
  {
    nome: 'LARISSA VIEIRA MOTA',
    cpf: '369.147.258-06',
    escala: null,
    atm: [],
    jornada: {},
    faltas: [5, 12],
    obs: {},
    impresso: 4,                        // rodapé mente: diz 4, a coluna tem 2
    esperado: {
      atm: 0, is12: false, dias: [], cpf: '36914725806',
      /* Regra de segurança: leitura que não fecha com o rodapé não manda.
         Sai o total impresso (4), sem DSR, com a linha marcada. */
      faltaQtd: 4, faltaDsr: null, faltaConf: 'divergente',
    },
    nota: 'Conferência: rodapé diz 4 e a coluna tem 2 → cai para o impresso, sem DSR.',
  },
];

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* Geometria copiada do PDF de produção, medida na página renderizada.
   `h` é onde o CABEÇALHO é desenhado, `c` onde o CONTEÚDO começa — e os dois
   NÃO coincidem: no documento real o cabeçalho é centralizado na coluna e o
   texto é alinhado à esquerda. Na coluna OBSERVAÇÃO isso dá 52pt de distância
   entre "OBSERVAÇÃO" e "FALTA", o suficiente para o bucket por x-mais-próximo
   do identifyTableColumns (corte em 50) descartar a célula.

   Enquanto este fixture desenhava cabeçalho e conteúdo no mesmo x, o teste
   passava e o PDF real não era lido. Não alinhe estes valores. */
const COLS = {
  DIA:          { h:  46, c:  40 },
  ENT1:         { h: 120, c: 118 },
  SAI1:         { h: 175, c: 173 },
  ENT2:         { h: 230, c: 228 },
  SAI2:         { h: 285, c: 283 },
  JORNADA:      { h: 348, c: 340 },
  'OBSERVAÇÃO': { h: 468, c: 416 },
};

async function gerar(destino) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const preto = rgb(0, 0, 0);

  for (const p of PAGINAS) {
    const page = doc.addPage([595.28, 841.89]);
    const put = (txt, x, y, f = font, size = 9, color = preto) =>
      page.drawText(txt, { x, y, size, font: f, color });

    put('ACME SERVICOS LTDA - RELATORIO DE FREQUENCIA', 50, 800, bold, 11);
    put(`Periodo: 01/${PERIODO.mes}/${PERIODO.ano} a 31/${PERIODO.mes}/${PERIODO.ano}`, 50, 782);
    /* O item logo após o nome começa com CARGO (que está no ADMIN_STOP),
       então cleanName() corta exatamente no fim do nome. */
    put(`Funcionario: ${p.nome}`, 50, 764, bold, 10);
    put('CARGO OPERADOR', 300, 764);
    if (p.cpf) put(`CPF: ${p.cpf}`, 300, 750);
    if (p.escala) put(`Escala: ${p.escala}`, 50, 746);

    let y = 722;
    for (const [nome, col] of Object.entries(COLS)) put(nome, col.h, y, bold, 9);

    y -= 16;
    for (let dia = 1; dia <= DIAS_NO_MES; dia++) {
      const dt = new Date(+PERIODO.ano, +PERIODO.mes - 1, dia);
      put(`${String(dia).padStart(2, '0')} - ${DOW[dt.getDay()]}`, COLS.DIA.c, y);

      const temFalta = p.faltas.includes(dia);
      if (p.atm.includes(dia)) {
        /* ATM em preto: isTokenDark() precisa medir luminância < 210. */
        put('ATM', COLS.ENT1.c, y, bold, 9, preto);
      } else if (!temFalta) {
        /* Dia de falta fica com as marcações vazias, como no PDF real. */
        put('08:00', COLS.ENT1.c, y);
        put('12:00', COLS.SAI1.c, y);
        put('13:00', COLS.ENT2.c, y);
        put('17:00', COLS.SAI2.c, y);
      }
      /* JORNADA larga, começando à esquerda do próprio cabeçalho — como no
         documento real, onde o valor é "07:00-12:00/13:00-17:00-N". */
      if (p.jornada[dia]) put(p.jornada[dia], COLS.JORNADA.c, y);

      const obs = temFalta ? 'FALTA' : (p.obs[dia] || '');
      if (obs) put(obs, COLS['OBSERVAÇÃO'].c, y);
      y -= 16;
    }

    /* Rodapé: o que a conferência compara com a contagem da coluna. */
    y -= 14;
    const total = (p.impresso !== undefined) ? p.impresso : p.faltas.length;
    put('TOTAL DE FALTAS:', COLS.DIA.c, y, bold, 9);
    put(String(total), COLS.ENT2.c, y, bold, 9);
    y -= 14;
    put('OBSERVAÇÕES:', COLS.DIA.c, y, bold, 9);
  }

  fs.writeFileSync(destino, await doc.save());
  return { paginas: PAGINAS, destino };
}

/* ════════════════════════════════════════════════════════════════
   Segunda página de teste: o LAYOUT DE PRODUÇÃO inteiro.

   As onze colunas do PDF real, com as posições medidas na página
   renderizada. O que importa aqui não são os dados e sim a geometria:

   - cabeçalho OBSERVAÇÃO centralizado em 468, texto da observação
     alinhado à esquerda em 416 — 52pt de distância;
   - JORNADA com valor largo começando em 306, à ESQUERDA do próprio
     cabeçalho em 348.

   Essa combinação é a que fazia o agrupamento por x-mais-próximo
   descartar toda falta. O fixture principal não a reproduzia, e o bug
   passou. Esta página existe para que não passe de novo.
   ════════════════════════════════════════════════════════════════ */
const LAYOUT_PRODUCAO = {
  nome: 'MARCOS TEIXEIRA GOULART',
  cpf: '753.951.456-07',
  escala: '12x36',
  faltas: [7, 8, 13, 14, 23, 24],
  obs: { 3: 'BATIDAS FORA DA MARGEM', 19: 'PONTO ABONADO COM ACORDO DA DIRECAO' },
  esperado: { faltaQtd: 3, faltaDsr: 3, faltaConf: 'conferido' },
  /* h = cabeçalho, c = conteúdo. Não alinhe: o desencontro é o teste. */
  cols: {
    DIA:          { h:  30, c:  30 },
    ENT1:         { h:  68, c:  70 },
    SAI1:         { h: 100, c: 102 },
    ENT2:         { h: 132, c: 134 },
    SAI2:         { h: 164, c: 166 },
    ENT3:         { h: 196, c: 198 },
    SAI3:         { h: 228, c: 230 },
    SALDO:        { h: 256, c: 260 },
    'LOTAÇÃO':    { h: 292, c: 290 },
    JORNADA:      { h: 348, c: 306 },
    'OBSERVAÇÃO': { h: 468, c: 416 },
  },
};

async function gerarLayoutProducao(destino) {
  const p = LAYOUT_PRODUCAO;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const preto = rgb(0, 0, 0);
  const page = doc.addPage([595.28, 841.89]);
  const put = (txt, x, y, f = font, size = 8, color = preto) =>
    page.drawText(txt, { x, y, size, font: f, color });

  put('ACME SERVICOS LTDA - RELATORIO DE PRESTACAO DE SERVICOS', 50, 800, bold, 11);
  put(`Periodo: 01/${PERIODO.mes}/${PERIODO.ano} a 31/${PERIODO.mes}/${PERIODO.ano}`, 50, 782);
  put(`Funcionario: ${p.nome}`, 50, 764, bold, 10);
  put(`CARGO AUXILIAR DE SERVICOS GERAIS DIURNO (${p.escala})`, 300, 764);
  put(`CPF: ${p.cpf}`, 300, 750);

  let y = 722;
  for (const [nome, col] of Object.entries(p.cols)) put(nome, col.h, y, bold, 8);

  y -= 16;
  for (let dia = 1; dia <= DIAS_NO_MES; dia++) {
    const dt = new Date(+PERIODO.ano, +PERIODO.mes - 1, dia);
    put(`${String(dia).padStart(2, '0')} - ${DOW[dt.getDay()]}`, p.cols.DIA.c, y);
    const temFalta = p.faltas.includes(dia);
    if (!temFalta) {
      put('06:53', p.cols.ENT1.c, y);
      put('19:01', p.cols.SAI1.c, y);
    }
    put('00:00', p.cols.SALDO.c, y);
    put('HDEBO -', p.cols['LOTAÇÃO'].c, y);
    /* O valor largo da JORNADA, começando à esquerda do cabeçalho. */
    put('07:00-12:00/13:00-17:00-N', p.cols.JORNADA.c, y);
    const obs = temFalta ? 'FALTA' : (p.obs[dia] || '');
    if (obs) put(obs, p.cols['OBSERVAÇÃO'].c, y);
    y -= 16;
  }

  y -= 14;
  put('LEGENDAS: N - ESCALA NORMAL, EC - EXTENSAO DE CARGA HORARIA', p.cols.DIA.c, y, font, 7);
  y -= 14;
  put('SALDO DE HORAS', p.cols.DIA.c, y, bold, 8);
  put('0 HORA(S) E 0 MINUTO(S)', p.cols.ENT2.c, y);
  y -= 14;
  put('TOTAL DE FALTAS:', p.cols.DIA.c, y, bold, 8);
  put(String(p.faltas.length), p.cols.ENT2.c, y, bold, 8);
  y -= 14;
  put('OBSERVAÇÕES:', p.cols.DIA.c, y, bold, 8);

  fs.writeFileSync(destino, await doc.save());
  return { destino, pagina: LAYOUT_PRODUCAO };
}

if (require.main === module) {
  const destino = process.argv[2] || 'ponto-sintetico.pdf';
  gerar(destino).then(({ paginas }) => {
    console.log(`PDF sintético gerado: ${destino} (${paginas.length} páginas)`);
    for (const p of paginas) {
      console.log(`  ${p.nome}: ${p.esperado.atm} ATM, ${p.esperado.faltaQtd} faltas, DSR ${p.esperado.faltaDsr ?? '—'} — ${p.nota}`);
    }
    const alvoLayout = destino.replace(/\.pdf$/i, '') + '-layout-producao.pdf';
    return gerarLayoutProducao(alvoLayout).then(({ pagina }) => {
      console.log(`PDF de layout de produção gerado: ${alvoLayout}`);
      console.log(`  ${pagina.nome}: ${pagina.esperado.faltaQtd} faltas, DSR ${pagina.esperado.faltaDsr}`);
    });
  });
}

module.exports = { gerar, gerarLayoutProducao, PAGINAS, LAYOUT_PRODUCAO };
