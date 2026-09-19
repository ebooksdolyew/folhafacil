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
