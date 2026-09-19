# REGRA DE FALTAS E DSR — Guardião Sepog

O Guardião Sepog lê as faltas dia a dia, a partir da coluna OBSERVAÇÃO do PDF de
frequências, e calcula a QUANTIDADE e a DSR. Este arquivo é a referência em linguagem
simples; **toda alteração na regra entra aqui e no código no mesmo commit.**

## Escopo

Esta regra vale **só para o Guardião Sepog** (`index.html`) e **só para faltas**.

| | |
|---|---|
| Não altera | a detecção de atestados (ATM), em nenhum ponto |
| Não altera | `infrequencia.html` — a Infrequência SME está fora deste trabalho |
| Não altera | como a escala é determinada (continua vindo do CARGO, via `is12x36`) |

A separação entre falta e atestado é deliberada, não organizacional: **as duas precisam
de coisas opostas.** O atestado descarta sábado e domingo já na extração (ver
`REGRA_VALIDACAO_ESCALA.md`) e, no 12×36, exige JORNADA preenchida (ver
`REGRA_JORNADA_12x36.md`). A falta precisa do contrário — registrar todo dia, fim de
semana inclusive, e ignorar a JORNADA por completo. Os dois caminhos não compartilham
função nenhuma.

A Infrequência SME tem regras próprias, documentadas em `regras/`. Elas se parecem com
estas, mas são outro programa: os números podem divergir de propósito, e nenhuma
mudança aqui atravessa para lá.

---

## Por que a coluna OBSERVAÇÃO

Toda falta aparece na coluna OBSERVAÇÃO, escrita como `FALTA`. Nas colunas de marcação
(ENT/SAI) a falta em geral **não** deixa rastro: o dia fica com as células vazias.

Documentos reais confirmaram que a coluna é fiel ao que o próprio sistema de ponto
contabiliza — em todos os casos conferidos, o número de linhas com `FALTA` na coluna é
igual ao `TOTAL DE FALTAS` impresso no rodapé. É essa coincidência que sustenta a
conferência da Etapa 4.

### Estrutura da tabela

O PDF traz uma linha por dia do mês, com estas colunas:

```
DIA | ENT1 | SAI1 | ENT2 | SAI2 | ENT3 | SAI3 | SALDO | LOTAÇÃO | JORNADA | OBSERVAÇÃO
```

A coluna `DIA` traz o número **e o dia da semana** — `01 - Sex`, `03 - Dom`. Isso é
usado como conferência do período (ver Etapa 2).

Abaixo da última linha de dia vêm a faixa de LEGENDAS, o `SALDO DE HORAS`, o
`TOTAL DE FALTAS` e um bloco livre `OBSERVAÇÕES:`. Nada disso pode ser confundido com
um dia — ver Etapa 1, passo 2.

---

## Etapa 1 — Extração dos dias de falta

### Passo 1: delimitar a coluna na horizontal

A coluna é um **intervalo entre cabeçalhos**: começa na borda direita do cabeçalho
anterior e termina na borda esquerda do seguinte. `faixaHorizontal()` calcula isso a
partir da própria linha de título, e só o canto esquerdo de cada token é comparado com o
intervalo — é o que mantém um valor largo da JORNADA fora da OBSERVAÇÃO.

> **Por que não reaproveitar o `identifyTableColumns()`.** Ele joga cada token na coluna
> de x **mais próximo**, com corte em 50pt. No PDF de produção o cabeçalho `OBSERVAÇÃO`
> é centralizado numa coluna larga e o texto é alinhado à esquerda: a distância entre
> `OBSERVAÇÃO` (x≈468) e `FALTA` (x≈416) dá 52pt, acima do corte, e **a célula é
> descartada**. O efeito era ler zero falta em toda página, em silêncio, com a planilha
> saindo com QUANTIDADE 0. Como intervalo, o alinhamento do texto dentro da coluna
> deixa de importar.

O nome é procurado no **singular**, para não pegar o bloco `OBSERVAÇÕES:` do rodapé.

Se a coluna não for encontrada, ou se não houver linha de cabeçalho, a página **não**
devolve zero faltas: devolve *não foi possível ler* (ver Etapa 4).

### Passo 2: delimitar a faixa de cada dia

Das células da faixa horizontal da coluna `DIA`, consideram-se as que `diaDaCelula()`
reconhece como dia: o texto precisa começar por um número de 1 a 31 e **não** pode
conter `:` nem `/` — sem isso um horário da ENT1 (`08:00`) ou uma data viraria um dia
inventado, já que a faixa é generosa de propósito.

Cada dia reconhecido tem uma posição vertical. A **faixa** de um dia vai do ponto médio
entre ele e o dia de cima até o ponto médio entre ele e o dia de baixo; a primeira e a
última se estendem meia linha para fora.

Um token pertence a um dia quando sua posição vertical cai dentro da faixa daquele dia.

Isso substitui a tolerância fixa (`ROW_TOL`) que a detecção de ATM usa, estreita demais
para uma coluna de texto livre, e resolve dois problemas de uma vez:

- absorve variação de altura de linha sem depender de constante ajustada à mão;
- **tudo que está abaixo do último dia fica fora de qualquer faixa** — é o que descarta
  automaticamente as LEGENDAS, o `SALDO DE HORAS`, o `TOTAL DE FALTAS:` e o bloco
  `OBSERVAÇÕES:` do rodapé.

### Passo 3: remontar o texto da célula

Todos os tokens da coluna OBSERVAÇÃO cuja posição cai na faixa do dia, ordenados da
esquerda para a direita, juntados com espaço.

O texto é remontado em vez de testado token a token porque o extrator pode fatiar a
frase: `BATIDAS FORA DA MARGEM` pode chegar em quatro pedaços, e avaliar cada pedaço
isolado levaria à conclusão errada.

### Passo 4: classificar

O texto remontado é normalizado por `normObs()` — maiúscula, sem acento, espaços
colapsados, pontuação final (`.`, `:`, `;`, `*`) removida — e então:

| Conteúdo da célula | Resultado |
|---|---|
| exatamente `FALTA` | **conta como falta** |
| qualquer outro texto | ignorado |
| vazio | ignorado |

**Só a palavra FALTA importa.** O casamento é por igualdade, nunca por "contém": é o
que impede que `FALTA JUSTIFICADA`, `FALTA ABONADA` ou qualquer outra observação entre
na conta. Nenhum outro texto da coluna é interpretado, rastreado ou reportado — o que
está em jogo aqui é falta, e só.

Textos reais que aparecem na coluna e **não** contam, usados como teste negativo:
`FERIADO (Dia do Trabalho)`, `BATIDAS FORA DA MARGEM`, `batida fora de margem.`,
`ATESTADO 2 DIAS*`, `PONTO ABONADO COM ACORDO DA DIREÇÃO`, `FALTA JUSTIFICADA`.

### Resultado da Etapa 1

Uma lista de dias, não um total:

```
12×36        → [7, 8, 13, 14, 23, 24]
Convencional → [6, 15, 20, 22, 27, 29]
```

O total é subproduto da lista. **A lista é o dado**, porque sem saber *quais* dias são
não há como aplicar a regra de dias corridos nem calcular a DSR.

---

## Etapa 2 — Contagem por escala

A escala vem do `is12` do Guardião, que a lê do CARGO impresso no cabeçalho do documento.
O calendário vem do período do documento.

### Conferência do período

A coluna `DIA` imprime o dia da semana de cada linha. Antes de aplicar qualquer regra,
`conferirDiaDaSemana()` compara o dia da semana impresso com o calculado a partir do
período lido.

Se discordarem, o mês foi lido errado. A página é **sinalizada** em vez de produzir uma
DSR silenciosamente errada — a DSR depende de em qual semana o dia cai, então mês errado
significa DSR errada.

### As regras, na ordem

A primeira que se aplicar encerra o cálculo.

**F1 — Mês inteiro (29, 30 ou 31).** Quem tem 29 faltas ou mais sai com a quantidade
**integral**, sem passar pela regra de dias corridos e **sem DSR**.

> O limite é 29, e não 31, porque num mês de 31 dias uma ausência do mês inteiro dificilmente
> marca todos os dias — descanso, folga ou um dia trabalhado no começo derrubam o número
> para 29 ou 30. Sem esse limite, 30 faltas corridas em 12×36 cairiam para 15 pela F2
> enquanto 31 continuariam 31: um dia de diferença dobraria o valor na folha.

**F2 — 12×36: dia sim, dia não.** Dentro de cada sequência de dias corridos de falta,
conta o 1º, pula o 2º, conta o 3º, pula o 4º. A sequência recomeça quando há um dia sem
falta no meio. Falta isolada conta sempre. Fim de semana conta normalmente.

Quem trabalha dia sim, dia não só pode faltar dia sim, dia não.

| Dias marcados (12×36) | Contam | Não contam | QUANTIDADE |
|---|---|---|---|
| 7, 8 | 7 | 8 | 1 |
| 5, 6, 7 | 5, 7 | 6 | 2 |
| 5, 12, 19 | 5, 12, 19 | — | 3 |
| 7, 8, 13, 14, 23, 24 | 7, 13, 23 | 8, 14, 24 | 3 |
| 1 a 30 | todos (F1) | — | 30 |

**F3 — Convencional: todos os dias contam.** Não há filtro de fim de semana.

> O documento de ponto já só marca falta em dia de trabalho: para quem é Convencional,
> sábado e domingo simplesmente não aparecem como falta, salvo em ausência do mês
> inteiro — e nesse caso a F1 já resolveu. Descartar fim de semana aqui seria corrigir
> um problema que o próprio documento não tem, com o risco de derrubar um número
> legítimo. **Esta é uma diferença deliberada em relação à Infrequência SME.**

---

## Etapa 3 — DSR

Calculada **só sobre os dias que contaram** depois da Etapa 2.

| Escala | DSR |
|---|---|
| 12×36 | uma por falta contada |
| Convencional | uma por semana distinta com falta contada |
| Mês inteiro (F1) | nenhuma |

Semana, para a Convencional, é identificada pela segunda-feira correspondente ao dia —
sábado e domingo pertencem à semana da segunda anterior. Duas faltas na mesma semana
geram uma DSR; duas em semanas diferentes geram duas.

Exemplo — Convencional com faltas em 06-Qua, 15-Sex, 20-Qua, 22-Sex, 27-Qua, 29-Sex:

```
06  → semana de 04    ┐
15  → semana de 11    │
20  → semana de 18    ├─ quatro semanas distintas
22  → semana de 18    │
27  → semana de 25    │
29  → semana de 25    ┘

QUANTIDADE 6 · DSR 4
```

Seis faltas, quatro DSR — porque 20 e 22 caem na mesma semana, e 27 e 29 também.

---

## Etapa 4 — Conferência

São **quatro números diferentes**, e confundi-los é o erro mais fácil de cometer aqui:

| | 12×36 | Convencional |
|---|---|---|
| dias de falta | 7, 8, 13, 14, 23, 24 | 6, 15, 20, 22, 27, 29 |
| impresso no rodapé (`TOTAL DE FALTAS`) | 6 | 6 |
| contado na coluna OBSERVAÇÃO | 6 | 6 |
| QUANTIDADE depois das regras | **3** | 6 |
| DSR | **3** | **4** |

**A conferência compara impresso × contado** — os dois primeiros, ambos crus, antes de
qualquer regra. Nunca compara com a QUANTIDADE final.

Isso é essencial. No 12×36 o impresso (6) é diferente da QUANTIDADE (3), e isso **não é
divergência**: é a F2 fazendo o trabalho dela. Se a conferência comparasse com a
QUANTIDADE, ela acusaria erro em todo funcionário 12×36 com faltas em dias corridos.

### A regra de segurança

**As regras de escala só são aplicadas quando a leitura fecha com o número impresso no
rodapé.** Qualquer desacordo — inclusive ler zero num PDF que imprime faltas — faz a
QUANTIDADE cair para o total impresso, sem DSR e com a linha marcada.

A razão é direta: se a leitura não bate com o que o próprio PDF declara, ela não é
confiável, e uma lista de dias em que não se confia não pode reduzir um número que vai
para a folha de pagamento. Aplicar a F2 sobre uma leitura incompleta produziria um
número menor que o correto, em silêncio.

Nessa situação a DSR fica **vazia**, não zero: ela depende de saber em que semana cada
dia caiu, e é exatamente isso que está em dúvida.

O efeito prático é que o pior caso da leitura é voltar ao comportamento antigo — o total
impresso, sem escala e sem DSR — com um aviso visível. Nunca menos que isso.

### Estados possíveis

| Estado | Quando | QUANTIDADE | DSR |
|---|---|---|---|
| `conferido` | rodapé lido e igual ao contado | dias contados, com as regras | calculada |
| `divergente` | rodapé lido e diferente do contado | **total impresso** | vazia |
| `sem-conferencia` | o PDF não traz `TOTAL DE FALTAS` | dias contados, com as regras | calculada |
| `sem-leitura` | coluna OBSERVAÇÃO ou cabeçalho não identificados | **total impresso** | vazia |
| `periodo-divergente` | o dia da semana impresso não bate com o período | dias contados, com as regras | vazia |

O `periodo-divergente` é o único caso em que a QUANTIDADE vale e a DSR não: o número do
dia foi lido certo, mas a semana em que ele cai depende do mês, e o mês está em dúvida.

Na tela, qualquer estado diferente de `conferido` acende uma marca ao lado da
quantidade, com a explicação no título. Na planilha, a coluna **Conferência** só é
criada quando alguma linha precisa dela.

---

## Onde está no código

Tudo em `index.html`, numa seção própria marcada `FALTAS — leitura pela coluna
OBSERVAÇÃO`, sem nenhuma função em comum com a detecção de atestado.

| Função | Responsabilidade |
|---|---|
| `lerTotalFaltasImpresso(rows, text)` | lê o rodapé; devolve `{ encontrado, valor }` para separar zero de ausente |
| `normObs(txt)` | maiúscula, sem acento, espaços colapsados, pontuação final removida |
| `acharLinhaCabecalho(rows)` | acha a linha de título da tabela |
| `faixaHorizontal(rows, nome)` | intervalo horizontal de uma coluna, entre os cabeçalhos vizinhos |
| `diaDaCelula(txt)` | número do dia, rejeitando hora e data |
| `buildFaltaBands(rows, faixaDia, period)` | faixa vertical de cada dia |
| `textoNaFaixa(rows, faixa, banda)` | remonta o texto de uma célula |
| `conferirDiaDaSemana(rows, faixaDia, bandas)` | confere o dia da semana impresso com o período |
| `readFaltas(rows, period)` | devolve os dias com `FALTA` |
| `contarFaltasPorEscala(dias, is12)` | F1, F2 e F3 |
| `dsrDeFaltas(contados, is12, period, mesCheio)` | Etapa 3 |
| `resolverFaltas(...)` | junta tudo e decide o estado da conferência |
| `faltaQtd/faltaDsr/faltaConf(e)` | acesso tolerante, para quem monta funcionário à mão |

A constante `FALTA_MES_CHEIO = 29` é o limite da F1.

`resolverFaltas()` recebe as linhas cruas da página (`pg.rows`) e não passa pelo
`identifyTableColumns()` em momento nenhum — nem para a coluna DIA. Além de corrigir o
descarte da coluna OBSERVAÇÃO, isso deixa o caminho da falta sem nenhum ponto de contato
com o do atestado.

### Testes

- `tests/unit.spec.js` — `normObs`, `contarFaltasPorEscala`, `dsrDeFaltas`,
  `lerTotalFaltasImpresso`, `faixaHorizontal` e `diaDaCelula`, incluindo o limite 28 vs
  29 da F1, o plural `OBSERVAÇÕES` e a rejeição de hora na coluna DIA.
- `tests/fixtures/gerar-pdf-sintetico.js` — seis páginas de falta com a verdade
  conferida à mão: pares corridos em 12×36, semanas distintas em Convencional, mês
  inteiro com 30, falta em fim de semana, uma página só de observações que não são falta,
  e uma com o rodapé mentindo (conferência divergente).
- `tests/e2e.spec.js` — QUANTIDADE, DSR e estado de conferência por funcionário, mais o
  snapshot da tabela.
- `ponto-sintetico-layout-producao.pdf` — uma página com as **onze colunas** do PDF real
  e a geometria que quebrou a primeira implementação: cabeçalho OBSERVAÇÃO centralizado
  em 468 com o texto em 416, e JORNADA com valor largo começando à esquerda do próprio
  cabeçalho. O fixture principal não reproduzia isso, e foi por onde o bug passou.

---

## Pendências

1. **Funcionário dividido em páginas.** Quando ocorre, os dias das páginas precisam ser
   juntados (chave: CPF) **antes** das regras — senão a mesma semana é contada duas vezes
   e a F1 nunca dispara. Hoje cada página vira uma linha. Falta saber se o
   `TOTAL DE FALTAS` repete o total do mês em cada página ou se divide.
2. **Conferência contra PDF real.** Os PDFs recebidos até agora passaram por
   "Microsoft: Print To PDF", que converte todo o texto em curvas e não deixa nada para
   extrair. A implementação foi construída e validada contra o fixture sintético, que
   reproduz o layout de produção; falta a rodada contra um arquivo original.

---

## Fora de escopo, anotado para depois

`is12x36()` hoje procura "12x36" no **texto inteiro da página** (`detectScale`), não na
linha do CARGO. Funciona nos documentos analisados, mas casaria também se a marcação
aparecesse numa observação ou na linha de LEGENDAS. Ancorar no CARGO seria mais correto.

Não entra aqui porque o `is12` também governa a detecção de atestado — mudá-lo altera a
contagem de ATM, e alterar contagem sem medição é exatamente o que
`LIMITACOES_CONHECIDAS.md` pede para não fazer.
