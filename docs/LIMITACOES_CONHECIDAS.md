# Limitações conhecidas — Folha Fácil

Documento de honestidade técnica. Registra divergências reais entre o código
e a documentação de regras, para que nenhuma delas seja descoberta primeiro
por uma auditoria do cliente.

Referência: plano de correções v2.2 → v2.3, Fase 4.
Estado: **medição pendente** — ver "Como decidir" no fim.

---

## 1. Existem dois motores de detecção de ATM

| | Motor tabular (`readAtmsFromTable`) | Motor legado (`detectAtmByRowLegacy`) |
|---|---|---|
| Reconhecimento de ATM | `/\bATM\b/` **ou** `/^[AM]+$/` **ou** `/MAT\|ATM\|ATMA/` | `ATM_RX`, com lookarounds estritos |
| Colunas varridas | Só as colunas `ENT*` | **Todas** as células da linha |
| REGRA 1 (Sáb/Dom em Convencional) | Aplica | Aplica |
| REGRA 2 (JORNADA em 12×36) | Aplicada depois, em `validateAtm12x36ByJornada` | Aplicada inline, **com critério diferente** |

O motor tabular é o principal. O legado é fallback.

---

## 2. Divergência A — reconhecimento mais frouxo no motor tabular

```javascript
const hasAtm = /\bATM\b/.test(cellText) || /^[AM]+$/.test(cellText) || /MAT|ATM|ATMA/.test(cellText);
```

A terceira alternativa não tem delimitador de palavra: **qualquer célula que
contenha `MAT` casa como ATM** — incluindo `MATRÍCULA`. E `/^[AM]+$/` casa com
`"A"`, `"M"`, `"AM"` e `"MA"` isolados. A alternativa `ATMA` é inalcançável,
porque `ATM` já é substring dela.

**Impacto possível:** falso positivo (contar ATM que não existe).

**Por que não foi corrigido:** trocar por `ATM_RX` reduz detecções, e nenhum
falso positivo foi comprovado nos PDFs reais. A regra de ouro do plano é não
alterar a contagem sem evidência. Só mexa aqui se a medição da seção 6
comprovar um falso positivo concreto.

---

## 3. Divergência B — "Folga" na REGRA 2 (a mais séria)

`REGRA_JORNADA_12x36.md` é explícito:

> `| 22/05 | ATM | Folga | ✅ CONTABILIZAR |`

Os dois motores discordam disso:

- **Motor tabular** (`validateAtm12x36ByJornada`): rejeita apenas JORNADA
  **vazia**. Aceita `"Folga"`. ✅ **Conforme a documentação.**
- **Motor legado**: rejeita explicitamente `-`, `FOLGA`, `DSR` e `DESCANSO`.
  ❌ **Viola a REGRA 2 como documentada.**

O comportamento do motor legado está atrás da flag `REGRA2_ACEITA_FOLGA`
(topo do bloco de regras no `index.html`):

- `false` (**valor atual**) — preserva exatamente a contagem de hoje.
- `true` — alinha o motor legado à REGRA 2 documentada.

Como o motor tabular atende praticamente todas as páginas, essa divergência
só altera resultado quando o fallback é acionado **e** produz ATM.

---

## 4. Divergência C — o gatilho do fallback está errado

```javascript
if (result.atmDays && result.atmDays.length > 0) {   // ← condição por CONTAGEM
  result.tableStruct = tableStruct;
  return result;
}
// cai no motor legado
```

O código cai no motor legado sempre que o tabular retorna **zero** ATMs. Mas
zero é um resultado legítimo: funcionário sem nenhum atestado. Na prática,
**todo funcionário limpo é re-escaneado pelo motor mais frouxo**, que varre
todas as colunas com um regex diferente.

**Confirmado empiricamente.** No PDF sintético de `tests/fixtures`, o
funcionário sem nenhuma ocorrência é o único que aparece com
`motorUsado: "linha-legacy"`, embora a tabela dele tenha sido identificada
sem problema. Os outros cinco usam `coluna-horizontal`.

**Correção proposta** (não aplicada — depende da medição):

```javascript
/* A tabela foi identificada com sucesso: confia no motor tabular,
   inclusive quando o resultado é zero (funcionário sem atestado).
   O motor legado só deve atuar quando a ESTRUTURA não foi reconhecida. */
result.tableStruct = tableStruct;
return result;
```

Isso restringe o motor legado ao caso em que `identifyTableColumns` falha de
verdade, e elimina de uma vez a classe de risco das divergências A e B.

---

## 5. PDFs escaneados não são suportados

Sem camada de texto, `extractName` falha em todas as páginas e nenhum
funcionário é reconhecido. Desde a Fase 1 isso produz uma mensagem
explicativa na tela, em vez do `ReferenceError` que antes derrubava a
renderização inteira. OCR (`tesseract.js`) seria um modo separado e
explícito — nunca um fallback automático, porque introduziria erro de
reconhecimento num dado que hoje é determinístico.

---

## 6. pdf.js 3.4.120 — atualização adiada conscientemente

**Decisão registrada: adiar a Fase 5 do plano.**

A versão em uso está na faixa afetada pela CVE-2024-4367
(`GHSA-wgrm-67xf-hhpq`, High, corrigida em 4.2.67).

**Controle compensatório em vigor:** `isEvalSupported: false` no
`getDocument()` — o workaround oficial declarado no próprio advisory da
Mozilla. Sem ele, o padrão é o valor vulnerável.

**Por que adiar é a escolha certa hoje:** o 4.x mudou muito além da correção
de segurança. Migrou para ESM; `getTextContent()` pode devolver agrupamento,
quebra de strings e valores de `transform`/`width`/`height` diferentes; e a
rasterização pode mudar sutilmente com o antialiasing de fonte. Isso mexe
exatamente nas duas camadas de que a precisão depende: as coordenadas de
texto que alimentam `buildRows()` (`ROW_TOL`, `COL_TOL`) e a luminância de
pixel que alimenta `isTokenDark()` (`LUM_THRESHOLD`).

**Quando for feito:** branch isolada, amostra de 20+ PDFs com todos os
layouts já vistos, salto mínimo para a `4.2.67` (primeira versão corrigida,
não a 5.x), `comparar.py` em cada PDF, e recalibração provável de `ROW_TOL`,
`COL_TOL` e `LUM_THRESHOLD` — cada valor alterado documentado com o motivo.
Uma divergência pode ser a versão nova **acertando** onde a antiga errava,
mas isso só se sabe conferindo à mão contra o PDF.

**Sobre SRI:** não substitui a auto-hospedagem. O `integrity` só se aplica a
recursos declarados em `<script>` e `<link>`; o `pdf.worker.min.js` é buscado
por `GlobalWorkerOptions.workerSrc` e ficaria sem verificação — justamente o
arquivo onde o PDF é parseado e onde a CVE se manifesta.

---

## 7. Como decidir a divergência entre motores (medição pendente)

A instrumentação `[GHUB-DIAG]` já está no código. Ela avisa **apenas** quando
o motor legado realmente produziu ATM — o único caso em que a divergência
pode mudar a contagem.

1. Abra o `index.html` com o Console do DevTools aberto.
2. Processe **todos** os PDFs reais da amostra (`validacao/AMOSTRA.md`).
3. Conte as linhas `[GHUB-DIAG]`.

**Nenhum aviso (Cenário A).** A divergência é teórica nos seus layouts.
Aplique só a correção do gatilho da seção 4, rode
`python3 validacao/comparar.py validacao/atual` para confirmar 0 divergências,
remova a instrumentação e mantenha este documento como registro.

**Com avisos (Cenário B).** Para cada aviso, abra o PDF na página indicada e
confira **manualmente** quantos ATMs o funcionário tem de verdade:

| página | funcionário | escala | ATM real | ATM GHUB | correto? |
|--------|-------------|--------|----------|----------|----------|

- programa correto em todos os casos → o motor legado está compensando um layout
  que o tabular não pega. Não mexa nele; mantenha este documento.
- Falso positivo → seção 2 (regex frouxo). Revalide tudo depois.
- Falso negativo em 12×36 com Folga → vire `REGRA2_ACEITA_FOLGA` para `true`.

Compare as duas saídas com o mesmo PDF virando a flag e rodando o
`comparar.py`: ele mostra exatamente quais funcionários mudam.

Depois de decidir: remova a flag, deixe só o comportamento escolhido, remova
a instrumentação e sincronize `REGRA_JORNADA_12x36.md` com o comportamento
real do código.
Documentação que contradiz o código é pior que documentação ausente,
principalmente quando vira anexo de contrato.
