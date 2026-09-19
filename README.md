# Folha Fácil

Site estático com **duas ferramentas de departamento pessoal**, escolhidas por um
seletor no topo da página. Nenhuma das duas envia arquivo para servidor: tudo é
processado no navegador de quem usa.

| Ferramenta | Entrada | Saída |
|---|---|---|
| **Guardião Sepog** (padrão) | PDF de frequências | Tabela na tela, PDF anotado, planilha XLSX e relatório TXT |
| **Infrequência SME** | Planilha mensal de ponto (.xlsx, .xlsm ou .csv) | Planilha da folha e planilha detalhada |

A Infrequência SME fica em `infrequencia.html`, um arquivo à parte carregado dentro de um
`<iframe>` de mesma origem. É o que mantém o CSS, o JavaScript e os IDs das duas
separados — as duas foram escritas para viver sozinhas na página e colidiriam se
fossem coladas no mesmo documento. O `index.html` só acrescenta o seletor, o contêiner
e o iframe; as duas ferramentas continuam intactas por dentro.

## Rodar

É estático, sem build. Qualquer servidor de arquivos serve:

```bash
python3 -m http.server 8000     # depois abra http://127.0.0.1:8000/index.html
```

Abrir o `index.html` direto do disco (`file://`) funciona no Chrome e no Edge. Em
produção o site é servido pelo Cloudflare Pages, com os cabeçalhos do `_headers`.

## Mapa do repositório

| Caminho | O que é |
|---|---|
| `index.html` | O Guardião Sepog inteiro (HTML + CSS + JS) e o seletor que carrega a Infrequência SME. |
| `infrequencia.html` | A Infrequência SME inteira, com a biblioteca xlsx-js-style (Apache-2.0) embutida. |
| `ui/neu.css`, `ui/neu.js` | Camada de interface usada pelas duas: lista neumórfica no lugar da lista nativa do `<select>`, caixas de marcação e retorno visual dos controles. Se não carregar, os seletores voltam a abrir a lista do navegador e nada quebra. |
| `404.html`, `_headers`, `robots.txt`, `site.webmanifest`, `favicon.svg` | Página de erro, cabeçalhos HTTP (CSP inclusive), SEO e PWA. |
| `assets/` | `icons/` (ícones do site e do PWA), `social/` (imagem de compartilhamento) e `fonts/` (Inter, Outfit e Space Grotesk auto-hospedadas). |
| `vendor/` | pdf.js e pdf-lib auto-hospedados, com `CHECKSUMS.txt` para conferir integridade. |
| `docs/regras/` | Regras de cálculo da **Infrequência SME** (R1 a R4) em linguagem simples. |
| `docs/REGRA_VALIDACAO_ESCALA.md`, `docs/REGRA_JORNADA_12x36.md` | Regras de validação de atestado do **Guardião Sepog**. |
| `docs/LIMITACOES_CONHECIDAS.md` | Divergências conhecidas entre código e documentação, com a medição que falta para decidir cada uma. |
| `tests/` | Suíte Playwright (unitária + ponta a ponta) sobre o `index.html` real. Ver `tests/README.md`. |
| `validacao/` | Procedimento de regressão contra PDFs reais (`comparar.py`) — os PDFs ficam fora do git. |

## As duas ferramentas

### Guardião Sepog (`index.html`)

Lê o PDF do ponto, identifica atestados (ATM), faltas, atrasos, saldo de horas e escala
12×36, e exporta PDF anotado, XLSX e TXT. Dois pontos que valem saber antes de mexer:

- Existem **dois motores de detecção de ATM** (tabular e legado), com critérios
  diferentes de reconhecimento. A divergência entre eles está descrita em
  `docs/LIMITACOES_CONHECIDAS.md`, junto com a medição que ainda falta para decidir o que
  fazer com ela — leia antes de alterar qualquer um dos dois.
- A validação de escala acontece **durante** a extração (`readAtmsFromTable`), não
  depois: para Convencional, atestado em sábado ou domingo nunca chega a ser
  registrado. Ver `docs/REGRA_VALIDACAO_ESCALA.md` e `docs/REGRA_JORNADA_12x36.md`.

### Infrequência SME (`infrequencia.html`)

1. Lê a planilha (detecta cabeçalho, colunas de dia `01/ago`…, CPF, função, empresa…).
2. Reconta os dias marcados `F` / `A` / `D` e compara com as colunas declaradas.
3. Deduz a escala pela função (porteiro = 12×36; demais = Convencional).
4. Descobre o mês/ano de referência (mês anterior ao atual) e o dia da semana de cada
   dia, pedindo confirmação se o cabeçalho da planilha disser outro mês.
5. Aplica as regras R1–R4 (`docs/regras/`) para chegar à QUANTIDADE e à DSR.
6. Gera duas planilhas, com filtros de empresa, tipo, escala e "ausência mês completo":
   - **Modelo da folha** — `MATRICULA | Funcionário | [Empresa] | CPF | Escala | QUANTIDADE | DSR | PROVENTO | VALOR | [Observação]`
   - **Detalhada** — tudo acima mais lotação, função, tipo, dias contados e não contados.

| Regra | Vale para | O que faz |
|---|---|---|
| R1 | F, A | 31 faltas ou 31 atestados → sai 31, ignora o resto. |
| R2 | F, 12×36 | Dias corridos de falta: conta o 1º, pula o 2º, conta o 3º… |
| R3 | F, A, D, Convencional | Sábado e domingo não contam. Exceção: faltas *só* em fim de semana contam, com aviso. |
| R4 | F | DSR — Convencional: 1 por semana com falta. 12×36: 1 por falta contada. |

Detalhe de cada uma em `docs/regras/REGRAS.md`, `docs/regras/regra-escala-convencional.md`
e `docs/regras/regra-dsr.md`. **Toda regra nova entra no código e no `docs/regras/` no mesmo
commit** — documentação que contradiz o código é pior que documentação nenhuma.

## Testes

```bash
npm install
npm test          # gera o PDF sintético e roda a suíte completa
```

Detalhes, incluindo como rodar com um Chromium já instalado e como fazer regressão
contra PDFs reais, em `tests/README.md`. O CI (`.github/workflows/tests.yml`) roda a
suíte e confere os checksums do `vendor/` a cada push.

Regra de processo: toda alteração em função pura do `index.html` exige a alteração
espelhada em `tests/unit.spec.js` **no mesmo commit**.

## Dados sensíveis (LGPD)

Folhas de ponto e planilhas de infrequência trazem nome, CPF e atestado médico — este
último é dado pessoal sensível de saúde. Por isso:

- o processamento é integralmente local: nenhum arquivo sai do dispositivo;
- o `.gitignore` bloqueia `*.xlsx`, `*.xlsm`, `*.csv`, os PDFs de `validacao/` e os
  snapshots gerados a partir de arquivos reais. **Não remova essas linhas**;
- o site não faz nenhuma requisição a terceiros: fontes e bibliotecas são
  auto-hospedadas, e a CSP do `_headers` bloqueia o resto.
