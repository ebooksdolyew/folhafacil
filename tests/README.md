# Testes do Folha Fácil

Duas camadas, ambas em Playwright sobre o `index.html` real — sem mock do
motor e sem refatorar o app, que continua single-file.

| Arquivo | Cobre |
|---------|-------|
| `unit.spec.js` | Funções puras: estado vazio da tabela, `extractSaldoHoras`, `dateFromDayNumber`, `isWeekendDay`, reconhecimento de ATM, `escHtml` (nome e busca como texto) |
| `e2e.spec.js` | Encadeamento completo: REGRAS 1 e 2, contadores, snapshot da tabela, fluxo com os 3 downloads, seções do relatório por filtro, troca de PDF no meio do processamento, PDF quebrado depois de um bom, arquivo recusado sem painel vazio, tabela rolável no celular, CSP e ausência de requisição externa. Também a Infrequência dentro do iframe (confirmação do mês visível, Esc, filtro de empresa, cabeçalho em data) e fora dele (nome com HTML, empresa com espaço duplo, Provento TRE × Provento DSR), e o Conciliador (datas no fuso de Brasília, busca das abas, Novati recusada, Fatura carregada antes da Novati) |

A suíte unitária não pega regressão no encadeamento — que é justamente o
risco das Fases 2 e 3 do plano de correções. Por isso as duas existem.

## Rodar

```bash
npm install
npm test                 # gera o PDF sintético (pretest) e roda tudo
npm run test:unit
npm run test:e2e
```

Se o ambiente já traz um Chromium instalado, aponte para ele em vez de baixar
outro:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium npm test
```

## O PDF sintético

`tests/fixtures/gerar-pdf-sintetico.js` gera uma folha de ponto **fictícia**
com seis funcionários, cada um cobrindo um cenário das regras de negócio —
inclusive o caso `JORNADA = "Folga"` da Fase 4 e o funcionário sem nenhuma
ocorrência, que é o que expõe o gatilho de fallback.

Cada página carrega o resultado esperado, conferido à mão. O `e2e.spec.js`
lê essa mesma estrutura, então acrescentar um cenário é acrescentar uma
entrada em `PAGINAS` — o teste vem junto.

Nenhuma folha de ponto real entra no repositório.

## Rodar contra os seus PDFs reais

Os PDFs reais ficam em `validacao/pdfs/`, que está no `.gitignore` (LGPD:
contêm nome de funcionário e dado de saúde). Para uma regressão completa
entre fases, o caminho é o `validacao/comparar.py`, descrito em
`validacao/AMOSTRA.md`:

```bash
python3 validacao/comparar.py validacao/atual
```

Snapshots gerados a partir de PDFs reais **não** podem ser versionados —
contêm nomes. O snapshot do PDF sintético é fictício e fica versionado.

## Regra de processo

Toda alteração em função pura do `index.html` exige a alteração espelhada em
`tests/unit.spec.js` **no mesmo commit**. Sem exceção.
