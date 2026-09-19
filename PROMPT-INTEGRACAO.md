# Prompt — integrar a ferramenta "Infrequência" ao index.html do repositório

Cole o texto abaixo (a partir da linha "---") no Claude Code aberto **na raiz do
repositório de destino**, com esta pasta já copiada para dentro dele (ex.:
`ferramentas/infrequencia/`). Ajuste o caminho se usar outro.

---

Quero adicionar uma segunda ferramenta ao `index.html` deste repositório, com um seletor
para o usuário escolher qual ferramenta usar. A ferramenta nova já está pronta e testada em
`ferramentas/infrequencia/infrequencia.html`; a documentação das regras dela está em
`ferramentas/infrequencia/regras/` e o `README.md` da pasta descreve o que ela faz.

## Restrição principal — não mexer no que já existe

- **Nenhuma regra, cálculo, texto, campo ou comportamento da ferramenta atual do
  `index.html` pode mudar.** Nem o de `infrequencia.html`. As duas são código validado.
- Não renomeie, não "limpe", não reformate nada dentro das duas ferramentas. Só é
  permitido *envolver* cada uma em um contêiner e adicionar o seletor por fora.
- Antes de começar, leia o `index.html` atual inteiro e o `infrequencia.html` (pule a
  linha gigante da biblioteca xlsx embutida) e me diga em uma lista o que você encontrou
  de conflito potencial (ver seção abaixo) e qual estratégia vai usar. Só implemente
  depois que eu confirmar.

## O que quero na tela

- Ao abrir o `index.html`, um seletor simples e visível no topo com as duas opções:
  **[nome da ferramenta atual]** e **Infrequência**.
- A ferramenta atual continua sendo a padrão ao abrir (nada muda para quem já usa).
- Ao trocar, a outra ferramenta aparece e a anterior some — sem recarregar a página, e
  sem perder o que o usuário já fez na ferramenta anterior (ela só fica escondida).
- Lembrar a última escolha (`localStorage`) é bem-vindo, mas não obrigatório.
- Visual do seletor: neutro, que combine com o `index.html` atual. Não tente igualar o
  visual das duas ferramentas; cada uma mantém o seu.

## Conflitos que você precisa tratar

`infrequencia.html` foi feito para viver sozinho na página. Ele tem:

1. **CSS em seletores de elemento**: `body`, `section`, `h1`, `h2`, `table`, `th`, `td`,
   `button`, `select`, `input`, `label`, `mark`, `header`, `::selection`, além de
   variáveis em `:root` e `@media (prefers-color-scheme: dark)`. Se for colado direto no
   mesmo documento, isso **vai** alterar o visual da ferramenta atual — e vice-versa.
2. **JavaScript global**: helper `$` (= `document.querySelector`), objeto `STATE`, e
   dezenas de funções de nome curto (`parse`, `render`, `tabela`, `validar`, `col`,
   `norm`, `up`, `criticas`, `handleFile`, `drop`, `vista`…). Também define `window.XLSX`
   (biblioteca xlsx-js-style 0.18.5 embutida, ~430 KB).
3. **IDs de elemento** genéricos: `file`, `drop`, `stats`, `modal`, `aviso`, `tbl`,
   `busca`, `actionbar`, `resumo`, `criticas`… Qualquer ID igual no `index.html` atual
   quebra uma das duas.
4. `position: sticky` na barra de ações e um modal `position: fixed` — precisam continuar
   funcionando dentro do contêiner escolhido.
5. Fonte Inter via Google Fonts (com fallback local; funciona offline sem ela).

## Estratégia recomendada (use esta, a menos que encontre motivo forte contra)

**Manter `infrequencia.html` como arquivo separado e carregá-lo dentro de um `<iframe>`
no `index.html`.** É a única forma de garantir zero interferência de CSS, JS e IDs entre as
duas ferramentas sem editar nenhuma delas.

- `index.html` ganha: o seletor no topo, um `<div>` envolvendo a ferramenta atual (sem
  alterar nada dentro dele) e um `<iframe src="ferramentas/infrequencia/infrequencia.html">`
  que ocupa a área toda abaixo do seletor, com `display:none` enquanto não estiver
  selecionado (assim o estado dela é preservado ao alternar).
- O iframe deve ter altura da viewport menos o seletor (`height: calc(100vh - Xpx)`),
  sem borda, largura 100%, e `allow="clipboard-write"` não é necessário. O download
  das planilhas (`XLSX.writeFile`) funciona normalmente dentro de iframe de mesma origem.
- Se o site for servido por `file://`, teste que o iframe carrega (mesma pasta/subpasta
  funciona em Chrome e Edge). Se for GitHub Pages ou servidor, funciona sem ressalva.

Se você concluir que o iframe **não** serve (me diga o motivo), a alternativa é embutir
tudo no mesmo documento **com isolamento explícito**: envolver o CSS da Infrequência em
`@scope` ou prefixar todos os seletores com `#infreq`, envolver todo o JS em uma IIFE
que use `document.getElementById('infreq')` como raiz em vez de `document`, e prefixar
todos os IDs. Isso é muito mais trabalho e muito mais fácil de quebrar algo — só faça se
for realmente necessário, e nunca mexendo nas funções de regra (`diasContados`,
`dsrDe`, `escalaDe`, `quantidadeFinal`, `validar`, `aplicarCalendario`, `mesDivergente`,
`confirmarMes`).

## Checklist de aceite (teste tudo antes de me entregar)

- [ ] `index.html` abre na ferramenta atual, exatamente como antes (compare visualmente
      com um print de antes da mudança).
- [ ] O seletor alterna entre as duas ferramentas sem recarregar a página.
- [ ] Na Infrequência, dentro do `index.html`: carregar um .xlsx, ver a conferência, gerar
      "Modelo da folha" e "Planilha detalhada" — os dois arquivos baixam.
- [ ] O modal "Confirmar mês da planilha" da Infrequência aparece centralizado e clicável
      (abra um arquivo cujo cabeçalho seja de um mês diferente do anterior ao atual).
- [ ] A barra de ações da Infrequência continua fixa no topo ao rolar.
- [ ] Trocar para a ferramenta atual e voltar: o arquivo carregado na Infrequência
      continua lá.
- [ ] Modo escuro do sistema não quebra nenhuma das duas.
- [ ] Largura de celular (≤ 640 px): seletor e as duas ferramentas continuam usáveis.
- [ ] `git diff` do `index.html` mostra **apenas** o seletor, o contêiner e o iframe —
      nenhuma linha da lógica atual alterada.
- [ ] Nenhum `.xlsx`/`.csv` entrou no commit (o `.gitignore` da pasta cuida disso;
      confira com `git status`).

Quando terminar, me mostre o `git diff --stat` e um resumo do que foi adicionado.
