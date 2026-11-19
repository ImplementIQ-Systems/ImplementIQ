/* ==========================================================================
   Data Pulse v2 (hero da página inicial)

   Causa → processamento → consequência, sobre o diagrama "System Flow":

     sistema (chip)  →  pulso pela ligação  →  REGRA processa
                     →  pulso REGRA → painel  →  PAINEL ÚNICO transforma-se

   O painel tem quatro vistas, já desenhadas no HTML (data-v):
     perf     desempenho (a vista original, a que fica em repouso)
     trend    tendência
     insight  KPI / insight
     cons     consolidação (várias fontes numa só)

   Regra origem → resultado: cada chip diz no HTML para onde vai (data-to).
   A mesma origem dá sempre o mesmo resultado. Várias origens diferentes
   juntas dão consolidação.

   Uma só vez, ao abrir a página, mostra duas combinações. Depois não há
   nada automático: só reage ao cursor (e só se houver rato). Sem loops,
   sem mousemove, sem requestAnimationFrame: o JS liga e desliga classes e
   o movimento é todo CSS. Com movimento reduzido nada corre e o painel
   fica na vista original.
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

    /* Tempos em ms. Para acelerar ou abrandar a coreografia, é aqui. */
    var START_AT = 1900;    /* desde o carregamento: o diagrama já está construído */
    var STAGGER = 200;      /* entre pulsos de origens diferentes na mesma combinação */
    var TRAVEL = 950;       /* origem → REGRA (tem de coincidir com --travel no CSS) */
    var TRUNK_GAP = 200;    /* o sinal sai da REGRA ainda durante o processamento */
    var TRUNK = 750;        /* REGRA → painel (tem de coincidir com o CSS) */
    var OUT = 320;          /* a vista antiga dissolve-se */
    var IN = 1000;          /* a nova vista constrói-se */
    var DEMO_GAP = 2300;    /* entre a primeira e a segunda combinação da demonstração */

    var busy = false;       /* uma sequência de cada vez; novos disparos são ignorados */
    var ready = false;      /* o cursor só reage depois da demonstração */

    function after(ms, fn) { return setTimeout(fn, ms); }

    function restart(el, cls) {
        el.classList.remove(cls);
        el.getBoundingClientRect();   /* força o recálculo para a animação recomeçar */
        el.classList.add(cls);
    }

    function isVisible(svg) { return svg.getClientRects().length > 0; }

    /* Prepara um diagrama (há um para desktop e outro para telemóvel) */
    function build(svg) {
        var ctx = {
            svg: svg,
            wires: [].slice.call(svg.querySelectorAll('.sf-wire')),
            chips: [].slice.call(svg.querySelectorAll('.sf-chip')),
            rule: svg.querySelector('.sf-rule'),
            glow: svg.querySelector('.sf-panel-glow'),
            views: {},
            current: null,
            pulses: [],
            trunk: null
        };

        [].forEach.call(svg.querySelectorAll('.sf-view'), function (v) {
            ctx.views[v.getAttribute('data-v')] = v;
            if (v.classList.contains('on')) ctx.current = v;
        });

        /* Um pulso por ligação, desenhado por cima dela */
        ctx.wires.forEach(function (wire, i) {
            var isTrunk = wire.classList.contains('sf-trunk');
            var d = wire.getAttribute('d');

            var pulse = document.createElementNS(NS, 'path');
            pulse.setAttribute('d', d);
            pulse.setAttribute('pathLength', '1');
            pulse.setAttribute('class', isTrunk ? 'sf-pulse is-trunk' : 'sf-pulse');
            pulse.setAttribute('aria-hidden', 'true');
            wire.parentNode.insertBefore(pulse, wire.nextSibling);
            pulse.addEventListener('animationend', function () { pulse.classList.remove('go'); });

            if (isTrunk) ctx.trunk = pulse; else ctx.pulses[i] = pulse;

            /* Com rato: uma área larga e invisível sobre cada ligação de origem,
               porque a linha tem só 1,4 px */
            if (canHover && !isTrunk) {
                var hit = document.createElementNS(NS, 'path');
                hit.setAttribute('d', d);
                hit.setAttribute('class', 'sf-hit');
                hit.setAttribute('aria-hidden', 'true');
                pulse.parentNode.insertBefore(hit, pulse.nextSibling);
                hit.addEventListener('pointerenter', function () { trigger(ctx, i); });
            }
        });

        if (canHover) {
            ctx.chips.forEach(function (chip, i) {
                chip.addEventListener('pointerenter', function () { trigger(ctx, i); });
            });
        }

        return ctx;
    }

    /* A regra origem → resultado vive no HTML (data-to em cada chip) */
    function resultFor(ctx, sources) {
        var first = ctx.chips[sources[0]].getAttribute('data-to');
        var same = sources.every(function (s) { return ctx.chips[s].getAttribute('data-to') === first; });
        return same ? first : 'cons';
    }

    function swapView(ctx, to) {
        var next = ctx.views[to];
        if (!next) return;
        if (ctx.current) ctx.current.classList.remove('on');
        after(OUT, function () {
            next.style.setProperty('--base', '0.05s');   /* nas transições entra logo */
            next.classList.add('on');
            ctx.current = next;
        });
    }

    /* Uma sequência completa. Devolve a duração total em ms. */
    function run(ctx, sources) {
        var result = resultFor(ctx, sources);
        var arrive = (sources.length - 1) * STAGGER + TRAVEL;   /* último sinal chega à REGRA */
        var land = arrive + TRUNK_GAP + TRUNK;                  /* sinal chega ao painel */

        sources.forEach(function (src, j) {
            after(j * STAGGER, function () {
                var chip = ctx.chips[src];
                chip.classList.add('is-lit');
                after(TRAVEL * 0.7, function () { chip.classList.remove('is-lit'); });
                if (ctx.pulses[src]) restart(ctx.pulses[src], 'go');
            });
        });

        after(arrive, function () {                 /* processamento (~340 ms) */
            restart(ctx.rule, 'is-proc');
            after(900, function () { ctx.rule.classList.remove('is-proc'); });
        });

        after(arrive + TRUNK_GAP, function () {     /* sinal emitido */
            if (ctx.trunk) restart(ctx.trunk, 'go');
        });

        after(land, function () {                   /* consequência */
            if (ctx.glow) restart(ctx.glow, 'go');
            swapView(ctx, result);
        });

        return land + OUT + IN;
    }

    function trigger(ctx, index) {
        if (!ready || busy) return;
        busy = true;
        after(run(ctx, [index]), function () { busy = false; });
    }

    /* Demonstração inicial: duas combinações, uma vez, e depois repouso */
    function demo() {
        var ctx = null;
        sf.querySelectorAll('.sf-svg').forEach(function (svg) {
            if (!ctx && isVisible(svg)) ctx = svg.__iq;
        });
        if (!ctx) { ready = true; return; }

        var last = ctx.chips.length - 1;
        var steps = ctx.chips.length > 4
            ? [{ at: 0, sources: [0, last] }, { at: DEMO_GAP, sources: [5] }]   /* consolidação, depois desempenho */
            : [{ at: 0, sources: [0, 1, 2, 3] }];                                /* telemóvel: versão curta */

        busy = true;
        var end = 0;
        steps.forEach(function (step) {
            after(step.at, function () { run(ctx, step.sources); });
            end = Math.max(end, step.at + (step.sources.length - 1) * STAGGER + TRAVEL + TRUNK_GAP + TRUNK + OUT + IN);
        });
        after(end, function () { busy = false; ready = true; });
    }

    /* Só arranca com o separador visível e o diagrama no ecrã */
    function whenVisible() {
        if (document.hidden) {
            document.addEventListener('visibilitychange', function onShow() {
                if (document.hidden) return;
                document.removeEventListener('visibilitychange', onShow);
                whenVisible();
            });
            return;
        }
        if (!('IntersectionObserver' in window)) { demo(); return; }

        var observer = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            demo();
        }, { threshold: 0.35 });
        observer.observe(sf);
    }

    sf.querySelectorAll('.sf-svg').forEach(function (svg) { svg.__iq = build(svg); });

    var elapsed = window.performance && performance.now ? performance.now() : 0;
    after(Math.max(0, START_AT - elapsed), whenVisible);
})();
