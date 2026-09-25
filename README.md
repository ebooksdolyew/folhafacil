# Folha Fácil

Site estático com **três ferramentas de departamento pessoal**, escolhidas por um
seletor no topo da página. Nenhuma delas envia arquivo para servidor: tudo é
processado no navegador de quem usa.

| Ferramenta | Entrada | Saída |
|---|---|---|
| **Guardião Sepog** (padrão) | PDF de frequências | Tabela na tela (com faltas e DSR), PDF anotado, planilha XLSX e relatório TXT |
| **Infrequência SME** | Planilha mensal de ponto (.xlsx, .xlsm ou .csv) | Planilha da folha e planilha detalhada |
| **Conciliador de Planilhas** | Fatura Detalhada Clin Odonto (por empresa) + cadastro Novati | Listas de incluir/excluir/alterar e planilhas de dependentes, transferências e descontos |

A Infrequência SME e o Conciliador de Planilhas ficam em arquivos à parte
(`infrequencia.html` e `conciliadorde-planilha.html`), cada um carregado dentro de um
`<iframe>` de mesma origem. É o que mantém o CSS, o JavaScript e os IDs de cada uma
separados — foram escritas para viver sozinhas na página e colidiriam se fossem coladas
no mesmo documento. O `index.html` só acrescenta o seletor, o contêiner e os iframes; as
ferramentas continuam intactas por dentro.

## Rodar

É estático, sem build. Qualquer servidor de arquivos serve:

```bash
python3 -m http.server 8000     # depois abra http://127.0.0.1:8000/index.html
```

Abrir o `index.html` direto do disco (`file://`) funciona no Chrome e no Edge. Em
produção o site é servido pelo Cloudflare Pages, com os cabeçalhos do `_headers`.

## Deploy

O Cloudflare Pages publica só a pasta `dist/`, montada por `scripts/build-deploy.js`
a partir de uma lista fechada de arquivos (páginas, `_headers`, `robots.txt`,
manifesto, `ui/`, `assets/` e as bibliotecas de `vendor/`). `docs/`, `tests/`,
`validacao/`, os `.md` e os arquivos de projeto não vão para o ar. Arquivo novo que o
site precise carregar tem de entrar na lista do script.

No painel do Pages (Settings → Builds & deployments):

- **Build command:** `node scripts/build-deploy.js`
- **Build output directory:** `dist`

Para conferir localmente: `npm run build` e `python3 -m http.server 8000 -d dist`.

## Mapa do repositório

| Caminho | O que é |
|---|---|
| `index.html` | O Guardião Sepog inteiro (HTML + CSS + JS) e o seletor que carrega as outras ferramentas. |
| `infrequencia.html` | A Infrequência SME inteira, com a biblioteca xlsx-js-style (Apache-2.0) embutida. |
| `conciliadorde-planilha.html` | O Conciliador de Planilhas inteiro; usa a `vendor/xlsx.full.min.js` auto-hospedada. |
| `ui/neu.css`, `ui/neu.js` | Camada de interface usada pelas duas: lista neumórfica no lugar da lista nativa do `<select>`, caixas de marcação e retorno visual dos controles. Se não carregar, os seletores voltam a abrir a lista do navegador e nada quebra. |
| `404.html`, `_headers`, `robots.txt`, `site.webmanifest`, `favicon.svg` | Página de erro, cabeçalhos HTTP (CSP e `X-Robots-Tag: noindex` inclusive), bloqueio de robôs e PWA. |
| `scripts/build-deploy.js` | Monta `dist/`, a única pasta publicada. Ver **Deploy**. |
| `assets/` | `icons/` (ícones do site e do PWA), `social/` (imagem de compartilhamento) e `fonts/` (Inter, Outfit e Space Grotesk auto-hospedadas). |
| `vendor/` | pdf.js, pdf-lib e xlsx (xlsx-js-style) auto-hospedados, com `CHECKSUMS.txt` para conferir integridade. |
| `docs/regras/` | Regras de cálculo da **Infrequência SME** (R1 a R4) em linguagem simples. |
| `docs/REGRA_VALIDACAO_ESCALA.md`, `docs/REGRA_JORNADA_12x36.md` | Regras de validação de atestado do **Guardião Sepog**. |
| `docs/REGRA_FALTAS_DSR.md` | Regra de faltas e DSR do **Guardião Sepog** — leitura da coluna OBSERVAÇÃO, contagem por escala e DSR. |
| `docs/LIMITACOES_CONHECIDAS.md` | Divergências conhecidas entre código e documentação, com a medição que falta para decidir cada uma. |
| `docs/conciliador/` | Regras do **Conciliador de Planilhas** (classificação, descontos, avisos) e os layouts das planilhas geradas. |
| `tests/` | Suíte Playwright (unitária + ponta a ponta) sobre o `index.html` real. Ver `tests/README.md`. |
| `validacao/` | Procedimento de regressão contra PDFs reais (`comparar.py`) — os PDFs ficam fora do git. |

## As três ferramentas

### Guardião Sepog (`index.html`)

Lê o PDF do ponto, identifica atestados (ATM), faltas, atrasos, saldo de horas e escala
12×36, e exporta PDF anotado, XLSX e TXT. Três pontos que valem saber antes de mexer:

- Existem **dois motores de detecção de ATM** (tabular e legado), com critérios
  diferentes de reconhecimento. A divergência entre eles está descrita em
  `docs/LIMITACOES_CONHECIDAS.md`, junto com a medição que ainda falta para decidir o que
  fazer com ela — leia antes de alterar qualquer um dos dois.
- A validação de escala acontece **durante** a extração (`readAtmsFromTable`), não
  depois: para Convencional, atestado em sábado ou domingo nunca chega a ser
  registrado. Ver `docs/REGRA_VALIDACAO_ESCALA.md` e `docs/REGRA_JORNADA_12x36.md`.
- **Falta e atestado são caminhos separados, sem função em comum.** A falta é lida da
  coluna OBSERVAÇÃO, registra todo dia (fim de semana inclusive) e ignora a JORNADA —
  o oposto do que o atestado faz. A QUANTIDADE exportada é a que sai das regras de
  escala, não o `TOTAL DE FALTAS` impresso no PDF, que serve de conferência. Ver
  `docs/REGRA_FALTAS_DSR.md`.
- **A contagem tratada existe só na planilha.** A tabela na tela e o relatório TXT
  mostram o número cru do PDF, de propósito: são a conferência contra o documento em
  mãos. Expandir a linha mostra as datas de atestado, de falta e de atraso.

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

### Conciliador de Planilhas (`conciliadorde-planilha.html`)

Concilia a **Fatura Detalhada do Clin Odonto** (uma por empresa do grupo) com o
**cadastro da folha (Novati)**, usando `CPF + tipo` (titular/dependente) como chave, sem
restrição de filial. Classifica cada beneficiário em uma ação — **incluir, excluir,
alterar, verificar, transferências** ou **adesão manual** — e extrai os **descontos**
(adesão e prorata) e os **avisos** de conferência. Gera as planilhas de importação de
dependentes, de transferências (uma aba por empresa de destino) e de descontos.

As regras de classificação, os eventos de desconto (697/645/710) e os layouts das
planilhas estão em `docs/conciliador/REGRAS.md` e `docs/conciliador/layouts-exportacao.md`
— **toda regra nova entra no código e no `docs/conciliador/` no mesmo commit.** A leitura
de planilha usa a `vendor/xlsx.full.min.js` (o mesmo artefato embutido na Infrequência),
auto-hospedada para não depender de CDN nem furar a CSP.

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

## Licença

Software proprietário — © 2026 Andrey Wesley Gomes. Todos os direitos reservados.
Cópia, reprodução ou redistribuição só com autorização por escrito do autor. Ver
[`LICENSE`](LICENSE).
