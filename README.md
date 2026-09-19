# Infrequência

Ferramenta em um único arquivo HTML que lê a planilha mensal de ponto (.xlsx/.csv),
reconta faltas, atestados e TRE por funcionário, aplica as regras de escala e gera a
planilha enxuta para a folha.

Funciona offline: basta abrir `infrequencia.html` no navegador. A biblioteca de
leitura/escrita de Excel (xlsx-js-style, Apache-2.0) já está embutida no arquivo.

## Estrutura

| Caminho | O que é |
|---|---|
| `infrequencia.html` | A ferramenta inteira (HTML + CSS + JS + biblioteca xlsx). |
| `regras/REGRAS.md` | Índice das regras de cálculo (R1 a R4) em linguagem simples. |
| `regras/regra-escala-convencional.md` | Como o programa descobre mês/ano e dia da semana; regra R3. |
| `regras/regra-dsr.md` | Regra R4 — DSR para Convencional e 12×36. |
| `PROMPT-INTEGRACAO.md` | Instruções para integrar esta ferramenta ao `index.html` de outro projeto. |
| `planilhas-teste/` | Planilhas reais usadas nos testes. **Ignorada pelo git** (contém CPF e nomes). |

## O que a ferramenta faz

1. Lê a planilha (detecta cabeçalho, colunas de dia `01/ago`…, CPF, função, empresa…).
2. Reconta os dias marcados `F` / `A` / `D` e compara com as colunas declaradas.
3. Deduz a escala pela função (porteiro = 12×36; demais = Convencional).
4. Descobre o mês/ano de referência (mês anterior ao atual) e o dia da semana de cada dia,
   pedindo confirmação se o cabeçalho da planilha disser outro mês.
5. Aplica as regras R1–R4 (`regras/`) para chegar à QUANTIDADE e à DSR.
6. Gera duas planilhas, com filtros de empresa, tipo, escala e "ausência mês completo":
   - **Modelo da folha** — `MATRICULA | Funcionário | [Empresa] | CPF | Escala | QUANTIDADE | DSR | PROVENTO | VALOR | [Observação]`
   - **Detalhada** — tudo acima mais lotação, função, tipo, dias contados e não contados.

## Regras (resumo)

| Regra | Vale para | O que faz |
|---|---|---|
| R1 | F, A | 31 faltas ou 31 atestados → sai 31, ignora o resto. |
| R2 | F, 12×36 | Dias corridos de falta: conta o 1º, pula o 2º, conta o 3º… |
| R3 | F, A, D, Convencional | Sábado e domingo não contam. Exceção: faltas *só* em fim de semana contam, com aviso. |
| R4 | F | DSR — Convencional: 1 por semana com falta. 12×36: 1 por falta contada. |

Toda regra nova entra em `diasContados()` / `dsrDe()` no HTML **e** em `regras/`.

## Dados sensíveis

As planilhas de ponto têm nome e CPF. O `.gitignore` bloqueia `*.xlsx`, `*.csv` e a
pasta `planilhas-teste/`. Não remova essas linhas.
