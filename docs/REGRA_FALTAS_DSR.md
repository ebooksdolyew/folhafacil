# REGRA DE FALTAS E DSR — Guardião Sepog

**Estado: especificação aprovada, implementação pendente.**

Este arquivo descreve como o Guardião Sepog passa a ler faltas dia a dia, a partir da
coluna OBSERVAÇÃO do PDF de frequências, e a calcular a QUANTIDADE e a DSR. Nada disso
está no código ainda — o documento vem antes para que a regra seja conferida antes de
virar número em folha de pagamento.

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

---

## Por que a coluna OBSERVAÇÃO

Toda falta aparece na coluna OBSERVAÇÃO, escrita como `FALTA`. Nas colunas de marcação
(ENT/SAI) a falta em geral **não** deixa rastro: o dia fica com as células vazias.

Dois documentos reais de maio/2026 confirmaram que a coluna é fiel ao que o próprio
sistema de ponto contabiliza:

| Caso | Linhas com `FALTA` na OBSERVAÇÃO | `TOTAL DE FALTAS` impresso no rodapé |
|---|---|---|
| A — Convencional | 6 (dias 06, 15, 20, 22, 27, 29) | 6 |
| B — 12×36 | 2 (dias 03, 04) | 2 |

É essa coincidência que sustenta a validação descrita mais abaixo.

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

### Passo 1: localizar a coluna

`identifyTableColumns()` já monta `allColumns` com todos os cabeçalhos da linha de
título. Procura-se ali a chave que, normalizada (maiúscula, sem acento), seja
`OBSERVACAO` — no **singular**.

Se a coluna não for encontrada, ou se a tabela não for identificada, a página **não**
devolve zero faltas: devolve *não foi possível ler*. São estados diferentes e não podem
ser confundidos (ver Etapa 4).

### Passo 2: delimitar a faixa de cada dia

Das células da coluna `DIA`, consideram-se as que resultam num número de 1 a 31. Cada
uma tem uma posição vertical. A **faixa** de um dia vai do ponto médio entre ele e o dia
de cima até o ponto médio entre ele e o dia de baixo; a primeira e a última se estendem
meia linha para fora.

Um token pertence a um dia quando sua posição vertical cai dentro da faixa daquele dia.

Isso substitui a tolerância fixa que a detecção de ATM usa, e resolve dois problemas de
uma vez:

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

O texto remontado é normalizado — maiúscula, sem acento, espaços colapsados, pontuação
final (`*`, `.`, `:`) removida — e então:

| Conteúdo da célula | Resultado |
|---|---|
| exatamente `FALTA` | **conta como falta** |
| contém a palavra FALTA mas não é só ela | **não conta** — registrado como variante e reportado |
| qualquer outro texto | ignorado |
| vazio | ignorado |

O casamento é por **igualdade**, nunca por "contém". É o que impede que um eventual
`FALTA JUSTIFICADA` ou `FALTA ABONADA` entre na conta. E é também por isso que existe o
registro de variantes: em vez de contar errado ou ignorar em silêncio, o programa mostra
na tela o texto que encontrou, para decisão humana. É assim que o vocabulário desconhecido
aparece em vez de se esconder.

Textos já observados nos documentos reais que **não** contam, e que servem de caso de
teste negativo:

- `FERIADO (Dia do Trabalho)`
- `BATIDAS FORA DA MARGEM`
- `ATESTADO 2 DIAS*`
- `PONTO ABONADO COM ACORDO DA DIREÇÃO`
- `Permuta do dia 22 e 24 acordado com a chefe do` (texto cortado na largura da coluna)

### Resultado da Etapa 1

Uma lista de dias, não um total:

```
Caso A (Convencional) → [6, 15, 20, 22, 27, 29]
Caso B (12×36)        → [3, 4]
```

O total é subproduto da lista. **A lista é o dado**, porque sem saber *quais* dias são
não há como aplicar as regras de dias corridos nem calcular a DSR.

---

## Etapa 2 — Contagem por escala

A escala vem do `is12` do Guardião, que a lê do CARGO impresso no cabeçalho do documento.
O calendário vem do período do documento.

### Conferência do período

A coluna `DIA` imprime o dia da semana de cada linha. Antes de aplicar qualquer regra,
compara-se o dia da semana impresso com o calculado a partir do período lido.

Se discordarem, o mês foi lido errado. A página é **sinalizada** em vez de produzir uma
DSR silenciosamente errada — a DSR depende de em qual semana o dia cai, então mês errado
significa DSR errada.

### As regras, na ordem

A primeira que se aplicar encerra o cálculo.

**F1 — Mês cheio (31).** 31 faltas saem como 31, sem passar por escala e **sem DSR**.

> Pendência: a regra é pelo número 31, não por "mês inteiro" — é como está definido para
> a Infrequência em `regras/REGRAS.md`. Em fevereiro, 28 faltas não acionam F1. O Guardião
> conhece o tamanho real do mês e poderia decidir melhor, mas mudar isso faria os dois
> programas devolverem números diferentes para a mesma pessoa. Fica como está até haver
> decisão explícita.

**F2 — 12×36: dia sim, dia não.** Dentro de cada sequência de dias corridos de falta,
conta o 1º, pula o 2º, conta o 3º, pula o 4º. A sequência recomeça quando há um dia sem
falta no meio. Falta isolada conta sempre. Fim de semana conta normalmente.

**F3 — Convencional: fim de semana não conta.** Sábado e domingo são descartados.

**F3-exceção — todas em fim de semana.** Se *todas* as faltas do funcionário caírem em
sábado ou domingo, todas contam, e a linha recebe o aviso
*"Faltas apenas em fim de semana (dias X, Y) — verificar"*. Basta uma falta em dia útil
para a exceção não valer.

> É por causa desta exceção que a extração **não pode** filtrar fim de semana. Se o
> sábado nunca for registrado, o programa não tem como saber que todas as faltas caíram
> em fim de semana. Este é o ponto em que a falta se comporta de maneira oposta ao
> atestado, que descarta o fim de semana logo na leitura.

---

## Etapa 3 — DSR

Calculada **só sobre os dias que contaram** depois da Etapa 2.

| Escala | DSR |
|---|---|
| 12×36 | uma por falta contada |
| Convencional | uma por semana distinta com falta contada |
| Mês cheio (F1) | nenhuma |

Semana, para a Convencional, é identificada pela segunda-feira correspondente ao dia.
Duas faltas na mesma semana geram uma DSR; duas em semanas diferentes geram duas.

Exemplo do Caso A — faltas em 06-Qua, 15-Sex, 20-Qua, 22-Sex, 27-Qua, 29-Sex:

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

## Etapa 4 — Validação

São **quatro números diferentes**, e confundi-los é o erro mais fácil de cometer aqui:

| | Caso A (Convencional) | Caso B (12×36) |
|---|---|---|
| impresso no rodapé (`TOTAL DE FALTAS`) | 6 | 2 |
| contado na coluna OBSERVAÇÃO | 6 | 2 |
| QUANTIDADE depois das regras | 6 | **1** |
| DSR | **4** | **1** |

**A validação compara impresso × contado** — os dois primeiros, ambos crus, antes de
qualquer regra. Nunca compara com a QUANTIDADE final.

Isso é essencial. No Caso B o impresso (2) é diferente da QUANTIDADE (1), e isso **não é
divergência**: é a F2 fazendo o trabalho dela. Se a validação comparasse com a
QUANTIDADE, ela acusaria erro em todo funcionário 12×36 com faltas em dias corridos e em
todo Convencional com falta em fim de semana.

### Estados possíveis

| Estado | Quando | O que acontece |
|---|---|---|
| **Conferido** | rodapé lido e igual ao contado | segue normal |
| **Divergente** | rodapé lido e diferente do contado | mostra os dois números e a lista de dias lidos; a DSR é calculada, mas a linha é marcada para conferência |
| **Sem conferência** | rodapé não encontrado, ou tabela/coluna não identificada | linha marcada; diferente de "zero faltas" |

### A regra que não se negocia

**O número que vale é sempre o dos dias contados.** O total impresso nunca sobrescreve a
lista — ele só responde *"você leu todos?"*.

Se o rodapé disser 6 e a leitura encontrar 5 dias, o programa **não inventa um sexto
dia**: ele marca a página. Um dia que não se sabe qual é não tem semana, e sem semana não
há DSR.

---

## Mudança necessária fora da falta

`extractTotalFaltas()` hoje devolve `null` tanto para "o total é zero" quanto para "não
encontrei o rótulo". Sem separar os dois, o estado *Sem conferência* não pode existir.
É a única alteração que esta regra exige em código já existente.

---

## Pendências

Itens que só podem ser resolvidos com um PDF que tenha camada de texto — os documentos
recebidos até agora passaram por "Microsoft: Print To PDF", que converte todo o texto em
curvas e não deixa nada para extrair.

1. **Funcionário dividido em páginas.** Quando ocorre, os dias das páginas precisam ser
   juntados (chave: CPF) **antes** das regras — senão a mesma semana é contada duas vezes
   e a F1 nunca dispara. Falta saber se o `TOTAL DE FALTAS` repete o total do mês em cada
   página ou se divide.
2. **Fatiamento dos tokens.** Se `01 - Sex` chega como um item ou como três, e se o texto
   da OBSERVAÇÃO chega inteiro ou cortado na largura da coluna.
3. **Vocabulário completo da coluna.** Os textos listados na Etapa 1 vieram de dois
   documentos. O registro de variantes existe justamente para revelar o resto.

---

## Fora de escopo, anotado para depois

`is12x36()` hoje procura "12x36" no **texto inteiro da página** (`detectScale`), não na
linha do CARGO. Funciona nos documentos analisados, mas casaria também se a marcação
aparecesse numa observação ou na linha de LEGENDAS. Ancorar no CARGO seria mais correto.

Não entra aqui porque o `is12` também governa a detecção de atestado — mudá-lo altera a
contagem de ATM, e alterar contagem sem medição é exatamente o que
`LIMITACOES_CONHECIDAS.md` pede para não fazer.

---

## Onde estará no código

A preencher quando a implementação entrar. Cada função nova desta regra fica separada das
funções de atestado, e a alteração de qualquer regra acima entra neste arquivo no mesmo
commit.
