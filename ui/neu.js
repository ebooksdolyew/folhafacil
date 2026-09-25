/* Folha Fácil — © 2026 Andrey Wesley Gomes. Todos os direitos reservados.
   Software proprietário. É proibido copiar, reproduzir, modificar ou redistribuir
   este código, no todo ou em parte, sem autorização por escrito do autor.
   Ver LICENSE. */
/* ════════════════════════════════════════════════════════════════════════
   Folha Fácil — lista neumórfica no lugar da lista nativa do <select>

   O <select> continua sendo o dono do estado: este arquivo só impede que o
   navegador abra a listinha cinza dele e mostra, no lugar, um painel com o
   visual do resto do programa. Ao escolher, grava no próprio <select> e
   dispara o evento 'change' — então toda a lógica das ferramentas continua
   funcionando sem saber que isto existe.

   Se este arquivo não carregar, o <select> volta a abrir a lista nativa e
   nada quebra.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var aberto = null;            // { sel, pop, opcoes, indice }
  var digitado = '', tDigitado = 0;

  function opcoesDe(sel) {
    return Array.prototype.filter.call(sel.options, function (o) { return !o.hidden; });
  }

  function fechar(devolverFoco) {
    if (!aberto) return;
    var a = aberto;
    aberto = null;
    a.sel.classList.remove('neu-aberto');
    a.sel.removeAttribute('aria-expanded');
    a.pop.classList.remove('neu-visivel');
    var tirar = function () { if (a.pop.parentNode) a.pop.parentNode.removeChild(a.pop); };
    a.pop.addEventListener('transitionend', tirar, { once: true });
    setTimeout(tirar, 260);     // rede de segurança se a transição não vier
    if (devolverFoco) a.sel.focus();
  }

  /* Trecho da janela que a pessoa realmente vê, nas coordenadas desta página.
     Dentro do Folha Fácil a Infrequência roda num iframe da altura do
     conteúdo inteiro e quem rola é a página de fora: o innerHeight do iframe
     são milhares de pixels, e a lista achava que sempre cabia embaixo — abria
     para baixo mesmo com o seletor no pé da tela. Sobe pelos iframes de mesma
     origem somando a posição de cada um; sozinha, é a própria janela. */
  function areaVisivel() {
    var a = { top: 0, left: 0,
              bottom: window.innerHeight || document.documentElement.clientHeight,
              right: window.innerWidth || document.documentElement.clientWidth };
    var w = window, dx = 0, dy = 0;
    try {
      while (w.frameElement && w.parent && w.parent !== w) {
        var f = w.frameElement.getBoundingClientRect();
        dx += f.left + w.frameElement.clientLeft;
        dy += f.top + w.frameElement.clientTop;
        w = w.parent;
        a.top = Math.max(a.top, -dy);
        a.left = Math.max(a.left, -dx);
        a.bottom = Math.min(a.bottom, w.innerHeight - dy);
        a.right = Math.min(a.right, w.innerWidth - dx);
      }
    } catch (_) {}                // iframe de outra origem: fica com a janela
    return a;
  }

  var ALTURA_MAX = 380;           // mesma de .neu-pop no neu.css

  function posicionar(sel, pop) {
    var r = sel.getBoundingClientRect();
    var v = areaVisivel();
    pop.style.minWidth = Math.round(r.width) + 'px';
    pop.style.maxHeight = '';
    pop.style.left = '0px';
    pop.style.top = '0px';
    // offsetWidth/Height e não getBoundingClientRect: na abertura a lista está
    // em scale(.98) (animação do neu.css) e sairia 2% menor, com rolagem à toa
    var p = { width: pop.offsetWidth, height: pop.offsetHeight };
    var largura = Math.max(p.width, r.width);
    var esquerda = Math.min(Math.max(v.left + 8, r.left), Math.max(v.left + 8, v.right - largura - 8));
    var abaixo = v.bottom - r.bottom - 8;
    var acima = r.top - v.top - 8;
    var paraCima = p.height > abaixo && acima > abaixo;
    var altura = Math.min(p.height, ALTURA_MAX, Math.max(120, Math.round(paraCima ? acima : abaixo)));
    pop.classList.toggle('neu-acima', paraCima);
    pop.style.maxHeight = altura + 'px';
    pop.style.left = Math.round(esquerda) + 'px';
    pop.style.top = Math.round(paraCima ? r.top - altura - 6 : r.bottom + 6) + 'px';
  }

  function destacar(indice) {
    if (!aberto) return;
    aberto.indice = indice;
    aberto.opcoes.forEach(function (b, i) {
      b.classList.toggle('neu-ativo', i === indice);
      if (i === indice && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' });
    });
  }

  function escolher(sel, valor) {
    if (sel.value !== valor) {
      sel.value = valor;
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    fechar(true);
  }

  function abrir(sel) {
    if (aberto && aberto.sel === sel) { fechar(true); return; }
    fechar(false);
    if (sel.disabled) return;

    var itens = opcoesDe(sel);
    if (!itens.length) return;

    var pop = document.createElement('div');
    pop.className = 'neu-pop';
    pop.setAttribute('role', 'listbox');
    // o foco fica no <select>: com a lista aberta pelo teclado (Tab + Enter),
    // apertar no fundo ou na barra de rolagem dela tirava o foco do seletor, o
    // 'blur' abaixo fechava a lista e, numa lista longa (empresas), não dava
    // para arrastar a barra
    pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
    var rotulo = sel.getAttribute('aria-label') ||
      (sel.closest('label') ? sel.closest('label').textContent.trim() : '');
    if (rotulo) pop.setAttribute('aria-label', rotulo);

    var botoes = itens.map(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'neu-opt';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(o.value === sel.value));
      if (o.disabled) b.disabled = true;
      b.textContent = o.textContent;
      b.addEventListener('click', function () { if (!o.disabled) escolher(sel, o.value); });
      b.addEventListener('mousemove', function () { destacar(botoes.indexOf(b)); });
      pop.appendChild(b);
      return b;
    });

    document.body.appendChild(pop);
    aberto = { sel: sel, pop: pop, opcoes: botoes, indice: -1 };
    posicionar(sel, pop);
    sel.classList.add('neu-aberto');
    sel.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { pop.classList.add('neu-visivel'); });

    var atual = itens.findIndex(function (o) { return o.value === sel.value; });
    destacar(atual >= 0 ? atual : 0);
  }

  function andar(passo) {
    if (!aberto) return;
    var n = aberto.opcoes.length, i = aberto.indice;
    for (var k = 0; k < n; k++) {
      i = (i + passo + n) % n;
      if (!aberto.opcoes[i].disabled) break;
    }
    destacar(i);
  }

  function porLetra(letra) {
    if (!aberto) return;
    var agora = Date.now();
    digitado = (agora - tDigitado < 900) ? digitado + letra : letra;
    tDigitado = agora;
    var achou = aberto.opcoes.findIndex(function (b) {
      return b.textContent.trim().toLowerCase().indexOf(digitado) === 0;
    });
    if (achou >= 0) destacar(achou);
  }

  function preparar(sel) {
    if (sel.dataset.neu === '1') return;
    sel.dataset.neu = '1';
    sel.setAttribute('aria-haspopup', 'listbox');

    // impede a lista nativa (funciona em Chrome, Edge, Firefox e Safari)
    sel.addEventListener('mousedown', function (e) { e.preventDefault(); abrir(sel); });
    sel.addEventListener('touchstart', function (e) { e.preventDefault(); abrir(sel); }, { passive: false });
    sel.addEventListener('click', function (e) { e.preventDefault(); });

    sel.addEventListener('keydown', function (e) {
      var k = e.key;
      if (!aberto || aberto.sel !== sel) {
        // com a lista fechada, as setas mudariam o valor direto: abre no lugar
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar') {
          e.preventDefault(); abrir(sel);
        }
        return;
      }
      if (k === 'ArrowDown') { e.preventDefault(); andar(1); }
      else if (k === 'ArrowUp') { e.preventDefault(); andar(-1); }
      else if (k === 'Home') { e.preventDefault(); destacar(0); }
      else if (k === 'End') { e.preventDefault(); destacar(aberto.opcoes.length - 1); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar' || k === 'Tab') {
        e.preventDefault();
        var i = aberto.indice, itens = opcoesDe(sel);
        if (i >= 0 && itens[i] && !itens[i].disabled) escolher(sel, itens[i].value);
        else fechar(true);
      }
      else if (k === 'Escape') { e.preventDefault(); fechar(true); }
      else if (k.length === 1) porLetra(k.toLowerCase());
    });

    sel.addEventListener('blur', function () {
      // deixa o clique numa opção acontecer antes de fechar
      setTimeout(function () {
        if (aberto && aberto.sel === sel && !aberto.pop.contains(document.activeElement)) fechar(false);
      }, 120);
    });

    // as ferramentas recriam opções (ex.: a lista de empresas depois da
    // planilha carregar): se a lista mudar com o painel aberto, refaz
    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (aberto && aberto.sel === sel) { fechar(false); abrir(sel); }
      }).observe(sel, { childList: true });
    }
  }

  function varrer() {
    Array.prototype.forEach.call(document.querySelectorAll('select'), preparar);
  }

  document.addEventListener('pointerdown', function (e) {
    if (!aberto) return;
    if (!aberto.pop.contains(e.target) && e.target !== aberto.sel) fechar(false);
  }, true);
  function reposicionar() { if (aberto) posicionar(aberto.sel, aberto.pop); }
  window.addEventListener('resize', reposicionar);
  window.addEventListener('scroll', reposicionar, true);
  // dentro de um iframe, quem rola é a página de fora: a lista acompanha
  try {
    if (window.parent && window.parent !== window) {
      window.parent.addEventListener('resize', reposicionar);
      window.parent.addEventListener('scroll', reposicionar, true);
    }
  } catch (_) {}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', varrer);
  else varrer();

  // seletores criados depois (a página monta partes da tela sob demanda)
  if (window.MutationObserver) {
    new MutationObserver(varrer).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
