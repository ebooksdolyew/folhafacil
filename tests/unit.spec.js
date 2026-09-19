/**
 * Testes unitários das funções puras do GHUB.
 *
 * O app é single-file: as funções vivem no <script> inline do index.html.
 * Em vez de refatorar (o que descaracterizaria o modelo), os testes carregam
 * a página real e chamam as funções no contexto dela. Nenhum mock do motor.
 *
 * Casos derivados da seção 8.2 do plano de correções v2.2 → v2.3.
 */
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof extractSaldoHoras === 'function');
});

/* ── Estado vazio: regressão do ReferenceError `only` (correção 1.1) ── */
test.describe('Estado vazio da tabela', () => {
  test('renderTable com allEmps = [] não lança exceção', async ({ page }) => {
    const r = await page.evaluate(() => {
      allEmps = [];
      try { renderTable(); return { ok: true, html: document.getElementById('tbd').textContent.trim() }; }
      catch (e) { return { ok: false, erro: String(e) }; }
    });
    expect(r.ok, r.erro).toBe(true);
    expect(r.html).toContain('Nenhum funcionário reconhecido');
  });

  test('renderTable com filtro ativo e zero resultado não lança exceção', async ({ page }) => {
    const r = await page.evaluate(() => {
      allEmps = [{ name: 'TESTE', atm: 0, is12: false, atmDays: [], totalFaltas: 0, saldoHoras: null }];
      document.getElementById('fa').checked = true;      // apenas atestados
      document.getElementById('srch').value = '';        // busca vazia
      try { renderTable(); return { ok: true, html: document.getElementById('tbd').textContent.trim() }; }
      catch (e) { return { ok: false, erro: String(e) }; }
      finally { document.getElementById('fa').checked = false; }
    });
    expect(r.ok, r.erro).toBe(true);
    expect(r.html).toContain('filtros selecionados');
  });

  test('renderTable com busca sem resultado não lança exceção', async ({ page }) => {
    const r = await page.evaluate(() => {
      allEmps = [{ name: 'TESTE', atm: 1, is12: false, atmDays: [], totalFaltas: 0, saldoHoras: null }];
      document.getElementById('srch').value = 'inexistente_zzz';
      try { renderTable(); return { ok: true, html: document.getElementById('tbd').textContent.trim() }; }
      catch (e) { return { ok: false, erro: String(e) }; }
      finally { document.getElementById('srch').value = ''; }
    });
    expect(r.ok, r.erro).toBe(true);
    expect(r.html).toContain('inexistente_zzz');
  });
});

/* ── Saldo de horas: regressão do bug do "-0" ── */
test.describe('extractSaldoHoras', () => {
  const saldo = (txt) => ({ rows: [{ text: `SALDO DE HORAS ${txt}`, cells: [] }], full: `SALDO DE HORAS ${txt}` });

  test('-0 HORA(S) E 45 MINUTO(S) → negative true', async ({ page }) => {
    const s = saldo('-0 HORA(S) E 45 MINUTO(S)');
    const r = await page.evaluate(([rows, full]) => extractSaldoHoras(rows, full), [s.rows, s.full]);
    expect(r).toEqual({ hours: 0, minutes: 45, negative: true });
  });

  test('0 HORA(S) E 0 MINUTO(S) → null (saldo zero é ignorado)', async ({ page }) => {
    const s = saldo('0 HORA(S) E 0 MINUTO(S)');
    const r = await page.evaluate(([rows, full]) => extractSaldoHoras(rows, full), [s.rows, s.full]);
    expect(r).toBeNull();
  });

  test('13 HORA(S) E 7 MINUTO(S) sem sinal → negative false', async ({ page }) => {
    const s = saldo('13 HORA(S) E 7 MINUTO(S)');
    const r = await page.evaluate(([rows, full]) => extractSaldoHoras(rows, full), [s.rows, s.full]);
    expect(r).toEqual({ hours: 13, minutes: 7, negative: false });
  });

  test('- 13 HORA(S) E 7 MINUTO(S) com espaço após o sinal → negative true', async ({ page }) => {
    const s = saldo('- 13 HORA(S) E 7 MINUTO(S)');
    const r = await page.evaluate(([rows, full]) => extractSaldoHoras(rows, full), [s.rows, s.full]);
    expect(r.negative).toBe(true);
  });
});

/* ── Datas ── */
test.describe('dateFromDayNumber', () => {
  test('dia 31 em mês de 30 dias → null', async ({ page }) => {
    const r = await page.evaluate(() => dateFromDayNumber(31, { month: 4, year: 2026 })); // abril
    expect(r).toBeNull();
  });

  test('dia 31 em mês de 31 dias → válido', async ({ page }) => {
    const r = await page.evaluate(() => dateFromDayNumber(31, { month: 5, year: 2026 }));
    expect(r.key).toBe('31/05/2026');
  });

  test('29/02 em ano não bissexto → null', async ({ page }) => {
    const r = await page.evaluate(() => dateFromDayNumber(29, { month: 2, year: 2026 }));
    expect(r).toBeNull();
  });

  test('marca fim de semana corretamente (02/05/2026 é sábado)', async ({ page }) => {
    const r = await page.evaluate(() => dateFromDayNumber(2, { month: 5, year: 2026 }));
    expect(r.isWeekend).toBe(true);
    expect(r.display).toContain('Sáb');
  });

  test('dia útil não é marcado como fim de semana (04/05/2026 é segunda)', async ({ page }) => {
    const r = await page.evaluate(() => dateFromDayNumber(4, { month: 5, year: 2026 }));
    expect(r.isWeekend).toBe(false);
  });

  test('sem período → null', async ({ page }) => {
    expect(await page.evaluate(() => dateFromDayNumber(10, null))).toBeNull();
  });
});

/* ── isWeekendDay: aceita a forma acentuada e a normalizada ── */
test.describe('isWeekendDay', () => {
  for (const [txt, esperado] of [['SÁB', true], ['SAB', true], ['DOM', true], ['SEG', false], ['SEX', false], ['', false]]) {
    test(`"${txt}" → ${esperado}`, async ({ page }) => {
      expect(await page.evaluate(t => isWeekendDay(t), txt)).toBe(esperado);
    });
  }
});

/* ── Reconhecimento de ATM: documenta o comportamento REAL dos dois motores.
      Ver docs/LIMITACOES_CONHECIDAS.md, divergência A. ── */
test.describe('Reconhecimento de ATM', () => {
  const tabular = (t) => /\bATM\b/.test(t) || /^[AM]+$/.test(t) || /MAT|ATM|ATMA/.test(t);

  test('ATM_RX (motor legado, estrito) NÃO casa com MATRÍCULA', async ({ page }) => {
    expect(await page.evaluate(() => ATM_RX.test('MATRÍCULA'))).toBe(false);
  });

  test('ATM_RX casa com ATM isolado', async ({ page }) => {
    expect(await page.evaluate(() => ATM_RX.test('ATM'))).toBe(true);
  });

  test('ATM_RX não casa com ATM colado a outras letras', async ({ page }) => {
    expect(await page.evaluate(() => ATM_RX.test('ATMOSFERA'))).toBe(false);
  });

  /* Estes dois documentam a divergência A: o motor tabular é mais frouxo.
     Se algum dia a linha for alinhada ao ATM_RX, estes testes mudam junto. */
  test('motor tabular HOJE casa com MATRÍCULA (falso positivo em potencial)', () => {
    expect(tabular('MATRÍCULA')).toBe(true);
  });

  test('motor tabular HOJE casa com "AM" isolado', () => {
    expect(tabular('AM')).toBe(true);
  });
});

/* ── FALTAS: funções puras da regra do Guardião.
      Especificação em docs/REGRA_FALTAS_DSR.md. Caminho separado do ATM. ── */

test.describe('normObs — normalização da coluna OBSERVAÇÃO', () => {
  const casos = [
    ['FALTA', 'FALTA'],
    ['  falta  ', 'FALTA'],
    ['Falta.', 'FALTA'],
    ['FALTA:', 'FALTA'],
    ['batida fora de margem.', 'BATIDA FORA DE MARGEM'],
    ['ATESTADO 2 DIAS*', 'ATESTADO 2 DIAS'],
    ['OBSERVAÇÃO', 'OBSERVACAO'],
    ['OBSERVAÇÕES', 'OBSERVACOES'],
    ['FALTA  JUSTIFICADA', 'FALTA JUSTIFICADA'],
    ['', ''],
  ];
  for (const [entrada, saida] of casos) {
    test(`"${entrada}" → "${saida}"`, async ({ page }) => {
      expect(await page.evaluate(t => normObs(t), entrada)).toBe(saida);
    });
  }

  test('null e undefined não quebram', async ({ page }) => {
    expect(await page.evaluate(() => [normObs(null), normObs(undefined)])).toEqual(['', '']);
  });
});

test.describe('contarFaltasPorEscala', () => {
  const contar = (page, dias, is12) =>
    page.evaluate(({ dias, is12 }) =>
      contarFaltasPorEscala(dias.map(d => ({ day: d })), is12), { dias, is12 });

  test('12×36: dias corridos contam o 1º e pulam o 2º', async ({ page }) => {
    const r = await contar(page, [7, 8, 13, 14, 23, 24], true);
    expect(r.contados).toEqual([7, 13, 23]);
    expect(r.pulados).toEqual([8, 14, 24]);
    expect(r.mesCheio).toBe(false);
  });

  test('12×36: sequência de três conta o 1º e o 3º', async ({ page }) => {
    const r = await contar(page, [5, 6, 7], true);
    expect(r.contados).toEqual([5, 7]);
    expect(r.pulados).toEqual([6]);
  });

  test('12×36: faltas isoladas contam todas', async ({ page }) => {
    const r = await contar(page, [5, 12, 19], true);
    expect(r.contados).toEqual([5, 12, 19]);
    expect(r.pulados).toEqual([]);
  });

  test('Convencional: todos os dias contam, fim de semana inclusive', async ({ page }) => {
    const r = await contar(page, [2, 3, 4], false);   // 02 e 03/05/2026 são sábado e domingo
    expect(r.contados).toEqual([2, 3, 4]);
    expect(r.pulados).toEqual([]);
  });

  /* F1 vem antes da F2: 29, 30 e 31 saem integrais, sem dia sim/dia não. */
  for (const n of [29, 30, 31]) {
    test(`${n} faltas em 12×36 saem integrais (mês inteiro)`, async ({ page }) => {
      const r = await contar(page, Array.from({ length: n }, (_, i) => i + 1), true);
      expect(r.contados.length).toBe(n);
      expect(r.pulados).toEqual([]);
      expect(r.mesCheio).toBe(true);
    });
  }

  test('28 faltas corridas em 12×36 ainda passam pela regra de dias corridos', async ({ page }) => {
    const r = await contar(page, Array.from({ length: 28 }, (_, i) => i + 1), true);
    expect(r.mesCheio).toBe(false);
    expect(r.contados.length).toBe(14);
  });

  test('entrada fora de ordem é ordenada antes de aplicar a regra', async ({ page }) => {
    const r = await contar(page, [8, 7], true);
    expect(r.contados).toEqual([7]);
    expect(r.pulados).toEqual([8]);
  });
});

test.describe('dsrDeFaltas', () => {
  const MAIO = { month: 5, year: 2026 };   // 01/05/2026 = sexta
  const dsr = (page, contados, is12, mesCheio = false, period = MAIO) =>
    page.evaluate(({ contados, is12, period, mesCheio }) =>
      dsrDeFaltas(contados, is12, period, mesCheio), { contados, is12, period, mesCheio });

  test('12×36: uma DSR por falta contada', async ({ page }) => {
    expect(await dsr(page, [7, 13, 23], true)).toBe(3);
  });

  test('Convencional: duas faltas na mesma semana geram uma DSR', async ({ page }) => {
    expect(await dsr(page, [20, 22], false)).toBe(1);
  });

  test('Convencional: seis faltas em quatro semanas geram quatro DSR', async ({ page }) => {
    expect(await dsr(page, [6, 15, 20, 22, 27, 29], false)).toBe(4);
  });

  test('Convencional: sábado pertence à semana da segunda anterior', async ({ page }) => {
    /* 02/05 é sábado (semana de 27/04); 04/05 é segunda (semana de 04/05) */
    expect(await dsr(page, [2, 4], false)).toBe(2);
  });

  test('mês inteiro não gera DSR', async ({ page }) => {
    expect(await dsr(page, [1, 2, 3], true, true)).toBe(null);
  });

  test('sem faltas contadas não gera DSR', async ({ page }) => {
    expect(await dsr(page, [], false)).toBe(null);
  });

  test('sem período não gera DSR', async ({ page }) => {
    expect(await dsr(page, [5], false, false, null)).toBe(null);
  });
});

test.describe('lerTotalFaltasImpresso', () => {
  const ler = (page, texto) =>
    page.evaluate(t => lerTotalFaltasImpresso([{ text: t, cells: [] }], t), texto);

  test('rótulo com número na mesma linha', async ({ page }) => {
    expect(await ler(page, 'TOTAL DE FALTAS: 6')).toEqual({ encontrado: true, valor: 6 });
  });

  /* Zero e ausente PRECISAM ser distinguíveis: é o que sustenta o estado
     "sem conferência" da regra. */
  test('zero é encontrado, não ausente', async ({ page }) => {
    expect(await ler(page, 'TOTAL DE FALTAS: 0')).toEqual({ encontrado: true, valor: 0 });
  });

  test('sem o rótulo, nada é encontrado', async ({ page }) => {
    expect(await ler(page, 'SALDO DE HORAS 0 HORA(S)')).toEqual({ encontrado: false, valor: 0 });
  });
});

test.describe('findObsCol', () => {
  const achar = (page, headers) =>
    page.evaluate(hs => {
      const allColumns = {};
      hs.forEach((h, i) => { allColumns[h] = { header: h, x: i * 50, cells: [] }; });
      const col = findObsCol({ allColumns });
      return col ? col.header : null;
    }, headers);

  test('acha OBSERVAÇÃO', async ({ page }) => {
    expect(await achar(page, ['DIA', 'ENT1', 'OBSERVAÇÃO'])).toBe('OBSERVAÇÃO');
  });

  test('acha OBSERVACAO sem acento', async ({ page }) => {
    expect(await achar(page, ['DIA', 'OBSERVACAO'])).toBe('OBSERVACAO');
  });

  /* O rodapé traz um bloco livre "OBSERVAÇÕES:" que não é a coluna. */
  test('não confunde com o plural OBSERVAÇÕES', async ({ page }) => {
    expect(await achar(page, ['DIA', 'ENT1', 'OBSERVAÇÕES'])).toBe(null);
  });

  test('sem a coluna, devolve null', async ({ page }) => {
    expect(await achar(page, ['DIA', 'ENT1', 'JORNADA'])).toBe(null);
  });
});
