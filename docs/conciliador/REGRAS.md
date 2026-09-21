# Regras do Conciliador de Planilhas (Clin Odonto × Novati)

Ferramenta em `conciliadorde-planilha.html`. Concilia a **Fatura Detalhada do
Clin Odonto** (uma por empresa do grupo) com o **cadastro da folha (Novati)** e
classifica cada beneficiário em uma ação. Tudo roda no navegador — nenhum
arquivo sai do dispositivo.

Este documento descreve as regras que estão no código. **Toda regra nova entra
no código e neste `docs/conciliador/` no mesmo commit** — documentação que
contradiz o código é pior que documentação nenhuma.

Os layouts das planilhas geradas estão em
[`layouts-exportacao.md`](./layouts-exportacao.md).

---

## R0 — Chave de comparação e papéis

- **Chave** = `CPF + tipo`, onde tipo é **titular (T)** ou **dependente (D)**.
  Não há restrição de filial: a comparação considera todas as empresas do grupo
  ao mesmo tempo.
- **Papel no Clin Odonto**: `parentesco == "TITULAR"` → T; qualquer outro → D.
- **Papel na Novati**: é titular quando `Cpf == CpfTitular` **ou** quando o nome
  do beneficiário é igual ao `NomeFuncionario`; caso contrário, dependente.
- **Vínculo titular ↔ dependente**: derivado do agrupamento por titular da
  Fatura Detalhada (cabeçalho da família `NNNNN - NOME [CPF:…] [Mat:…]`). Todos
  os membros herdam o `CPF do titular` (`cpfTit`).
- **Beneficiário sem CPF na fatura**: tenta ser localizado na Novati pelo nome,
  dentro da mesma família (mesmo `cpfTit` e mesmo papel). Se não achar, entra em
  **Avisos** e o cadastro deve ser conferido à mão.

## R1 — Deduplicação do Clin Odonto (mesma chave em vários arquivos)

Quando a mesma chave (CPF+tipo) aparece em mais de um arquivo do grupo:

1. Se os **nomes divergem**, mantém **todos** os registros e gera aviso
   *"CPF usado por mais de uma pessoa no Clin Odonto"*.
2. Se o nome é o mesmo, mantém **o registro de maior valor cobrado**. Havendo
   mais de um registro com valor > 0, gera aviso *"Mais de um registro ativo p/
   mesma pessoa"* para conferência.

## R2 — Competência e datas

- **Competência** vem da folha Novati (`AnoMesRef`). Se ausente, é derivada do
  cabeçalho "Competência: MÊS/AAAA" da Fatura Clin Odonto.
- **Data sugerida de exclusão** = último dia do **mês anterior** à competência.
- **Data de transferência** = primeiro dia do mês da competência.

---

## Classificação de cada beneficiário

Cada pessoa cai em exatamente uma ação (fora Descontos e Avisos, que são
transversais). A comparação de valor usa tolerância de **R$ 0,02**.

### Incluir
Está no Clin Odonto, **ainda não** na Novati, **mas a matrícula do titular já é
conhecida** (o titular ou outro dependente da família já constam no sistema).
- **Dependente novo** (`dep`): pode ser importado com o layout oficial de
  dependentes.
- **Titular — plano pendente** (`titpend`): aguarda o layout de inclusão/exclusão.

### Excluir
Está cadastrado na Novati, **em uma empresa coberta por arquivo Clin Odonto
neste mês**, mas **não aparece** mais no Clin Odonto. Recebe a data sugerida de
exclusão (R2).
> **Trava de segurança:** se a filial da pessoa **não** tem arquivo Clin Odonto
> carregado, ela **não** é marcada para exclusão — vai para Avisos como
> *"Empresa sem arquivo Clin Odonto"*, evitando falsas exclusões.

### Alterar
A pessoa existe nos dois, mas o **valor cobrado pelo Clin Odonto diverge** do
valor na Novati. Ação necessária: **os valores do Clin Odonto são soberanos.**

### Verificar
O **código** do plano difere entre Clin Odonto e Novati, mas o **valor é igual**.
Costuma ser só diferença de numeração interna (não necessariamente erro).
Confira a categoria sugerida antes de agir.

### Transferências
A pessoa está corretamente cadastrada na Novati (**soberana quanto à lotação**),
mas o Clin Odonto ainda mostra a **empresa antiga** do grupo. Gera planilha no
layout do Clin Odonto (uma aba por empresa de destino) para regularizar.

### Adesão manual
**Famílias inteiras** (titular e dependentes) que constam no Clin Odonto mas não
têm **nenhum** registro na Novati — nem o titular, nem qualquer dependente. Sem
matrícula conhecida, não dá para montar arquivo de importação: o cadastro é
feito direto no sistema.

---

## Descontos (eventos da folha)

Extraídos do Clin Odonto; matrícula e CPF são sempre os do **titular**:

| Evento | Descrição | Origem |
|---|---|---|
| **697** | Adesão | `taxaAdesao > 0` |
| **645** | Prorata **titular** | `adicional > 0` e papel = T |
| **710** | Prorata **dependente** | `adicional > 0` e papel = D |

Lançamentos **sem matrícula** não entram no arquivo de importação (viram aviso e
aparecem na Adesão manual). No arquivo, cada linha sai como
`Matrícula | CPF (só números) | Provento | Valor`.

---

## Avisos (conferência manual)

Situações sinalizadas para conferência, sem bloquear o restante:

- CPF usado por mais de uma pessoa / CPF duplicado na Novati.
- Família sem titular identificado no Clin Odonto.
- Mais de um registro ativo para a mesma pessoa.
- Beneficiário sem CPF na fatura.
- Empresa ainda sem arquivo Clin Odonto carregado (exclusão suprimida).
- Desconto sem matrícula.

---

## Sugestões automáticas

### Categoria da folha (para Alterar / Verificar / Transferências)
Procura na aba de categorias da Novati:
1. Candidatas com o **mesmo código** de plano.
2. Sem código numérico, casa por **ORTO / não-ORTO**.
3. Filtra pelo **papel** (titular/dependente) e escolhe a de **valor mais próximo**.

### Vínculo arquivo Clin Odonto → empresa (filial) Novati
Tokeniza o nome da empresa (tokens de 4+ letras) e casa com as filiais da Novati
por: inclusão de token, distância de edição ≤ 2 (tokens de 6+ letras) ou prefixo
comum ≥ 5. O usuário pode corrigir o vínculo manualmente antes de comparar.

### Grau de parentesco (para dependentes novos)
- `FILH…` → 1; `ENTEAD…` → 12; `CÔNJUGE` → 3 (F) / 4 (M); demais → 13 ("Outros").
- **Sexo** é inferido pelo primeiro nome: termina em "A" → F; caso contrário, M.

---

## Privacidade (LGPD)

As planilhas trazem nome, CPF e vínculos. Por isso o processamento é
**integralmente local**: a biblioteca de leitura de planilha (`xlsx`) é
auto-hospedada em `vendor/`, a página não faz requisição a terceiros e a CSP do
`_headers` bloqueia o resto. As linhas de `.gitignore` que barram `*.xlsx`,
`*.xls` e `*.csv` valem também para esta ferramenta.
