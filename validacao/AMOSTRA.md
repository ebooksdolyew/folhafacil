# Amostra de validação — GHUB

> ⚠️ **LGPD:** os PDFs em `validacao/pdfs/` e os exports em `validacao/baseline/`
> e `validacao/atual/` contêm nome de funcionário e dado de saúde (ATM).
> Estão no `.gitignore` e **nunca** devem ser comitados.

## Como usar

1. Coloque de 5 a 10 PDFs reais em `validacao/pdfs/` cobrindo os cenários da tabela abaixo.
2. Com a versão **baseline** (`git checkout v2.2-baseline -- index.html`), processe cada PDF
   e salve os exports em `validacao/baseline/<nome-do-pdf>.xlsx` e `.txt`.
3. Após cada fase, reprocesse os mesmos PDFs salvando em `validacao/atual/` e rode:

   ```bash
   python3 validacao/comparar.py validacao/atual
   ```

   Esperado nas Fases 1, 2 e 3: **0 divergências**.

## Cobertura mínima da amostra

Preencha a coluna "Resultado conferido manualmente" — essa é a verdade absoluta,
não o que o sistema diz.

| Arquivo | Cenário | Resultado conferido manualmente |
|---------|---------|--------------------------------|
| | Convencional com ATM em dia útil (caminho principal da REGRA 1) | |
| | Convencional com ATM em Sáb/Dom (testa a rejeição da REGRA 1) | |
| | 12×36 com JORNADA preenchida (caminho principal da REGRA 2) | |
| | 12×36 com JORNADA vazia (testa a rejeição da REGRA 2) | |
| | **12×36 com JORNADA = "Folga"** (caso da divergência da Fase 4) | |
| | Saldo de horas negativo em minutos (ex.: `-0:45`) | |
| | Funcionário com faltas (cobre `extractTotalFaltas`) | |
| | Funcionário sem nenhuma ocorrência (caso limpo) | |
| | PDF grande (o maior disponível) — referência de memória e tempo | |
| | PDF escaneado sem camada de texto (caminho de falha) | |

## Métricas do baseline

Anote com a versão `v2.2-baseline`, antes de qualquer alteração:

| Arquivo | Páginas | Tempo (s) | Memória da aba (Shift+Esc) | com ATM | saldo neg. | 12×36 | com faltas | Aviso de páginas sem funcionário |
|---------|---------|-----------|----------------------------|---------|-----------|-------|-----------|----------------------------------|
| | | | | | | | | |
