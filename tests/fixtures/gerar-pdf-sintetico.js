/**
 * Gera uma folha de ponto SINTÉTICA para testes de regressão do GHUB.
 *
 * Os dados são fictícios de ponta a ponta — nenhum dado real de funcionário
 * entra no repositório. O layout reproduz o que o motor tabular espera:
 * cabeçalho DIA / ENT1 / SAI1 / ENT2 / SAI2 / JORNADA e uma linha por dia.
 *
 * Uso:  node tests/fixtures/gerar-pdf-sintetico.js [saida.pdf]
 * Requer: npm i pdf-lib@1.17.1
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

/* Maio/2026 — 01/05 é sexta-feira. Sábados: 2, 9, 16, 23, 30. Domingos: 3, 10, 17, 24, 31. */
const PERIODO = { mes: '05', ano: '2026' };

/**
 * Cada página descreve um funcionário. `atm` lista os dias com ATM na coluna
 * ENT1; `jornada` define o texto da coluna JORNADA por dia (ausente = vazio).
 * `esperado` é a verdade conferida à mão — o que o GHUB DEVE produzir.
 */
const PAGINAS = [
  {
    nome: 'ANTONIO PEREIRA LIMA',
    escala: null,                       // Convencional
    atm: [4, 5, 9],                     // 9 é sábado → REGRA 1 rejeita
    jornada: {},
    esperado: { atm: 2, is12: false, dias: ['04/05/2026 (Seg)', '05/05/2026 (Ter)'] },
    nota: 'REGRA 1: ATM em dia útil conta; ATM em sábado é descartado.',
  },
  {
    nome: 'BEATRIZ SOUZA ROCHA',
    escala: '12x36',
    atm: [2, 6],                        // 2 é sábado → válido em 12x36
    jornada: { 2: '07:00-19:00', 6: '07:00-19:00' },
    esperado: { atm: 2, is12: true, dias: ['02/05/2026 (Sáb)', '06/05/2026 (Qua)'] },
    nota: 'REGRA 2: 12x36 com JORNADA preenchida conta, inclusive em fim de semana.',
  },
  {
    nome: 'CARLOS EDUARDO NUNES',
    escala: '12x36',
    atm: [8, 12],
    jornada: { 8: '07:00-19:00' },      // dia 12 sem JORNADA → rejeitado
    esperado: { atm: 1, is12: true, dias: ['08/05/2026 (Sex)'] },
    nota: 'REGRA 2: 12x36 com JORNADA vazia é rejeitado.',
  },
  {
    nome: 'DANIELA MARTINS ALVES',
    escala: '12x36',
    atm: [14],
    jornada: { 14: 'Folga' },           // caso da divergência da Fase 4
    esperado: { atm: 1, is12: true, dias: ['14/05/2026 (Qui)'] },
    nota: 'FASE 4: 12x36 com JORNADA="Folga". O motor tabular conta; o legado descartaria.',
  },
  {
    nome: 'EDUARDO SANTOS RIBEIRO',
    escala: null,
    atm: [],                            // funcionário limpo
    jornada: {},
    esperado: { atm: 0, is12: false, dias: [] },
    nota: 'Caso limpo: nenhuma ocorrência. Exercita o gatilho de fallback da Fase 4.',
  },
  {
    nome: 'FERNANDA COSTA BARROS',
    escala: null,
    atm: [11, 13, 15],
    jornada: {},
    esperado: { atm: 3, is12: false, dias: ['11/05/2026 (Seg)', '13/05/2026 (Qua)', '15/05/2026 (Sex)'] },
    nota: 'Vários ATMs em dias úteis.',
  },
];

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const COLS = { DIA: 50, ENT1: 120, SAI1: 190, ENT2: 260, SAI2: 330, JORNADA: 400 };

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
    if (p.escala) put(`Escala: ${p.escala}`, 50, 746);

    let y = 710;
    for (const [h, x] of Object.entries(COLS)) put(h, x, y, bold, 9);

    y -= 20;
    for (let dia = 1; dia <= 20; dia++) {
      const dt = new Date(+PERIODO.ano, +PERIODO.mes - 1, dia);
      put(String(dia).padStart(2, '0'), COLS.DIA, y);
      put(DOW[dt.getDay()], COLS.DIA + 22, y);

      if (p.atm.includes(dia)) {
        /* ATM em preto: isTokenDark() precisa medir luminância < 210. */
        put('ATM', COLS.ENT1, y, bold, 9, preto);
      } else {
        put('08:00', COLS.ENT1, y);
        put('12:00', COLS.SAI1, y);
        put('13:00', COLS.ENT2, y);
        put('17:00', COLS.SAI2, y);
      }
      if (p.jornada[dia]) put(p.jornada[dia], COLS.JORNADA, y);
      y -= 18;
    }
  }

  fs.writeFileSync(destino, await doc.save());
  return { paginas: PAGINAS, destino };
}

if (require.main === module) {
  const destino = process.argv[2] || 'ponto-sintetico.pdf';
  gerar(destino).then(({ paginas }) => {
    console.log(`PDF sintético gerado: ${destino} (${paginas.length} páginas)`);
    for (const p of paginas) console.log(`  ${p.nome}: ${p.esperado.atm} ATM — ${p.nota}`);
  });
}

module.exports = { gerar, PAGINAS };
