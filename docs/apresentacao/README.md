# Apresentação

`folha-facil.pptx` — 24 slides explicando as duas ferramentas, cada regra dos
arquivos `.md` com exemplo, e a estimativa de economia de tempo.

O deck não é editado à mão: ele é gerado por `gerar-apresentacao.js`. Para
mudar um slide, mude o script e gere de novo.

```bash
npm install pptxgenjs          # não é dependência do site, só da apresentação
node gerar-apresentacao.js folha-facil.pptx
```

**Ao alterar uma regra, alterar o slide correspondente.** Vale a mesma razão do
`docs/regras/`: apresentação que contradiz o código é pior que apresentação
nenhuma. Os números de economia de tempo são estimativas paramétricas — as
premissas estão abertas no slide 19, para serem trocadas pelas medições reais
quando existirem.
