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

  function posicionar(sel, pop) {
    var r = sel.getBoundingClientRect();
    var alturaJanela = window.innerHeight || document.documentElement.clientHeight;
    pop.style.minWidth = Math.round(r.width) + 'px';
    pop.style.left = '0px';
    pop.style.top = '0px';
    var p = pop.getBoundingClientRect();
    var largura = Math.max(p.width, r.width);
    var esquerda = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - largura - 8));
    var abaixo = alturaJanela - r.bottom - 8;
    var acima = r.top - 8;
    var paraCima = p.height > abaixo && acima > abaixo;
    pop.classList.toggle('neu-acima', paraCima);
    pop.style.maxHeight = Math.max(120, Math.round(paraCima ? acima : abaixo)) + 'px';
    pop.style.left = Math.round(esquerda) + 'px';
    pop.style.top = Math.round(paraCima ? Math.max(8, r.top - p.height - 6) : r.bottom + 6) + 'px';
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
  window.addEventListener('resize', function () { if (aberto) posicionar(aberto.sel, aberto.pop); });
  window.addEventListener('scroll', function () { if (aberto) posicionar(aberto.sel, aberto.pop); }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', varrer);
  else varrer();

  // seletores criados depois (a página monta partes da tela sob demanda)
  if (window.MutationObserver) {
    new MutationObserver(varrer).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
