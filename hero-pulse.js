/* ==========================================================================
   Data Pulse v2 (hero da página inicial)

   Causa → processamento → consequência, sobre o diagrama "System Flow":

     sistema (chip)  →  pulso pela ligação  →  REGRA processa
                     →  pulso REGRA → painel  →  PAINEL ÚNICO transforma-se

   Ritmo de uma interação (~4,9 s). Cada fase só começa quando a anterior
   termina; nada se sobrepõe:

     origem reage            200 ms
     origem → REGRA         1100 ms   o ponto viaja
     chegada à REGRA         250 ms   a borda acende
     processamento           500 ms   contrai, expande, emite o anel
     REGRA → painel         1000 ms   o ponto viaja
     chegada ao painel       200 ms   a borda do painel responde
     transformação          1300 ms   a vista antiga dissolve-se, a nova forma-se
     repouso                 400 ms   nada acontece; só então o lock é libertado

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

    /* Tempos em ms. Para acelerar ou abrandar a coreografia, é aqui:
       o JS passa estes valores ao CSS, por isso não há números a repetir. */
    var START_AT = 1200;     /* desde o carregamento: os sistemas já aparecem; as ligações acabam de se desenhar */
    var STAGGER = 150;       /* entre origens da mesma combinação (só na demonstração) */
    var ORIGIN = 200;        /* a origem reage antes de o pulso sair */
    var TRAVEL = 1100;       /* origem → REGRA */
    var ARRIVE = 250;        /* chegada à REGRA: reação, sem processar ainda */
    var PROCESS = 500;       /* REGRA processa; só depois envia o sinal */
    var TRUNK = 1000;        /* REGRA → painel */
    var PANEL_REACT = 200;   /* o sinal chegou: a borda responde antes de o painel mudar */
    var OUT = 450;           /* a vista antiga dissolve-se */
    var IN_AT = 300;         /* a nova começa a formar-se enquanto a antiga ainda se dissolve */
    var TRANSFORM = 1300;    /* da primeira mudança ao novo estado estável */
    var FINAL_GLOW_AT = 800; /* brilho suave quando o novo estado estabiliza */
    var REST = 400;          /* repouso antes de libertar o lock */

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
        after(IN_AT, function () {
            next.style.setProperty('--base', '0.05s');   /* nas transições entra logo */
            next.classList.add('on');
            ctx.current = next;
        });
    }

    /* Uma sequência completa. Devolve a duração total (incluindo repouso). */
    function run(ctx, sources) {
        var result = resultFor(ctx, sources);
        var lastDepart = (sources.length - 1) * STAGGER + ORIGIN;
        var arrive = lastDepart + TRAVEL;         /* o último pulso chega à REGRA */
        var process = arrive + ARRIVE;            /* a reação acabou: começa a processar */
        var send = process + PROCESS;             /* o processamento acabou: sai o sinal */
        var land = send + TRUNK;                  /* o sinal chega ao painel */
        var morph = land + PANEL_REACT;           /* a borda respondeu: o painel muda */
        var settle = morph + TRANSFORM;

        sources.forEach(function (src, j) {
            after(j * STAGGER, function () { ctx.chips[src].classList.add('is-lit'); });
            after(j * STAGGER + ORIGIN, function () {
                if (ctx.pulses[src]) restart(ctx.pulses[src], 'go');
            });
        });

        after(arrive, function () {
            sources.forEach(function (src) { ctx.chips[src].classList.remove('is-lit'); });
            ctx.rule.classList.add('is-arrive');
        });
        after(process, function () { restart(ctx.rule, 'is-proc'); });
        after(send, function () {
            ctx.rule.classList.remove('is-arrive', 'is-proc');
            if (ctx.trunk) restart(ctx.trunk, 'go');
        });
        after(land, function () {
            if (ctx.glow) { ctx.glow.classList.remove('soft'); restart(ctx.glow, 'go'); }
        });
        after(morph, function () { swapView(ctx, result); });
        after(morph + FINAL_GLOW_AT, function () {
            if (ctx.glow) { ctx.glow.classList.add('soft'); restart(ctx.glow, 'go'); }
        });

        return settle + REST;
    }

    function trigger(ctx, index) {
        if (!ready || busy) return;
        busy = true;
        after(run(ctx, [index]), function () { busy = false; });
    }

    /* Demonstração inicial: uma combinação, uma vez, e depois repouso.
       CRM e Email → insight (o resultado visualmente mais completo, para o
       hero ficar bem em repouso). É a mesma combinação no desktop e no
       telemóvel. Cabe em ~6 s desde o carregamento (a construção ocupa
       os primeiros ~2 s). */
    function demo() {
        var ctx = null;
        sf.querySelectorAll('.sf-svg').forEach(function (svg) {
            if (!ctx && isVisible(svg)) ctx = svg.__iq;
        });
        if (!ctx) { ready = true; return; }

        busy = true;
        after(run(ctx, [1, 2]), function () { busy = false; ready = true; });
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

    sf.style.setProperty('--t-travel', TRAVEL + 'ms');
    sf.style.setProperty('--t-process', PROCESS + 'ms');
    sf.style.setProperty('--t-trunk', TRUNK + 'ms');
    sf.style.setProperty('--t-out', OUT + 'ms');

    sf.querySelectorAll('.sf-svg').forEach(function (svg) { svg.__iq = build(svg); });

    var elapsed = window.performance && performance.now ? performance.now() : 0;
    after(Math.max(0, START_AT - elapsed), whenVisible);
})();
