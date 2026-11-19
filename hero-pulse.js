/* ==========================================================================
   Data Pulse (hero da página inicial)

   Efeito decorativo sobre o diagrama "System Flow" que já existe no hero.
   Faz duas coisas, e nada mais:

   1. Uma só vez, depois de o diagrama estar construído, um pulso percorre
      as ligações, acende os nós e chega ao painel (cerca de 3 s).
   2. Em dispositivos com rato, passar o cursor por cima de uma ligação
      dispara um pulso curto nessa ligação.

   Não há ciclos infinitos, nem mousemove, nem requestAnimationFrame: o JS só
   acrescenta e retira classes; o movimento é todo CSS (ver style.css, bloco
   "Data Pulse"). Com movimento reduzido, ou sem este ficheiro, o hero fica
   exatamente como estava.
   ========================================================================== */
(function () {
    'use strict';

    var sf = document.querySelector('.hero .sf');
    if (!sf) return;

    function matches(query) {
        return !!(window.matchMedia && window.matchMedia(query).matches);
    }

    if (matches('(prefers-reduced-motion: reduce)')) return;

    var NS = 'http://www.w3.org/2000/svg';
    var canHover = matches('(hover: hover) and (pointer: fine)');

    var START_AT = 6300;   /* ms desde o carregamento: o diagrama acaba de se construir aos ~6 s */
    var RUN_FOR = 3200;    /* duração da animação inicial */
    var STAGGER = 0.08;    /* s entre ligações no pulso inicial */
    var HOVER_GAP = 250;   /* ms mínimos entre dois pulsos de cursor */

    var ready = false;     /* o cursor só reage depois da animação inicial */
    var lastHover = 0;

    /* Para cada ligação cria uma cópia (o pulso) por cima dela e, se houver
       rato, uma área de deteção larga e invisível, porque a linha tem só 1,4 px. */
    function build(svg) {
        var wires = [].slice.call(svg.querySelectorAll('.sf-wire'));
        var chips = svg.querySelectorAll('.sf-chip');
        var rule = svg.querySelector('.sf-rule-box');

        wires.forEach(function (wire, i) {
            var isTrunk = wire.classList.contains('sf-trunk');
            var d = wire.getAttribute('d');

            var pulse = document.createElementNS(NS, 'path');
            pulse.setAttribute('d', d);
            pulse.setAttribute('pathLength', '1');
            pulse.setAttribute('class', 'sf-pulse');
            pulse.setAttribute('aria-hidden', 'true');
            pulse.style.setProperty('--dl', (isTrunk ? 1.35 : i * STAGGER) + 's');
            wire.parentNode.insertBefore(pulse, wire.nextSibling);

            pulse.addEventListener('animationend', function () {
                pulse.classList.remove('is-hover');
            });

            if (!canHover) return;

            var hit = document.createElementNS(NS, 'path');
            hit.setAttribute('d', d);
            hit.setAttribute('class', 'sf-hit');
            hit.setAttribute('aria-hidden', 'true');
            pulse.parentNode.insertBefore(hit, pulse.nextSibling);

            /* O nó relacionado: o chip da mesma posição, ou o círculo da regra no tronco */
            var node = isTrunk ? rule : chips[i];

            hit.addEventListener('pointerenter', function () {
                var now = Date.now();
                if (!ready || now - lastHover < HOVER_GAP) return;
                if (pulse.classList.contains('is-hover')) return;
                lastHover = now;

                pulse.classList.add('is-hover');
                if (node) {
                    node.classList.add('is-hover');
                    setTimeout(function () { node.classList.remove('is-hover'); }, 800);
                }
            });
        });
    }

    function run() {
        sf.classList.add('sf-run');
        setTimeout(function () {
            sf.classList.remove('sf-run');
            ready = true;
        }, RUN_FOR);
    }

    /* Só arranca quando o separador está visível e o diagrama está no ecrã,
       para quem chega ao hero já depois do tempo (separador em segundo plano,
       ou diagrama fora da vista em ecrãs pequenos) ver a animação completa. */
    function whenVisible() {
        if (document.hidden) {
            document.addEventListener('visibilitychange', function onShow() {
                if (document.hidden) return;
                document.removeEventListener('visibilitychange', onShow);
                whenVisible();
            });
            return;
        }

        if (!('IntersectionObserver' in window)) { run(); return; }

        var observer = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            run();
        }, { threshold: 0.35 });
        observer.observe(sf);
    }

    sf.querySelectorAll('.sf-svg').forEach(build);

    var elapsed = window.performance && performance.now ? performance.now() : 0;
    setTimeout(whenVisible, Math.max(0, START_AT - elapsed));
})();
