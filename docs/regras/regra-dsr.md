# Regra da DSR — descanso semanal remunerado

Complementa o [REGRAS.md](REGRAS.md) e a [regra-escala-convencional.md](regra-escala-convencional.md).
Vale **apenas para faltas**. Atestado e TRE não têm DSR e não foram alterados.

---

## R4 — DSR: 1 por semana com falta

**Para cada semana (segunda a sexta) em que o funcionário Convencional tiver pelo menos
uma falta contada, lança-se 1 DSR. A DSR não acompanha o número de faltas — é uma por
semana, não importa quantas faltas houve nela.**

| Situação | DSR |
|---|---|
| 1 falta | 1 |
| 2 ou mais faltas **na mesma semana** | 1 |
| 2 faltas em **semanas diferentes** | 2 |
| Faltas espalhadas em N semanas distintas | N |

Condições:

- Esta contagem por semana vale para a escala **Convencional**. Para **12×36** a regra
  é outra, mais simples — ver abaixo.
- **Só faltas.** A DSR usa as faltas **que contam** depois das regras R1–R3 (fim de
  semana descartado pela R3 não gera DSR, exceto no caso abaixo).
- **31 faltas (R1) → sem DSR.** Quem está com o mês cheio fica de fora do cálculo
  (coluna vazia).
- **Semana** = segunda a sexta. Semanas parciais no começo ou fim do mês contam como
  semana normal. Ex.: agosto/2026 tem as semanas 3–7, 10–14, 17–21, 24–28 e 31 — até
  5 DSR possíveis.

## 12×36: 1 DSR por falta contada

**Para porteiros (escala 12×36), cada falta contada gera 1 DSR.** Simples assim.

- "Falta contada" é a que sobra depois da R2 (dia sim, dia não): 3 faltas corridas
  contam 2 → DSR 2.
- Não olha semana nem fim de semana.
- 31 faltas (R1) → sem DSR, igual à Convencional.

| Faltas marcadas (12×36) | Contam (R2) | DSR |
|---|---|---|
| 5 | 1 | 1 |
| 5, 6, 7 | 2 (5, 7) | 2 |
| 5, 12, 19 | 3 | 3 |
| 1 a 31 | 31 | *(vazio)* |

## Exceção: faltas só em fim de semana (Convencional)

Normalmente a R3 descarta falta em sábado/domingo de quem é Convencional. Mas se
**todas** as faltas do funcionário caírem em fim de semana (uma, duas, três… todas), o
programa:

1. **conta** essas faltas na QUANTIDADE;
2. **gera DSR** — sábado e domingo da mesma semana valem 1 DSR; fins de semana
   diferentes, 1 DSR cada;
3. escreve na coluna **Observação** da planilha:
   *"Faltas apenas em fim de semana (dias 8, 9) — verificar"*.

Se o funcionário tiver ao menos uma falta em dia útil, a exceção não se aplica: os
fins de semana continuam descartados pela R3 e não geram DSR.

## Exemplos — agosto de 2026 (1 = sábado, 3 = segunda)

| Faltas marcadas | Contam | Não contam | DSR | Observação |
|---|---|---|---|---|
| 5 | 1 | — | 1 | |
| 5, 6 | 2 | — | 1 | |
| 5, 12 | 2 | — | 2 | |
| 5, 6, 12, 19 | 4 | — | 3 | |
| 8, 12 | 1 | 8 | 1 | (8 é sábado, descartado pela R3) |
| 1, 2, 3 | 1 | 1, 2 | 1 | |
| 8 | 1 | — | 1 | Faltas apenas em fim de semana (dia 8) — verificar |
| 8, 9 | 2 | — | 1 | Faltas apenas em fim de semana (dias 8, 9) — verificar |
| 8, 9, 15 | 3 | — | 2 | Faltas apenas em fim de semana (dias 8, 9, 15) — verificar |
| 1 a 31 | 31 | — | *(vazio)* | R1 — fora do cálculo |
| 12×36, faltas 5, 6, 7 | 2 | 6 (R2) | 2 | 1 DSR por falta contada |

## Onde aparece

- **Modelo da folha:** coluna **DSR** logo após QUANTIDADE, preenchida só nas linhas de
  falta. A coluna **Observação** só é criada quando alguma linha tem aviso.
- **Planilha detalhada:** colunas **DSR** e **Observação** sempre presentes.
- **Conferência (tela):** na coluna Situação aparece a etiqueta **DSR N** e, quando for
  o caso, o aviso de fim de semana em vermelho.

## Onde está no código (`infrequencia.html`)

- `dsrDe(r, escala, contados)` — 12×36 devolve `contados.length`; Convencional conta as
  semanas distintas (chave = segunda-feira da semana) entre os dias contados.
- `diasContados()` — bloco `// R3`, exceção `tipo === 'F' && !contados.length` devolve
  as faltas com `aviso`.
- `montarSaida()` — preenche `DSR` e `Observação` em cada linha.
