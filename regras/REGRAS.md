# Regras de quantidade — Leitor de faltas e atestados

Estas regras definem o número que vai para a coluna **QUANTIDADE** das planilhas
geradas (modelo da folha e planilha detalhada). Elas ficam implementadas na função
`quantidadeFinal(contados, tipo, escala)` dentro de `infrequencia.html`, e este arquivo é a
referência em linguagem simples. **Toda regra nova entra aqui e no código.**

- `contados` = dias marcados na planilha de origem para aquele tipo (F, A ou D/TRE)
- `tipo` = `F` (falta), `A` (atestado), `D` (TRE)
- `escala` = `12×36` para porteiro, porteiro diurno e porteiro noturno; `Convencional`
  para todas as outras funções. O campo **Escala** da barra de ações é um filtro:
  `Tudo` gera as duas escalas juntas, `Convencional` ou `12×36` gera só aquela.

As regras são avaliadas **na ordem abaixo**. A primeira que se aplicar encerra o cálculo.

---

## R1 — Mês cheio (31)

**Todo funcionário que tiver 31 faltas ou 31 atestados sai na planilha com
QUANTIDADE = 31, sem depender de escala.**

- Vale para `F` (falta) e `A` (atestado). Não vale para TRE.
- É a primeira verificação: se `contados === 31`, devolve 31 e **nenhuma regra de
  escala é aplicada** a essa linha.
- Motivo: as regras de escala (R2 em diante) vão alterar a quantidade final relatada;
  quem está o mês inteiro afastado/faltando precisa continuar saindo como 31.
- Nota: a regra é pelo número 31, não por "mês inteiro". Em meses de 30 dias, 30
  atestados **não** acionam R1 (se isso precisar mudar, ajustar `MES_CHEIO` no código
  e esta nota).

### Filtro "31 ocorrências"

Além da R1, o programa tem um filtro para **enxergar e exportar só quem chegou a 31
ocorrências no mês**, somando **faltas + atestados** (TRE não entra na soma):

- aba **"Ausência mês completo"** no relatório visual (Conferência);
- campo **Funcionários → "Ausência mês completo"** na barra de ações, que
  limita as duas planilhas geradas a esses funcionários (o nome do arquivo ganha
  `_SO31`).

Implementado em `temMesCheio(r)` → `r.cF + r.cA === MES_CHEIO`.

## R2 — 12×36: falta em dia sim, dia não

**Funcionário de escala 12×36 (porteiro, porteiro diurno, porteiro noturno): para
cada falta contabilizada em um dia, a falta do dia SEGUINTE não é contabilizada.**

- Vale **só para faltas** (`F`). Atestado e TRE continuam contando dia a dia.
- Vale só para `12×36`. Convencional não muda.
- Dentro de cada sequência de dias corridos de falta: conta o 1º dia, pula o 2º,
  conta o 3º, pula o 4º... A sequência recomeça quando há um dia sem falta no meio.
- Faltas isoladas (sem falta no dia anterior) contam sempre.
- **Exceção: R1 vem antes.** Quem tem 31 faltas sai com 31, sem passar por esta regra.

Exemplos (dias de falta → QUANTIDADE):

| Faltas marcadas | Contadas | Não contadas | QUANTIDADE |
|---|---|---|---|
| 5, 6, 7 | 5, 7 | 6 | 2 |
| 5, 6 | 5 | 6 | 1 |
| 5, 7, 9 | 5, 7, 9 | — | 3 |
| 5, 6, 7, 8, 9, 10 | 5, 7, 9 | 6, 8, 10 | 3 |
| 5, 6, 8, 9 | 5, 8 | 6, 9 | 2 |
| 1 a 31 (mês cheio) | todos | — | 31 (R1) |

Na planilha detalhada, a coluna **Dias** lista só os dias contados e a coluna
**Dias não contados** lista os que a R2 pulou, para conferência.

## R3 — Convencional só conta segunda a sexta

**Falta, atestado ou TRE de funcionário Convencional que cair em sábado ou domingo não
conta.** Feriado conta normal; R1 vem antes. Como o programa descobre o dia da semana
(mês anterior ao atual + ano, com confirmação quando o cabeçalho diverge) está descrito
em **[regra-escala-convencional.md](regra-escala-convencional.md)**.

## R4 — DSR (descanso semanal remunerado)

Só faltas. **Convencional:** 1 DSR por semana (seg a sex) com pelo menos uma falta
contada, não importa quantas. **12×36:** 1 DSR por falta contada. 31 faltas fica sem DSR. Sai na coluna **DSR** ao lado de
QUANTIDADE. Detalhes e a exceção de faltas só em fim de semana em
**[regra-dsr.md](regra-dsr.md)**.

## R5+ — Próximas regras

_A definir._

---

## Onde está no código

```js
const MES_CHEIO = 31;

function diasContados(r, tipo, escala){
  const dias = /* dias do mês marcados com `tipo` para este funcionário */;

  // R1 — mês cheio
  if((tipo === 'F' || tipo === 'A') && dias.length === MES_CHEIO) return { contados: dias, pulados: [] };

  // R2 — 12×36, só faltas: dia sim, dia não dentro de cada sequência de dias corridos
  if(tipo === 'F' && escala === '12×36'){ /* ... */ }

  // R3 — Convencional (falta, atestado e TRE): sábado e domingo não contam
  //      exceção (só faltas): todas em fim de semana -> contam, com aviso
  if(escala === 'Convencional'){ /* ... */ }

  return { contados: dias, pulados: [] };
}
```

`QUANTIDADE = diasContados(...).contados.length`; `DSR = dsrDe(r, escala, contados)` (R4). Chamada em `montarSaida()`, uma vez
por linha gerada (funcionário × tipo).
