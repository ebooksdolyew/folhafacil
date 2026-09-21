# Layouts de exportação — Conciliador de Planilhas

Colunas exatas de cada planilha gerada por `conciliadorde-planilha.html`.
Espelham o que o código monta; mudou o código, muda aqui no mesmo commit.

## Importação de dependentes (Novati)

Aba única. Uma linha por **dependente novo** da aba *Incluir*.

```
ID FUNCIONARIO | GRAU DE PARENTESCO | DESCRIÇÃO | DATA DE NASCIMENTO | SEXO |
ESTUDANTE | SEGURO MEDICO | IMPOSTO DE RENDA | SEGURO DE VIDA | SALARIO FAMILIA |
TIPO DE DEFICIÊNCIA | DATA DO BLOQUEIO | DATA DO DESBLOQUEIO | OBSERVAÇÃO
```

- `ID FUNCIONARIO` = matrícula do titular resolvida na Novati.
- `GRAU`/`DESCRIÇÃO` e `SEXO` seguem as regras de grau de parentesco (ver
  [`REGRAS.md`](./REGRAS.md#grau-de-parentesco-para-dependentes-novos)).
- Datas em `DDMMAAAA`. Padrões fixos: `ESTUDANTE=N`, `SEGURO MEDICO=S`,
  `IMPOSTO DE RENDA=N`, `SEGURO DE VIDA=N`, `SALARIO FAMILIA=N`,
  `TIPO DE DEFICIÊNCIA=0`.

## Importação de descontos (folha)

Aba única. Uma linha por lançamento marcado, **com matrícula**.

```
Matricula | CPF | Provento | Valor
```

- `Matricula` e `CPF` (só números) são os do **titular**.
- `Provento` é o evento (697 / 645 / 710) — ver
  [Descontos](./REGRAS.md#descontos-eventos-da-folha).
- Também exporta em `.csv` (separador `;`, com BOM UTF-8).

## Transferências (Clin Odonto)

**Uma aba por empresa de destino.** O conjunto de colunas depende da empresa:
há layouts específicos para algumas empresas do grupo e um **layout genérico**
para as demais. Campos comuns preenchidos pelo código:

- `Filial_DESTINO` / `Empresa_DESTINO` = empresa correta na Novati.
- `Filial_ORIGEM` / `Empresa_ORIGEM` = empresa antiga mostrada no Clin Odonto.
- `Matricula` / `Matricula_Destino` = matrícula na Novati.
- `Status_Funcionario` = `ATIVO`; `Data_Transferencia` = 1º dia da competência.
- `Tipo_Segurado` = `TITULAR`/`DEPENDENTE`; `Plano` = `CLIN ODONTO`.
- `Categoria_Plano` = categoria da folha sugerida (ou o plano do Clin Odonto).
- Demais campos (telefone, admissão, contrato, nascimento, início de vigência)
  vêm do cadastro da Novati e da fatura.

## Exportações de conferência

As abas *Incluir, Excluir, Alterar, Verificar, Adesão manual e Avisos* também
exportam "lista completa" em `.xlsx` com as colunas mostradas na tela — são
apoio de conferência, não arquivos de importação.
