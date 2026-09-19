# Regra da escala Convencional — dias da semana

Complementa o [REGRAS.md](REGRAS.md). Define como o programa descobre o dia da semana
de cada dia do mês e a regra **R3**, que só conta faltas de segunda a sexta para quem
tem escala Convencional.

---

## 1. De onde vem o mês e o ano

A planilha de origem só traz o dia e a sigla do mês no cabeçalho (`01/ago`, `02/ago`…).
Não traz o ano. O programa decide assim:

| O quê | Regra |
|---|---|
| **Mês de referência** | **Sempre o mês anterior ao atual**, pelo relógio do computador. |
| **Ano** | O ano atual — **exceto em janeiro**, quando a planilha é de dezembro e o ano é o anterior. |
| **Sigla do cabeçalho** (`ago`) | Serve só para **conferir**, não para decidir. |

Exemplos:

| Hoje | Mês de referência |
|---|---|
| 18/09/2026 | agosto de 2026 |
| 05/01/2027 | dezembro de 2026 |
| 03/02/2027 | janeiro de 2027 |

## 2. Confirmação quando o cabeçalho diverge

Se a sigla do cabeçalho indicar um mês **diferente** do mês de referência, o programa
**não gera nada** sem perguntar. Ao clicar em "Gerar no modelo da folha" ou "Planilha
detalhada" aparece a pergunta:

> O cabeçalho da planilha indica **junho**, mas o mês esperado (anterior ao atual) é
> **agosto de 2026**. Qual é o mês verdadeiro deste arquivo?
>
> [ junho de 2026 (cabeçalho) ]  [ agosto de 2026 (mês anterior) ]  Cancelar

- A resposta vale para o arquivo aberto; não pergunta de novo na próxima geração.
- Ao trocar de arquivo, a verificação recomeça.
- Quando a sigla bate com o mês de referência, não há pergunta.
- Se o cabeçalho vier como **data real do Excel** (não texto), o mês **e o ano** são lidos
  da própria data e usados na conferência.

Além disso, o programa avisa em vermelho abaixo da área de upload se o número de colunas
de dia da planilha for diferente do número de dias do mês de referência (ex.: mês de 31
dias com planilha de 30 colunas). Fevereiro bissexto é tratado automaticamente.

## 3. Como o programa sabe o dia da semana

Não vem de nenhuma tabela nem da internet: vem do **calendário embutido no navegador**.
Com mês, ano e dia, o JavaScript calcula o dia da semana:

```js
new Date(2026, 7, 14).getDay()   // → 5 = sexta-feira   (mês começa em 0: 7 = agosto)
```

Cada dia lido (`STATE.days[i]`) guarda `dow` (0 = domingo … 6 = sábado) e `fimDeSemana`.
Na tela de Conferência, cada bloco de dia mostra a letra do dia da semana em cima do
número (S T Q Q S S D) e sábado/domingo têm fundo cinza — dá para conferir a olho.

## 4. R3 — Convencional só conta segunda a sexta

**Ocorrência (falta, atestado ou TRE) de funcionário de escala Convencional que cair em
sábado ou domingo não conta.**

- Vale para **falta, atestado e TRE**.
- Vale só para **Convencional**. 12×36 segue a R2 (dia sim, dia não, só faltas).
- **Feriados não entram na conta**: segunda a sexta conta sempre, feriado ou não.
- **R1 vem antes**: quem tem 31 faltas sai com 31, sem passar por esta regra.
- **Exceção (só faltas):** se *todas* as faltas do funcionário caírem em fim de semana,
  elas contam, geram DSR e a planilha recebe um aviso para verificar — ver
  [regra-dsr.md](regra-dsr.md).
- Na planilha detalhada, os fins de semana descartados vão para a coluna
  **Dias não contados**. Na tela de Conferência, o bloco do dia descartado aparece
  riscado com contorno tracejado e a coluna F/ATM/TRE mostra "conta N" abaixo do
  número marcado.

Exemplo — junho de 2026 (dia 1 é segunda), Convencional, faltas do dia 1 ao 29:

| Faltas marcadas | Contadas | Não contadas | QUANTIDADE |
|---|---|---|---|
| 1 a 29 (29 dias) | 1–5, 8–12, 15–19, 22–26, 29 | 6, 7, 13, 14, 20, 21, 27, 28 | **21** |
| 1 a 30 (mês cheio de 30 dias) | igual acima + 30 | 6, 7, 13, 14, 20, 21, 27, 28 | 22 (não é 31, então R1 não se aplica) |

## 5. Ordem final das regras

```
R1  31 faltas ou 31 atestados            → 31, encerra
R2  12×36 + falta                        → dia sim, dia não por sequência
R3  Convencional + falta/atestado/TRE    → descarta sábado e domingo
    qualquer outro caso                  → conta todos os dias marcados
```

## 6. Onde está no código (`infrequencia.html`)

- `mesAnterior()`, `mesDaSigla()`, `aplicarCalendario()` — mês/ano de referência e `dow`
  de cada dia.
- `mesDivergente()` e `confirmarMes()` — detecção da divergência e a pergunta (modal
  `#modal`). Chamadas no início de `#btn-modelo` e `#btn-export`.
- `diasContados()` — bloco `// R3`.
- `stripHTML()` — letra do dia da semana e classe `fds` nos blocos.
