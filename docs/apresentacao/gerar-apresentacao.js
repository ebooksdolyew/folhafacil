const PptxGenJS = require('pptxgenjs');
const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';            // 13.33 x 7.5
pres.author = 'Folha Facil';
pres.title  = 'Folha Facil - como funcionam as duas ferramentas';

const W = 13.33, H = 7.5, M = 0.7;
const NAVY  = '21295C';
const DEEP  = '065A82';
const TEAL  = '1C7293';
const AMBER = 'D98A21';
const INK   = '1B2437';
const BODY  = '3C4858';
const MUTED = '78859B';
const CARD  = 'EFF3F8';
const CARD2 = 'E4EDF3';
const WHITE = 'FFFFFF';
const HEAD = 'Cambria', TXT = 'Calibri';

const sh = () => ({ type: 'outer', color: '8FA0B5', blur: 10, offset: 2, angle: 90, opacity: 0.35 });

function slide(bg) {
  const s = pres.addSlide();
  s.background = { color: bg || WHITE };
  return s;
}

function heading(s, eyebrow, title, dark) {
  s.addText(eyebrow.toUpperCase(), {
    x: M, y: 0.40, w: W - 2 * M, h: 0.28, isTextBox: true, margin: 0,
    fontFace: TXT, fontSize: 11.5, bold: true, charSpacing: 2,
    color: dark ? 'E9B563' : AMBER
  });
  s.addText(title, {
    x: M, y: 0.70, w: W - 2 * M, h: 0.86, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: title.length > 46 ? 28 : 32, bold: true, color: dark ? WHITE : NAVY, valign: 'top'
  });
}

function card(s, x, y, w, h, fill) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.10, fill: { color: fill || CARD }, line: { color: fill || CARD }, shadow: sh()
  });
}

function disk(s, x, y, d, fill, label, labColor, fs) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addText(label, {
    x, y, w: d, h: d, isTextBox: true, margin: 0, align: 'center', valign: 'middle',
    fontFace: TXT, fontSize: fs || 15, bold: true, color: labColor || WHITE
  });
}

function body(s, txt, x, y, w, h, opt) {
  s.addText(txt, Object.assign({
    x, y, w, h, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14,
    color: BODY, lineSpacing: 20, valign: 'top'
  }, opt || {}));
}

function tbl(s, rows, x, y, w, colW, opt) {
  s.addTable(rows, Object.assign({
    x, y, w, colW, border: { type: 'solid', color: 'D3DCE6', pt: 0.75 },
    fontFace: TXT, fontSize: 12, color: BODY, valign: 'middle',
    rowH: 0.33, margin: 0.07, autoPage: false
  }, opt || {}));
}

function hrow(cells, fill) {
  return cells.map(t => ({ text: t, options: { bold: true, color: WHITE, fill: { color: fill || NAVY }, fontSize: 11.5 } }));
}

/* ------------------------------------------------------------------ 1 capa */
{
  const s = slide(NAVY);
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: -1.5, w: 5.6, h: 5.6, fill: { color: '2E3A73' }, line: { color: '2E3A73' } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.2, y: 3.6, w: 3.4, h: 3.4, fill: { color: '1A2150' }, line: { color: '1A2150' } });
  s.addText('DEPARTAMENTO PESSOAL - SEPOG / SME', {
    x: M, y: 1.75, w: 9, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT,
    fontSize: 12, bold: true, charSpacing: 2.5, color: 'E9B563'
  });
  s.addText('Folha Fácil', {
    x: M, y: 2.15, w: 9, h: 1.25, isTextBox: true, margin: 0,
    fontFace: HEAD, fontSize: 60, bold: true, color: WHITE
  });
  s.addText('Duas ferramentas, explicadas do começo ao fim: o que cada uma faz, como cada regra escrita nos arquivos .md é aplicada e quanto tempo elas devolvem no dia de trabalho.', {
    x: M, y: 3.5, w: 8.2, h: 1.1, isTextBox: true, margin: 0,
    fontFace: TXT, fontSize: 16, color: 'C9D4E8', lineSpacing: 26
  });
  const chips = [['Guardião Sepog', 'PDF de frequências'], ['Infrequência SME', 'Planilha de ponto']];
  chips.forEach((c, i) => {
    const x = M + i * 4.0;
    s.addShape(pres.ShapeType.roundRect, { x, y: 4.95, w: 3.7, h: 0.95, rectRadius: 0.1, fill: { color: '2E3A73' }, line: { color: '2E3A73' } });
    s.addText(c[0], { x: x + 0.25, y: 5.08, w: 3.2, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14, bold: true, color: WHITE });
    s.addText(c[1], { x: x + 0.25, y: 5.42, w: 3.2, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 11.5, color: 'A9B8D6' });
  });
  s.addText('Tudo processado no navegador — nenhum arquivo sai do computador.', {
    x: M, y: 6.5, w: 9, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 12, italic: true, color: '8E9EC2' });
  s.addNotes('Abertura. O Folha Facil e um site estatico com duas ferramentas de departamento pessoal. Nada e enviado para servidor.');
}

/* ------------------------------------------------------- 2 o que e o programa */
{
  const s = slide();
  heading(s, 'Visão geral', 'O que é o Folha Fácil');
  const itens = [
    ['1', 'Um site, duas ferramentas', 'Um seletor no topo da página troca entre elas. Cada uma vive em seu próprio arquivo, para o código de uma nunca esbarrar no da outra.'],
    ['2', 'Nada é instalado', 'É uma página estática. Abre no navegador do trabalho, sem build, sem login, sem banco de dados.'],
    ['3', 'Nenhum arquivo sai daqui', 'Leitura, cálculo e geração acontecem dentro do navegador. Nenhuma requisição a terceiros — fontes e bibliotecas ficam no próprio domínio.']
  ];
  itens.forEach((it, i) => {
    const y = 1.72 + i * 1.62;
    disk(s, M, y + 0.06, 0.52, DEEP, it[0]);
    s.addText(it[1], { x: M + 0.78, y: y, w: 6.0, h: 0.35, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 16, bold: true, color: NAVY });
    body(s, it[2], M + 0.78, y + 0.42, 6.0, 1.0, { fontSize: 13.5, color: BODY });
  });
  card(s, 7.85, 1.72, 4.78, 4.9, CARD);
  s.addText('Por que isso importa', { x: 8.2, y: 2.0, w: 4.1, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 19, bold: true, color: NAVY });
  body(s, [
    { text: 'Folha de ponto tem nome, CPF e atestado médico — dado pessoal sensível de saúde.', options: { bullet: true, breakLine: true } },
    { text: 'Processamento local significa que esses dados não trafegam nem ficam guardados em lugar nenhum.', options: { bullet: true, breakLine: true } },
    { text: 'A política de segurança do site (CSP) bloqueia qualquer chamada externa.', options: { bullet: true, breakLine: true } },
    { text: 'Planilhas e PDFs reais estão bloqueados no controle de versão, para nunca subirem por engano.', options: { bullet: true } }
  ], 8.2, 2.5, 4.1, 3.8, { fontSize: 13.5, paraSpaceAfter: 10, lineSpacing: 19 });
  s.addNotes('O ponto de partida: e um site estatico, roda no navegador, e o processamento local e uma exigencia de LGPD, nao um detalhe tecnico.');
}

/* ------------------------------------------------------ 3 as duas lado a lado */
{
  const s = slide();
  heading(s, 'Comparativo', 'As duas ferramentas, lado a lado');
  const cols = [
    { x: M, cor: DEEP, nome: 'Guardião Sepog', sub: 'Aba padrão · index.html',
      ent: 'PDF de frequências (o espelho do ponto)',
      lin: ['Atestados (ATM) dia a dia', 'Faltas lidas da coluna OBSERVAÇÃO', 'Atrasos por dia e saldo de horas', 'Escala lida do CARGO no cabeçalho'],
      sai: 'Tabela na tela · PDF anotado · Planilha XLSX · Relatório TXT' },
    { x: 6.95, cor: TEAL, nome: 'Infrequência SME', sub: 'Segunda aba · infrequencia.html',
      ent: 'Planilha mensal de ponto (.xlsx, .xlsm ou .csv)',
      lin: ['Dias marcados F (falta), A (atestado), D (TRE)', 'Confere o recontado com o declarado', 'Escala deduzida pela função', 'Mês de referência e dia da semana'],
      sai: 'Planilha no modelo da folha · Planilha detalhada' }
  ];
  cols.forEach(c => {
    card(s, c.x, 1.65, 5.68, 5.0, CARD);
    s.addShape(pres.ShapeType.roundRect, { x: c.x, y: 1.65, w: 5.68, h: 0.92, rectRadius: 0.10, fill: { color: c.cor }, line: { color: c.cor } });
    s.addText(c.nome, { x: c.x + 0.3, y: 1.78, w: 5.1, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 21, bold: true, color: WHITE });
    s.addText(c.sub, { x: c.x + 0.3, y: 2.17, w: 5.1, h: 0.28, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 11.5, color: 'D6E4EE' });
    s.addText('ENTRA', { x: c.x + 0.3, y: 2.78, w: 5.1, h: 0.25, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 10.5, bold: true, charSpacing: 1.5, color: AMBER });
    body(s, c.ent, c.x + 0.3, 3.03, 5.1, 0.5, { fontSize: 13.5, bold: true, color: INK });
    s.addText('O QUE ELA LÊ E DECIDE', { x: c.x + 0.3, y: 3.62, w: 5.1, h: 0.25, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 10.5, bold: true, charSpacing: 1.5, color: AMBER });
    body(s, c.lin.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < c.lin.length - 1 } })), c.x + 0.3, 3.88, 5.1, 1.5, { fontSize: 13, paraSpaceAfter: 6, lineSpacing: 18 });
    s.addText('SAI', { x: c.x + 0.3, y: 5.52, w: 5.1, h: 0.25, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 10.5, bold: true, charSpacing: 1.5, color: AMBER });
    body(s, c.sai, c.x + 0.3, 5.78, 5.1, 0.7, { fontSize: 13.5, bold: true, color: INK });
  });
  s.addText('São programas diferentes, com regras próprias: os números podem divergir de propósito.', {
    x: M, y: 6.82, w: W - 2 * M, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 12, italic: true, color: MUTED });
  s.addNotes('Cada ferramenta resolve um documento diferente. Nao sao duas versoes da mesma coisa.');
}

/* ------------------------------------------- 4 fluxo Guardiao */
{
  const s = slide();
  heading(s, 'Guardião Sepog', 'O caminho do arquivo, passo a passo');
  const pas = [
    ['1', 'Abre o PDF', 'A página lê o PDF direto no navegador e separa cada funcionário em uma página.'],
    ['2', 'Monta a tabela', 'Reconhece as onze colunas do documento pela posição do texto: DIA, entradas e saídas, SALDO, LOTAÇÃO, JORNADA e OBSERVAÇÃO.'],
    ['3', 'Descobre a escala', 'Lê o CARGO do cabeçalho para saber se o funcionário é 12×36 ou Convencional.'],
    ['4', 'Aplica as regras', 'Atestado, falta, DSR e atraso — cada um por um caminho próprio, sem nada em comum.'],
    ['5', 'Confere e exporta', 'Compara o que leu com os totais impressos no rodapé e só então gera os arquivos.']
  ];
  const cw = 2.22, gap = 0.245;
  pas.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.05, cw, 3.55, i % 2 ? CARD2 : CARD);
    disk(s, x + 0.26, 2.28, 0.52, i < 3 ? DEEP : AMBER, p[0]);
    s.addText(p[1], { x: x + 0.26, y: 2.98, w: cw - 0.52, h: 0.6, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14.5, bold: true, color: NAVY });
    body(s, p[2], x + 0.26, 3.62, cw - 0.52, 1.8, { fontSize: 12, lineSpacing: 17 });
    if (i < 4) s.addText('▸', { x: x + cw, y: 3.55, w: 0.245, h: 0.4, isTextBox: true, margin: 0, align: 'center', fontFace: TXT, fontSize: 16, color: MUTED });
  });
  body(s, 'Se qualquer passo falhar — coluna não encontrada, cabeçalho ilegível — a ferramenta não devolve zero em silêncio: ela avisa. Esse é o princípio que sustenta tudo o que vem a seguir.', M, 6.0, W - 2 * M, 0.7, { fontSize: 13.5, italic: true, color: INK });
  s.addNotes('Cinco passos. O passo 5 e o que diferencia: a ferramenta confere o proprio trabalho antes de exportar.');
}

/* ------------------------------------------- 5 saidas Guardiao */
{
  const s = slide();
  heading(s, 'Guardião Sepog', 'As quatro saídas — e para que serve cada uma');
  const outs = [
    ['Tabela na tela', 'Conferência', 'Mostra o número CRU impresso no PDF — sem regra de escala, sem DSR. É com ele que você compara o documento em mãos. Expandir a linha revela as datas de atestado, de falta e de atraso.', DEEP],
    ['Relatório TXT', 'Conferência', 'Mesma lógica da tela: repete o que o PDF diz, para servir de registro simples do que foi lido.', DEEP],
    ['Planilha XLSX', 'Vai para a folha', 'Aqui sim entra a QUANTIDADE tratada pelas regras de escala, a coluna DSR e, quando necessário, a coluna Conferência com o aviso.', AMBER],
    ['PDF anotado', 'Evidência', 'O documento original com as marcações do que foi identificado, para anexar ao processo.', TEAL]
  ];
  outs.forEach((o, i) => {
    const x = M + (i % 2) * 6.25, y = 1.72 + Math.floor(i / 2) * 2.45;
    card(s, x, y, 5.9, 2.15, CARD);
    s.addText(o[0], { x: x + 0.35, y: y + 0.28, w: 3.4, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 19, bold: true, color: NAVY });
    s.addShape(pres.ShapeType.roundRect, { x: x + 4.05, y: y + 0.28, w: 1.5, h: 0.35, rectRadius: 0.16, fill: { color: o[3] }, line: { color: o[3] } });
    s.addText(o[1], { x: x + 4.05, y: y + 0.28, w: 1.5, h: 0.35, isTextBox: true, margin: 0, align: 'center', valign: 'middle', fontFace: TXT, fontSize: 10, bold: true, color: WHITE });
    body(s, o[2], x + 0.35, y + 0.78, 5.2, 1.2, { fontSize: 13, lineSpacing: 18 });
  });
  body(s, 'Misturar o número cru com o número tratado tiraria justamente a chance de conferir. Por isso eles vivem em lugares separados.', M, 6.75, W - 2 * M, 0.4, { fontSize: 13, italic: true, color: INK });
  s.addNotes('Duas superficies mostram o numero cru (tela e TXT) e uma mostra o tratado (planilha). E deliberado.');
}

/* ------------------------------------- 6 regra ATM convencional */
{
  const s = slide();
  heading(s, 'REGRA_VALIDACAO_ESCALA.md', 'Atestado: o fim de semana do Convencional não conta');
  body(s, 'Um atestado médico registrado em sábado ou domingo não entra na conta de quem trabalha de segunda a sexta — o funcionário não trabalharia nesse dia.', M, 1.68, 7.3, 0.8, { fontSize: 15, color: INK });
  s.addText('ESCALA CONVENCIONAL', { x: M, y: 2.62, w: 6, h: 0.25, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 11, bold: true, charSpacing: 1.5, color: AMBER });
  const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
  dias.forEach((d, i) => {
    const ok = i < 5, x = M + i * 1.02;
    s.addShape(pres.ShapeType.roundRect, { x, y: 2.95, w: 0.88, h: 0.95, rectRadius: 0.1, fill: { color: ok ? DEEP : 'D5DCE5' }, line: { color: ok ? DEEP : 'D5DCE5' } });
    s.addText(d, { x, y: 3.05, w: 0.88, h: 0.28, isTextBox: true, margin: 0, align: 'center', fontFace: TXT, fontSize: 11, bold: true, color: ok ? WHITE : '6B7789' });
    s.addText(ok ? 'conta' : 'não', { x, y: 3.42, w: 0.88, h: 0.3, isTextBox: true, margin: 0, align: 'center', fontFace: TXT, fontSize: 12, bold: true, color: ok ? 'E9B563' : '6B7789' });
  });
  s.addText('ESCALA 12×36', { x: M, y: 4.25, w: 6, h: 0.25, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 11, bold: true, charSpacing: 1.5, color: AMBER });
  dias.forEach((d, i) => {
    const x = M + i * 1.02;
    s.addShape(pres.ShapeType.roundRect, { x, y: 4.58, w: 0.88, h: 0.95, rectRadius: 0.1, fill: { color: TEAL }, line: { color: TEAL } });
    s.addText(d, { x, y: 4.68, w: 0.88, h: 0.28, isTextBox: true, margin: 0, align: 'center', fontFace: TXT, fontSize: 11, bold: true, color: WHITE });
    s.addText('conta', { x, y: 5.05, w: 0.88, h: 0.3, isTextBox: true, margin: 0, align: 'center', fontFace: TXT, fontSize: 12, bold: true, color: 'C9E7EE' });
  });
  body(s, 'Quem é 12×36 pode trabalhar qualquer dia da semana, então nenhum dia é rejeitado por aí — a regra dele é outra (próximo slide).', M, 5.72, 7.3, 0.8, { fontSize: 13, color: BODY });
  card(s, 8.35, 1.68, 4.28, 4.85, CARD);
  s.addText('O detalhe que importa', { x: 8.68, y: 1.95, w: 3.6, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, 'A rejeição acontece durante a leitura do PDF, não depois.', 8.68, 2.42, 3.6, 0.6, { fontSize: 14, bold: true, color: INK });
  body(s, 'Para o Convencional, um atestado de sábado nunca chega a ser registrado — ele não é contado e depois descartado, ele simplesmente não entra.\n\nIsso mantém a tela, o relatório e a planilha contando a mesma coisa, sem risco de uma superfície mostrar um número que a outra já filtrou.', 8.68, 3.05, 3.6, 3.2, { fontSize: 13, lineSpacing: 18 });
  s.addNotes('Regra de atestado por escala. Rejeicao na extracao, nao depois.');
}

/* ------------------------------------- 7 regra JORNADA 12x36 */
{
  const s = slide();
  heading(s, 'REGRA_JORNADA_12x36.md', 'Atestado no 12×36: só conta com a JORNADA preenchida');
  body(s, 'Para o porteiro em 12×36 não existe filtro de fim de semana. O que decide é outra coisa: a coluna JORNADA da mesma linha. Se ela está vazia, aquele dia não era dia de trabalho — e o atestado não entra na conta.', M, 1.65, 11.9, 0.85, { fontSize: 15, color: INK });
  const rows = [
    hrow(['Dia', 'ENT1', 'JORNADA', 'Resultado'], DEEP),
    ['20/05 (Sex)', 'ATM', '12x36', { text: 'Conta — jornada preenchida', options: { bold: true, color: '166534' } }],
    ['21/05 (Sáb)', 'ATM', '(vazio)', { text: 'Não conta — sem jornada', options: { bold: true, color: '9A2B1F' } }],
    ['22/05 (Dom)', 'ATM', 'Folga', { text: 'Conta — "Folga" é conteúdo', options: { bold: true, color: '166534' } }],
    ['23/05 (Seg)', 'ATM', '12x36', { text: 'Conta — fim de semana não atrapalha', options: { bold: true, color: '166534' } }],
    ['24/05 (Ter)', 'ATM', '(vazio)', { text: 'Não conta — sem jornada', options: { bold: true, color: '9A2B1F' } }]
  ];
  tbl(s, rows, M, 2.72, 7.5, [1.7, 1.0, 1.5, 3.3], { rowH: 0.38 });
  s.addText('5 atestados encontrados   →   3 contabilizados', {
    x: M, y: 5.25, w: 7.5, h: 0.45, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 20, bold: true, color: NAVY });
  card(s, 8.6, 2.72, 4.03, 3.5, CARD);
  s.addText('Por que assim', { x: 8.92, y: 2.98, w: 3.4, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, [
    { text: 'No 12×36 o funcionário não trabalha todos os dias — trabalha um, folga outro.', options: { bullet: true, breakLine: true } },
    { text: 'A JORNADA é o que diz se aquele dia era dele.', options: { bullet: true, breakLine: true } },
    { text: 'Qualquer conteúdo vale: "12x36", "Folga", o que estiver escrito. O que reprova é a célula vazia.', options: { bullet: true } }
  ], 8.92, 3.45, 3.4, 2.6, { fontSize: 13, paraSpaceAfter: 9, lineSpacing: 18 });
  body(s, 'Convencional e 12×36 seguem caminhos isolados no código: mexer em um não altera o outro.', M, 6.3, 11.9, 0.4, { fontSize: 13, italic: true, color: MUTED });
  s.addNotes('A JORNADA vazia e o criterio de rejeicao no 12x36. Substitui o filtro de fim de semana.');
}

/* ------------------------------------- 8 falta pela OBSERVACAO */
{
  const s = slide();
  heading(s, 'REGRA_FALTAS_DSR.md · etapa 1', 'A falta vem da coluna OBSERVAÇÃO — e só a palavra exata');
  body(s, 'A falta em geral não deixa rastro nas colunas de marcação: o dia fica em branco. Ela aparece escrita, por extenso, na coluna OBSERVAÇÃO — e é de lá que a ferramenta lê, dia a dia.', M, 1.65, 11.9, 0.8, { fontSize: 15, color: INK });
  card(s, M, 2.62, 5.85, 3.5, 'E6F0E9');
  s.addText('CONTA COMO FALTA', { x: M + 0.35, y: 2.9, w: 5.1, h: 0.28, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 11, bold: true, charSpacing: 1.5, color: '166534' });
  s.addText('FALTA', { x: M + 0.35, y: 3.25, w: 5.1, h: 0.6, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 34, bold: true, color: '166534' });
  body(s, 'A comparação é por igualdade, nunca por "contém". Só a palavra sozinha, limpa de acento, espaço extra e pontuação final.', M + 0.35, 4.0, 5.1, 1.0, { fontSize: 13.5, color: '1F4A32' });
  card(s, 6.78, 2.62, 5.85, 3.5, 'F3E7E4');
  s.addText('NÃO CONTA (TEXTOS REAIS DO DOCUMENTO)', { x: 7.13, y: 2.9, w: 5.1, h: 0.28, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 11, bold: true, charSpacing: 1.5, color: '9A2B1F' });
  body(s, [
    { text: 'FALTA JUSTIFICADA   ·   FALTA ABONADA', options: { breakLine: true } },
    { text: 'ATESTADO 2 DIAS*', options: { breakLine: true } },
    { text: 'FERIADO (Dia do Trabalho)', options: { breakLine: true } },
    { text: 'BATIDAS FORA DA MARGEM', options: { breakLine: true } },
    { text: 'PONTO ABONADO COM ACORDO DA DIREÇÃO', options: {} }
  ], 7.13, 3.28, 5.1, 1.9, { fontSize: 13.5, bold: true, color: '7A2418', lineSpacing: 21 });
  body(s, 'Se "contém FALTA" bastasse, a falta justificada entraria na folha.', 7.13, 5.3, 5.1, 0.6, { fontSize: 12.5, italic: true, color: '7A2418' });
  body(s, 'A leitura também descarta sozinha tudo o que está abaixo do último dia — legendas, saldo de horas, total de faltas e o bloco de observações do rodapé nunca viram um dia de falta.', M, 6.35, 11.9, 0.7, { fontSize: 13, italic: true, color: MUTED });
  s.addNotes('So a palavra FALTA, por igualdade. Falta justificada e abonada ficam de fora de proposito.');
}

/* ------------------------------------- 9 F1 F2 F3 */
{
  const s = slide();
  heading(s, 'REGRA_FALTAS_DSR.md · etapa 2', 'Contagem por escala: F1, F2 e F3');
  body(s, 'As três são avaliadas nesta ordem. A primeira que se aplicar encerra o cálculo.', M, 1.62, 11.9, 0.35, { fontSize: 14.5, color: INK });
  const regras = [
    ['F1', 'Mês inteiro (29 ou mais)', 'Quem tem 29 faltas ou mais sai com o número integral, sem passar pelas outras regras e sem DSR. O corte é 29 e não 31 porque uma folga ou um dia trabalhado no começo do mês já derrubam o total.', AMBER],
    ['F2', '12×36: dia sim, dia não', 'Dentro de cada sequência de dias corridos, conta o 1º, pula o 2º, conta o 3º. A sequência recomeça quando há um dia sem falta no meio. Falta isolada conta sempre.', DEEP],
    ['F3', 'Convencional: tudo conta', 'Não há filtro de fim de semana aqui. O documento de ponto já só marca falta em dia de trabalho — descartar sábado seria corrigir um problema que ele não tem.', TEAL]
  ];
  regras.forEach((r, i) => {
    const y = 2.12 + i * 1.55;
    card(s, M, y, 7.4, 1.38, i % 2 ? CARD2 : CARD);
    disk(s, M + 0.28, y + 0.36, 0.66, r[3], r[0], WHITE, 15);
    s.addText(r[1], { x: M + 1.12, y: y + 0.16, w: 6.0, h: 0.32, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 15.5, bold: true, color: NAVY });
    body(s, r[2], M + 1.12, y + 0.52, 6.0, 0.8, { fontSize: 12.5, lineSpacing: 16 });
  });
  s.addText('F2 na prática — 12×36', { x: 8.5, y: 2.12, w: 4.1, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  const ex = [
    hrow(['Dias marcados', 'Contam', 'QUANT.'], DEEP),
    ['7, 8', '7', '1'],
    ['5, 6, 7', '5, 7', '2'],
    ['5, 12, 19', '5, 12, 19', '3'],
    ['7, 8, 13, 14, 23, 24', '7, 13, 23', '3'],
    ['1 a 30', 'todos (F1)', '30']
  ];
  tbl(s, ex, 8.5, 2.6, 4.13, [1.85, 1.48, 0.8], { rowH: 0.36, fontSize: 11.5 });
  body(s, '"Quem trabalha dia sim, dia não só pode faltar dia sim, dia não."', 8.5, 5.15, 4.13, 0.8, { fontSize: 13, italic: true, color: INK });
  body(s, 'Na planilha detalhada, os dias pulados aparecem na coluna "Dias não contados" — dá para conferir a decisão linha a linha.', M, 6.85, 11.9, 0.4, { fontSize: 12.5, italic: true, color: MUTED });
  s.addNotes('F1 tem precedencia. F2 e a regra do porteiro. F3 e explicitamente nao fazer nada.');
}

/* ------------------------------------- 10 DSR Guardiao */
{
  const s = slide();
  heading(s, 'REGRA_FALTAS_DSR.md · etapa 3', 'DSR: o descanso semanal que a falta derruba');
  body(s, 'A DSR é calculada só sobre os dias que sobraram depois da contagem por escala — e só para faltas. Atestado e TRE não geram DSR.', M, 1.62, 11.9, 0.5, { fontSize: 15, color: INK });
  const cards3 = [
    ['12×36', 'uma DSR por falta contada', 'Se três faltas corridas viraram duas pela F2, saem duas DSR.', DEEP],
    ['Convencional', 'uma DSR por semana com falta', 'Não importa se foram uma ou quatro faltas naquela semana: a DSR é uma.', TEAL],
    ['Mês inteiro (F1)', 'nenhuma DSR', 'Quem está com o mês cheio fica fora do cálculo — a coluna sai vazia.', AMBER]
  ];
  cards3.forEach((c, i) => {
    const x = M + i * 4.12;
    card(s, x, 2.35, 3.82, 2.1, CARD);
    s.addText(c[0], { x: x + 0.3, y: 2.58, w: 3.2, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 19, bold: true, color: c[3] });
    s.addText(c[1], { x: x + 0.3, y: 2.98, w: 3.25, h: 0.55, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14, bold: true, color: NAVY });
    body(s, c[2], x + 0.3, 3.58, 3.25, 0.8, { fontSize: 12.5, lineSpacing: 16 });
  });
  s.addText('Exemplo — Convencional, seis faltas no mês', { x: M, y: 4.72, w: 7, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  const dsrRows = [
    hrow(['Dia da falta', '06-Qua', '15-Sex', '20-Qua', '22-Sex', '27-Qua', '29-Sex'], DEEP),
    [{ text: 'Semana (segunda)', options: { bold: true, fill: { color: CARD } } }, '04', '11', '18', '18', '25', '25']
  ];
  tbl(s, dsrRows, M, 5.22, 7.6, [1.9, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95], { rowH: 0.38, align: 'center' });
  s.addText('QUANTIDADE 6   ·   DSR 4', { x: M, y: 6.15, w: 7.6, h: 0.45, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 21, bold: true, color: AMBER });
  card(s, 8.6, 4.72, 4.03, 1.9, CARD2);
  body(s, 'Seis faltas, quatro DSR — porque 20 e 22 caem na mesma semana, e 27 e 29 também. Sábado e domingo pertencem à semana da segunda anterior.', 8.92, 4.98, 3.4, 1.4, { fontSize: 13, lineSpacing: 18, color: INK });
  s.addNotes('A DSR nao acompanha o numero de faltas no Convencional: e uma por semana atingida.');
}

/* ------------------------------------- 11 conferencia / trava */
{
  const s = slide();
  heading(s, 'REGRA_FALTAS_DSR.md · etapa 4', 'A trava de segurança: a regra só roda se a leitura fechar');
  body(s, 'Antes de aplicar qualquer regra de escala, a ferramenta compara o que contou na coluna OBSERVAÇÃO com o TOTAL DE FALTAS impresso no rodapé do PDF. Os dois são números crus. Se não baterem, ela não reduz nada.', M, 1.62, 11.9, 0.75, { fontSize: 15, color: INK });
  const rows = [
    hrow(['Estado', 'Quando acontece', 'QUANTIDADE', 'DSR'], DEEP),
    [{ text: 'conferido', options: { bold: true, color: '166534' } }, 'O rodapé foi lido e bate com o contado', 'com as regras', 'calculada'],
    [{ text: 'divergente', options: { bold: true, color: '9A2B1F' } }, 'O rodapé foi lido e não bate', 'total impresso', 'vazia'],
    [{ text: 'sem-conferência', options: { bold: true, color: '8A5A12' } }, 'O PDF não traz TOTAL DE FALTAS', 'com as regras', 'calculada'],
    [{ text: 'sem-leitura', options: { bold: true, color: '9A2B1F' } }, 'A coluna ou o cabeçalho não foram identificados', 'total impresso', 'vazia'],
    [{ text: 'período-divergente', options: { bold: true, color: '8A5A12' } }, 'O dia da semana impresso não bate com o mês', 'com as regras', 'vazia']
  ];
  tbl(s, rows, M, 2.55, 7.6, [1.75, 3.35, 1.35, 1.15], { rowH: 0.42, fontSize: 11.5 });
  card(s, 8.6, 2.55, 4.03, 3.5, CARD);
  s.addText('O pior caso', { x: 8.92, y: 2.82, w: 3.4, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, 'Voltar ao número impresso, sem escala e sem DSR — com um aviso visível na planilha. Nunca menos que isso.', 8.92, 3.28, 3.4, 1.0, { fontSize: 13.5, bold: true, color: INK, lineSpacing: 18 });
  body(s, 'Uma leitura em que não se confia não pode reduzir um número que vai para a folha de pagamento. A DSR fica vazia, não zero: vazio diz "não sei", zero diz "não há".', 8.92, 4.4, 3.4, 1.5, { fontSize: 12.5, lineSpacing: 17 });
  body(s, 'A conferência compara impresso × contado — nunca com a QUANTIDADE final. No 12×36, impresso 6 e quantidade 3 é a regra funcionando, não erro.', M, 6.3, 7.6, 0.7, { fontSize: 12.5, italic: true, color: MUTED });
  s.addNotes('Trava de seguranca: as regras so rodam sobre leitura confirmada. Estado divergente cai para o total impresso.');
}

/* ------------------------------------- 12 fluxo Infrequencia */
{
  const s = slide();
  heading(s, 'Infrequência SME', 'O caminho da planilha, passo a passo');
  const pas = [
    ['1', 'Lê a planilha', 'Encontra sozinha o cabeçalho e as colunas de dia (01/ago, 02/ago…), além de CPF, função, empresa e lotação.'],
    ['2', 'Reconta e confere', 'Reconta os dias marcados F, A e D e compara com os totais que a própria planilha declara.'],
    ['3', 'Deduz a escala', 'Pela função: porteiro (e porteiro diurno/noturno) é 12×36; todas as outras funções são Convencional.'],
    ['4', 'Descobre o calendário', 'O mês de referência é sempre o anterior ao atual. Com mês, ano e dia, o navegador calcula o dia da semana.'],
    ['5', 'Aplica R1 a R4', 'Chega à QUANTIDADE e à DSR de cada funcionário, guardando também os dias que não contaram.'],
    ['6', 'Gera as planilhas', 'Modelo da folha e detalhada, com filtros de empresa, tipo, escala e ausência do mês completo.']
  ];
  const cw = 3.82, ch = 2.1;
  pas.forEach((p, i) => {
    const x = M + (i % 3) * (cw + 0.3), y = 1.78 + Math.floor(i / 3) * (ch + 0.35);
    card(s, x, y, cw, ch, i % 2 ? CARD2 : CARD);
    disk(s, x + 0.28, y + 0.26, 0.5, i < 3 ? TEAL : AMBER, p[0], WHITE, 14);
    s.addText(p[1], { x: x + 0.92, y: y + 0.32, w: cw - 1.2, h: 0.38, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 15, bold: true, color: NAVY });
    body(s, p[2], x + 0.28, y + 0.92, cw - 0.56, 1.05, { fontSize: 12.5, lineSpacing: 17 });
  });
  body(s, 'O passo 4 é o mais delicado: a planilha traz "01/ago" mas não traz o ano. Se a sigla do cabeçalho discordar do mês esperado, a ferramenta não gera nada sem perguntar qual é o mês verdadeiro do arquivo.', M, 6.5, 11.9, 0.7, { fontSize: 13, italic: true, color: INK });
  s.addNotes('Seis passos. Destaque para a deducao do mes de referencia, que e o que sustenta as regras de dia da semana.');
}

/* ------------------------------------- 13 R1 */
{
  const s = slide();
  heading(s, 'docs/regras · R1', 'Mês cheio: 31 sai 31');
  body(s, 'É a primeira verificação de todas. Se o funcionário tem 31 faltas ou 31 atestados no mês, a QUANTIDADE é 31 e nenhuma regra de escala é aplicada àquela linha.', M, 1.65, 7.4, 0.85, { fontSize: 15, color: INK });
  const pts = [
    ['Vale para', 'Faltas (F) e atestados (A). TRE não entra.'],
    ['Por que existe', 'As regras seguintes reduzem o número. Quem passou o mês inteiro afastado precisa continuar saindo como 31.'],
    ['O limite é o número 31', 'Não é "mês inteiro". Em um mês de 30 dias, 30 atestados não acionam a R1 — é um ajuste consciente, anotado na documentação.']
  ];
  pts.forEach((p, i) => {
    const y = 2.72 + i * 1.28;
    disk(s, M, y + 0.04, 0.46, TEAL, String(i + 1), WHITE, 13);
    s.addText(p[0], { x: M + 0.72, y: y, w: 6.6, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 15, bold: true, color: NAVY });
    body(s, p[1], M + 0.72, y + 0.36, 6.6, 0.85, { fontSize: 13, lineSpacing: 17 });
  });
  card(s, 8.4, 1.65, 4.23, 4.9, CARD);
  s.addText('O filtro dos 31', { x: 8.72, y: 1.95, w: 3.6, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, 'Além da regra, existe um jeito de enxergar e exportar só quem chegou a 31 ocorrências no mês, somando faltas + atestados:', 8.72, 2.42, 3.6, 1.0, { fontSize: 13, lineSpacing: 18 });
  body(s, [
    { text: 'a aba "Ausência mês completo" na tela de Conferência;', options: { bullet: true, breakLine: true } },
    { text: 'o filtro de mesmo nome na barra de ações, que limita as duas planilhas a esses funcionários — e marca o arquivo com _SO31.', options: { bullet: true } }
  ], 8.72, 3.45, 3.6, 2.4, { fontSize: 13, paraSpaceAfter: 10, lineSpacing: 18 });
  s.addNotes('R1 tem precedencia sobre tudo. O filtro dos 31 e uma funcionalidade separada, de visualizacao.');
}

/* ------------------------------------- 14 R2 */
{
  const s = slide();
  heading(s, 'docs/regras · R2', '12×36: a falta do dia seguinte não conta');
  body(s, 'Vale só para faltas e só para quem é 12×36 (porteiro, porteiro diurno, porteiro noturno). Dentro de cada sequência de dias corridos: conta o 1º, pula o 2º, conta o 3º, pula o 4º. A sequência recomeça quando aparece um dia sem falta no meio.', M, 1.62, 11.9, 0.85, { fontSize: 15, color: INK });
  const rows = [
    hrow(['Faltas marcadas', 'Contadas', 'Não contadas', 'QUANTIDADE'], TEAL),
    ['5, 6, 7', '5, 7', '6', { text: '2', options: { bold: true, color: NAVY } }],
    ['5, 6', '5', '6', { text: '1', options: { bold: true, color: NAVY } }],
    ['5, 7, 9', '5, 7, 9', '—', { text: '3', options: { bold: true, color: NAVY } }],
    ['5, 6, 7, 8, 9, 10', '5, 7, 9', '6, 8, 10', { text: '3', options: { bold: true, color: NAVY } }],
    ['5, 6, 8, 9', '5, 8', '6, 9', { text: '2', options: { bold: true, color: NAVY } }],
    ['1 a 31 (mês cheio)', 'todos', '—', { text: '31 (R1)', options: { bold: true, color: AMBER } }]
  ];
  tbl(s, rows, M, 2.68, 7.6, [2.2, 1.8, 1.9, 1.7], { rowH: 0.4, fontSize: 12 });
  card(s, 8.6, 2.68, 4.03, 3.3, CARD);
  s.addText('Onde você confere', { x: 8.92, y: 2.95, w: 3.4, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, 'Na planilha detalhada, a coluna Dias lista só os dias que contaram e a coluna Dias não contados lista os que a regra pulou.\n\nNada é descartado em silêncio: a decisão fica escrita ao lado do número.', 8.92, 3.42, 3.4, 2.4, { fontSize: 13, lineSpacing: 18 });
  body(s, 'Atestado e TRE continuam contando dia a dia — a R2 não os alcança.', M, 5.6, 7.6, 0.4, { fontSize: 13, italic: true, color: MUTED });
  s.addNotes('R2 e o espelho da F2 do Guardiao, mas neste programa o limite do mes cheio e 31, nao 29.');
}

/* ------------------------------------- 15 R3 */
{
  const s = slide();
  heading(s, 'docs/regras · R3', 'Convencional: só conta de segunda a sexta');
  body(s, 'Aqui a regra alcança falta, atestado e TRE. Para quem é Convencional, o que cair em sábado ou domingo não conta. Feriado conta normal — segunda a sexta é sempre dia útil para a regra.', M, 1.62, 7.4, 0.85, { fontSize: 15, color: INK });
  s.addText('Exemplo — junho, faltas do dia 1 ao 29 (dia 1 é segunda)', { x: M, y: 2.62, w: 7.4, h: 0.32, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14, bold: true, color: NAVY });
  const rows = [
    hrow(['Faltas marcadas', 'Não contadas (fins de semana)', 'QUANT.'], TEAL),
    ['1 a 29 (29 dias)', '6, 7, 13, 14, 20, 21, 27, 28', { text: '21', options: { bold: true, color: NAVY } }],
    ['1 a 30 (mês de 30 dias)', '6, 7, 13, 14, 20, 21, 27, 28', { text: '22', options: { bold: true, color: NAVY } }]
  ];
  tbl(s, rows, M, 3.02, 7.4, [2.3, 3.7, 1.4], { rowH: 0.42, fontSize: 12 });
  body(s, 'Repare na segunda linha: 30 faltas em um mês de 30 dias não aciona a R1, porque o gatilho é o número 31.', M, 4.32, 7.4, 0.6, { fontSize: 13, italic: true, color: INK });
  s.addText('E de onde vem o dia da semana?', { x: M, y: 5.02, w: 7.4, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, 'Do calendário do próprio navegador — não de tabela, não da internet. Mês de referência é sempre o anterior ao atual; o ano é o corrente, exceto em janeiro, quando a planilha é de dezembro. A sigla do cabeçalho serve só para conferir.', M, 5.45, 7.4, 1.2, { fontSize: 13.5, lineSpacing: 19 });
  card(s, 8.6, 1.62, 4.03, 5.0, CARD);
  s.addText('Quando o mês não bate', { x: 8.92, y: 1.92, w: 3.4, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  body(s, 'Se a sigla do cabeçalho indicar um mês diferente do esperado, a ferramenta para e pergunta antes de gerar qualquer coisa:', 8.92, 2.38, 3.4, 1.0, { fontSize: 13, lineSpacing: 18 });
  s.addShape(pres.ShapeType.roundRect, { x: 8.92, y: 3.42, w: 3.4, h: 1.5, rectRadius: 0.08, fill: { color: WHITE }, line: { color: 'C9D4E0' } });
  body(s, '"O cabeçalho indica junho, mas o mês esperado é agosto. Qual é o mês verdadeiro deste arquivo?"', 9.12, 3.62, 3.0, 1.2, { fontSize: 12.5, italic: true, color: INK, lineSpacing: 17 });
  body(s, 'A resposta vale para o arquivo aberto. Trocou de arquivo, a verificação recomeça. Um aviso separado alerta quando o número de colunas de dia não bate com o número de dias do mês.', 8.92, 5.05, 3.4, 1.5, { fontSize: 12.5, lineSpacing: 17 });
  s.addNotes('R3 alcanca os tres tipos. O calendario vem do navegador e a divergencia de mes vira pergunta, nao suposicao.');
}

/* ------------------------------------- 16 R4 */
{
  const s = slide();
  heading(s, 'docs/regras · R4', 'DSR e a exceção do fim de semana');
  const dl = [
    ['Convencional', '1 DSR por semana (seg a sex) com pelo menos uma falta contada — não importa quantas foram.', TEAL],
    ['12×36', '1 DSR por falta contada, já depois do corte da R2. Não olha semana nem fim de semana.', DEEP],
    ['31 faltas (R1)', 'Sem DSR — a coluna sai vazia.', AMBER]
  ];
  dl.forEach((d, i) => {
    const y = 1.68 + i * 1.32;
    card(s, M, y, 6.5, 1.15, i % 2 ? CARD2 : CARD);
    s.addText(d[0], { x: M + 0.3, y: y + 0.16, w: 2.3, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 15, bold: true, color: d[2] });
    body(s, d[1], M + 0.3, y + 0.52, 5.9, 0.6, { fontSize: 12.5, lineSpacing: 16 });
  });
  const ex = [
    hrow(['Faltas', 'Contam', 'DSR'], TEAL),
    ['1 falta', '1', '1'],
    ['2 faltas na mesma semana', '2', '1'],
    ['2 faltas em semanas diferentes', '2', '2'],
    ['12×36 — faltas 5, 6, 7', '2 (R2)', '2']
  ];
  tbl(s, ex, M, 5.72, 6.5, [3.2, 1.7, 1.6], { rowH: 0.33, fontSize: 11.5 });
  card(s, 7.55, 1.68, 5.08, 5.19, 'F6EFE2');
  s.addText('A exceção que pede conferência', { x: 7.88, y: 1.98, w: 4.4, h: 0.4, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: '8A5A12' });
  body(s, 'A R3 normalmente descarta falta de sábado e domingo para o Convencional. Mas se TODAS as faltas do funcionário caírem em fim de semana, algo está estranho — e descartar tudo apagaria o caso em vez de mostrá-lo.', 7.88, 2.5, 4.4, 1.5, { fontSize: 13, lineSpacing: 18, color: INK });
  s.addText('Nesse caso a ferramenta:', { x: 7.88, y: 4.02, w: 4.4, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 13, bold: true, color: '8A5A12' });
  body(s, [
    { text: 'conta essas faltas na QUANTIDADE;', options: { bullet: true, breakLine: true } },
    { text: 'gera a DSR correspondente;', options: { bullet: true, breakLine: true } },
    { text: 'escreve na coluna Observação: "Faltas apenas em fim de semana (dias 8, 9) — verificar".', options: { bullet: true } }
  ], 7.88, 4.38, 4.4, 1.5, { fontSize: 12.5, paraSpaceAfter: 8, lineSpacing: 17, color: INK });
  body(s, 'Basta uma falta em dia útil para a exceção não valer: aí os fins de semana voltam a ser descartados.', 7.88, 6.05, 4.4, 0.6, { fontSize: 12, italic: true, color: '8A5A12' });
  s.addNotes('R4. A excecao de fim de semana nao decide pelo usuario: ela conta e marca para verificacao humana.');
}

/* ------------------------------------- 17 md -> codigo */
{
  const s = slide();
  heading(s, 'Governança', 'Como cada arquivo .md vira código');
  body(s, 'Cada regra tem um arquivo em linguagem simples e um lugar exato no código. Os dois andam juntos — e essa é uma regra de processo, não uma recomendação.', M, 1.62, 11.9, 0.5, { fontSize: 15, color: INK });
  const rows = [
    hrow(['Arquivo', 'Ferramenta', 'Onde é aplicado no código'], NAVY),
    ['docs/regras/REGRAS.md', 'Infrequência SME', 'diasContados() e quantidadeFinal() — R1, R2 e R3 na ordem'],
    ['docs/regras/regra-escala-convencional.md', 'Infrequência SME', 'mesAnterior(), aplicarCalendario(), confirmarMes() e o bloco R3'],
    ['docs/regras/regra-dsr.md', 'Infrequência SME', 'dsrDe() e a exceção de fim de semana em diasContados()'],
    ['docs/REGRA_VALIDACAO_ESCALA.md', 'Guardião Sepog', 'validateAtmsByScale(), chamada durante a extração'],
    ['docs/REGRA_JORNADA_12x36.md', 'Guardião Sepog', 'validateAtm12x36ByJornada(), chamada depois da extração'],
    ['docs/REGRA_FALTAS_DSR.md', 'Guardião Sepog', 'readFaltas(), contarFaltasPorEscala(), dsrDeFaltas(), resolverFaltas()'],
    ['docs/LIMITACOES_CONHECIDAS.md', 'As duas', 'Divergências conhecidas e a medição que falta para decidir cada uma']
  ];
  tbl(s, rows, M, 2.3, 11.9, [3.9, 2.1, 5.9], { rowH: 0.42, fontSize: 11.5 });
  card(s, M, 5.9, 11.9, 1.05, 'F6EFE2');
  s.addText('Toda regra nova entra no código e no arquivo .md no mesmo commit. Documentação que contradiz o código é pior que documentação nenhuma.', {
    x: M + 0.35, y: 6.1, w: 11.2, h: 0.7, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14, bold: true, color: '8A5A12', valign: 'middle' });
  s.addNotes('Rastreabilidade: quem audita o numero da folha consegue ir do .md ate a funcao.');
}

/* ------------------------------------- 18 diferencas deliberadas */
{
  const s = slide();
  heading(s, 'Atenção', 'As duas se parecem, mas não são iguais — de propósito');
  body(s, 'Os documentos de origem são diferentes, então as regras também são. Os números podem divergir sem que nenhuma das duas esteja errada.', M, 1.62, 11.9, 0.5, { fontSize: 15, color: INK });
  const rows = [
    [{ text: '', options: { fill: { color: 'FFFFFF' } } },
     { text: 'Guardião Sepog (PDF)', options: { bold: true, color: WHITE, fill: { color: DEEP }, fontSize: 12 } },
     { text: 'Infrequência SME (planilha)', options: { bold: true, color: WHITE, fill: { color: TEAL }, fontSize: 12 } }],
    [{ text: 'Mês cheio', options: { bold: true, color: NAVY } }, '29 ou mais faltas já vale como mês inteiro', 'só o número exato 31 aciona a regra'],
    [{ text: 'Falta em fim de semana (Convencional)', options: { bold: true, color: NAVY } }, 'conta — o documento só marca falta em dia de trabalho', 'não conta, salvo a exceção de "só fim de semana"'],
    [{ text: 'Atestado em fim de semana (Convencional)', options: { bold: true, color: NAVY } }, 'rejeitado ainda na leitura do PDF', 'não conta pela R3'],
    [{ text: 'Atestado no 12×36', options: { bold: true, color: NAVY } }, 'exige a coluna JORNADA preenchida', 'conta dia a dia, sem a regra de dia sim/dia não'],
    [{ text: 'Trava de conferência', options: { bold: true, color: NAVY } }, 'compara com o TOTAL DE FALTAS do rodapé', 'compara o recontado com as colunas declaradas']
  ];
  tbl(s, rows, M, 2.32, 11.9, [3.5, 4.2, 4.2], { rowH: 0.52, fontSize: 12 });
  body(s, 'Mudança feita em uma não atravessa para a outra. São dois programas separados, inclusive no código — não compartilham nenhuma função.', M, 6.25, 11.9, 0.6, { fontSize: 13.5, italic: true, color: INK });
  s.addNotes('Se alguem comparar as duas planilhas e achar divergencia, este slide explica por que ela e esperada.');
}

/* ------------------------------------- 19 economia: modelo */
{
  const s = slide();
  heading(s, 'Economia de tempo', 'Como o cálculo é feito — e com quais premissas');
  body(s, 'Os números a seguir saem de uma conta simples — troque as premissas pelas suas e refaça a estimativa.', M, 1.62, 11.9, 0.45, { fontSize: 14.5, color: INK });
  card(s, M, 2.18, 11.9, 0.95, NAVY);
  s.addText('Economia  =  N × (tempo manual por funcionário  −  tempo com a ferramenta por funcionário)  −  tempo fixo de operação', {
    x: M + 0.4, y: 2.18, w: 11.1, h: 0.95, isTextBox: true, margin: 0, valign: 'middle', fontFace: HEAD, fontSize: 16, bold: true, color: WHITE });
  s.addText('Premissas usadas (ajuste para a sua realidade)', { x: M, y: 3.38, w: 7.5, h: 0.35, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
  const rows = [
    hrow(['Etapa', 'Manual', 'Com a ferramenta'], NAVY),
    [{ text: 'Guardião Sepog — por funcionário', options: { bold: true } }, '8 min (ler a página, contar ATM e faltas, ver a escala, calcular a DSR, digitar)', '1,5 min (só conferir o que saiu)'],
    [{ text: 'Infrequência SME — por funcionário', options: { bold: true } }, '5 min (recontar a linha, aplicar fim de semana e dia sim/dia não, digitar)', '1 min (só conferir)'],
    [{ text: 'Tempo fixo por rodada', options: { bold: true } }, '—', '3 min + 2 min (abrir, gerar, salvar)']
  ];
  tbl(s, rows, M, 3.82, 11.9, [3.2, 5.0, 3.7], { rowH: 0.62, fontSize: 12 });
  card(s, M, 6.05, 11.9, 0.95, 'F6EFE2');
  body(s, 'Volume considerado: 120 funcionários por rodada mensal. As premissas de tempo são estimativas de operação, não medições cronometradas — se o seu volume ou ritmo for outro, troque os números na fórmula acima.', M + 0.35, 6.25, 11.2, 0.6, { fontSize: 13, color: '8A5A12', lineSpacing: 17 });
  s.addNotes('Honestidade sobre a origem dos numeros: sao estimativas parametrizadas, nao medicao.');
}

/* ------------------------------------- 20 economia: rodada */
{
  const s = slide();
  heading(s, 'Economia de tempo', 'A rodada mensal, antes e depois');
  s.addChart(pres.ChartType.bar, [
    { name: 'Manual', labels: ['Guardião Sepog', 'Infrequência SME'], values: [16.0, 10.0] },
    { name: 'Com a ferramenta', labels: ['Guardião Sepog', 'Infrequência SME'], values: [3.1, 2.0] }
  ], {
    x: M, y: 1.75, w: 7.3, h: 4.3,
    barDir: 'col', barGapWidthPct: 60,
    chartColors: ['9AA7BC', DEEP],
    showTitle: true, title: 'Horas por rodada mensal (120 funcionários)', titleFontSize: 14, titleColor: NAVY, titleFontFace: TXT,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11, dataLabelColor: INK, dataLabelFontFace: TXT, dataLabelFormatCode: '0.0"h"',
    showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: BODY,
    catAxisLabelColor: BODY, catAxisLabelFontSize: 11, valAxisLabelColor: MUTED, valAxisLabelFontSize: 10,
    valGridLine: { color: 'E2E8F0', size: 1 }, catGridLine: { style: 'none' },
    valAxisMaxVal: 18, valAxisTitle: 'horas', showValAxisTitle: true, valAxisTitleColor: MUTED, valAxisTitleFontSize: 10
  });
  const stats = [
    ['26 h', 'era o custo manual da rodada completa', '9AA7BC'],
    ['5 h', 'é o custo com as duas ferramentas', DEEP],
    ['≈ 21 h', 'devolvidas a cada rodada mensal', AMBER]
  ];
  stats.forEach((st, i) => {
    const y = 1.85 + i * 1.62;
    card(s, 8.35, y, 4.28, 1.4, i === 2 ? 'F6EFE2' : CARD);
    s.addText(st[0], { x: 8.65, y: y + 0.06, w: 3.7, h: 0.74, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 40, bold: true, color: st[2] });
    body(s, st[1], 8.65, y + 0.86, 3.7, 0.45, { fontSize: 12.5, color: BODY });
  });
  body(s, 'Redução de cerca de 80% do tempo gasto no fechamento — e o tempo que sobra é de conferência, não de digitação.', M, 6.35, 11.9, 0.5, { fontSize: 13.5, italic: true, color: INK });
  s.addNotes('26h manual contra 5h com a ferramenta. A diferenca e aproximadamente 21h por rodada mensal.');
}

/* ------------------------------------- 21 economia: no dia */
{
  const s = slide(NAVY);
  heading(s, 'Economia de tempo', 'O que isso significa no dia de trabalho', true);
  const big = [
    ['≈ 1 hora', 'por dia útil', 'As 21 horas da rodada, diluídas nos 21 dias úteis do mês.'],
    ['≈ 2,6 dias', 'por mês', 'Mais de dois dias inteiros de trabalho devolvidos a cada fechamento.'],
    ['≈ 31 dias', 'por ano', 'Cerca de 250 horas — um mês e meio de trabalho útil ao longo de doze rodadas.']
  ];
  big.forEach((b, i) => {
    const x = M + i * 4.12;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.95, w: 3.82, h: 2.9, rectRadius: 0.12, fill: { color: '2E3A73' }, line: { color: '2E3A73' } });
    s.addText(b[0], { x: x + 0.32, y: 2.25, w: 3.2, h: 0.85, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 40, bold: true, color: 'E9B563' });
    s.addText(b[1], { x: x + 0.32, y: 3.12, w: 3.2, h: 0.35, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 15, bold: true, color: WHITE });
    body(s, b[2], x + 0.32, 3.58, 3.2, 1.1, { fontSize: 13, color: 'BFCCE4', lineSpacing: 18 });
  });
  s.addText('E o ganho que não aparece no relógio', { x: M, y: 5.25, w: 11.9, h: 0.4, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 20, bold: true, color: WHITE });
  body(s, 'O tempo manual não é só digitação: é a conta de DSR feita de cabeça, o calendário consultado à mão para saber se o dia 14 caiu no sábado, a releitura para conferir se a falta era mesmo FALTA e não FALTA JUSTIFICADA. Cada uma dessas é uma chance de erro que vai para a folha de pagamento — e um erro achado depois custa muito mais que os minutos economizados aqui.', M, 5.75, 11.9, 1.3, { fontSize: 14, color: 'C9D4E8', lineSpacing: 20 });
  s.addNotes('Traduz as 21h por rodada em unidades do dia a dia e emenda no ganho de qualidade.');
}

/* ------------------------------------- 22 ganhos alem do tempo */
{
  const s = slide();
  heading(s, 'Ganhos', 'O que melhora além da velocidade');
  const g = [
    ['Conferência embutida', 'A ferramenta compara o que leu com o que o documento declara e avisa quando discorda. No pior caso, volta ao número impresso — nunca a um número menor em silêncio.', DEEP],
    ['Decisão rastreável', 'Os dias que não contaram ficam escritos na planilha detalhada. Dá para explicar cada número sem reabrir o PDF.', TEAL],
    ['Regra escrita, não lembrada', 'A regra vive num arquivo em português simples, ligado à função que a aplica. Não depende de quem estava no setor no mês passado.', AMBER],
    ['Dado sensível protegido', 'Nada sai do computador. Atestado médico é dado pessoal sensível de saúde, e o processamento local resolve isso na raiz.', NAVY]
  ];
  g.forEach((c, i) => {
    const x = M + (i % 2) * 6.25, y = 1.72 + Math.floor(i / 2) * 2.5;
    card(s, x, y, 5.9, 2.2, i % 2 ? CARD2 : CARD);
    disk(s, x + 0.35, y + 0.32, 0.56, c[2], String(i + 1), WHITE, 15);
    s.addText(c[0], { x: x + 1.05, y: y + 0.38, w: 4.5, h: 0.4, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 18, bold: true, color: NAVY });
    body(s, c[1], x + 0.35, y + 1.02, 5.2, 1.05, { fontSize: 13, lineSpacing: 18 });
  });
  body(s, 'A suíte de testes roda a cada envio de código e confere, entre outras coisas, que o site não faz nenhuma requisição externa.', M, 6.85, 11.9, 0.4, { fontSize: 12.5, italic: true, color: MUTED });
  s.addNotes('Quatro ganhos qualitativos. O quarto e requisito legal, nao conveniencia.');
}

/* ------------------------------------- 23 limites */
{
  const s = slide();
  heading(s, 'Transparência', 'O que ainda não está resolvido');
  body(s, 'Está tudo anotado em docs/LIMITACOES_CONHECIDAS.md e nas pendências de cada regra. Vale conhecer antes de confiar cegamente em um número.', M, 1.62, 11.9, 0.5, { fontSize: 15, color: INK });
  const lim = [
    ['Funcionário dividido em duas páginas do PDF', 'Hoje cada página vira uma linha. Quando isso acontece, os dias precisam ser juntados pelo CPF antes das regras — senão a mesma semana conta duas vezes e a regra de mês inteiro nunca dispara.'],
    ['Conferência contra PDF original', 'Os arquivos recebidos até agora passaram por "Imprimir em PDF", que transforma o texto em desenho e não deixa nada para ler. A implementação foi validada contra um PDF sintético que reproduz o layout de produção; falta a rodada com um arquivo original.'],
    ['Dois motores de detecção de atestado', 'Existem dois caminhos de reconhecimento de ATM, com critérios diferentes. A divergência entre eles está descrita, junto com a medição que falta para decidir o que fazer — a orientação é não alterar contagem sem medir antes.']
  ];
  lim.forEach((l, i) => {
    const y = 2.3 + i * 1.52;
    card(s, M, y, 11.9, 1.32, i % 2 ? CARD2 : CARD);
    disk(s, M + 0.32, y + 0.36, 0.58, MUTED, String(i + 1), WHITE, 15);
    s.addText(l[0], { x: M + 1.08, y: y + 0.18, w: 10.4, h: 0.32, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 15, bold: true, color: NAVY });
    body(s, l[1], M + 1.08, y + 0.56, 10.4, 0.7, { fontSize: 12.5, lineSpacing: 17 });
  });
  body(s, 'Nenhum desses pontos derruba o uso diário. Eles estão escritos justamente para que ninguém descubra por acidente.', M, 6.88, 11.9, 0.32, { fontSize: 13, italic: true, color: INK });
  s.addNotes('Limitacoes conhecidas, ditas de frente. E o que mantem a confianca no resto.');
}

/* ------------------------------------- 24 fecho */
{
  const s = slide(NAVY);
  s.addShape(pres.ShapeType.ellipse, { x: 10.2, y: 4.2, w: 4.6, h: 4.6, fill: { color: '2E3A73' }, line: { color: '2E3A73' } });
  s.addText('EM UMA FRASE', { x: M, y: 1.7, w: 9, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 12, bold: true, charSpacing: 2.5, color: 'E9B563' });
  s.addText('Duas ferramentas que leem o documento por você — e conferem o próprio trabalho antes de entregar o número.', {
    x: M, y: 2.15, w: 10.2, h: 2.0, isTextBox: true, margin: 0, fontFace: HEAD, fontSize: 36, bold: true, color: WHITE, lineSpacing: 46 });
  const fecho = [
    ['Guardião Sepog', 'Do PDF de frequências à planilha da folha, com atestado, falta, DSR e conferência contra o rodapé.'],
    ['Infrequência SME', 'Da planilha de ponto às duas planilhas finais, com R1 a R4 e o calendário do mês de referência.'],
    ['≈ 21 h por rodada', 'Cerca de uma hora por dia útil devolvida — e gasta em conferência, não em digitação.']
  ];
  fecho.forEach((f, i) => {
    const y = 4.35 + i * 0.92;
    disk(s, M, y + 0.02, 0.42, 'E9B563', String(i + 1), NAVY, 13);
    s.addText(f[0], { x: M + 0.68, y: y, w: 3.1, h: 0.3, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 14.5, bold: true, color: WHITE });
    s.addText(f[1], { x: 4.5, y: y, w: 8.1, h: 0.62, isTextBox: true, margin: 0, fontFace: TXT, fontSize: 13, color: 'BFCCE4', lineSpacing: 18 });
  });
  s.addNotes('Fecho. Repete as tres mensagens principais do deck.');
}

pres.writeFile({ fileName: process.argv[2] || 'folha-facil.pptx' }).then(f => console.log('OK ->', f));
