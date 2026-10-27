/* ==========================================================================
   Rede de pontos do hero ("ligamos os seus sistemas", em movimento)

   Um <canvas> com pontos que flutuam devagar. Quando dois pontos ficam
   perto, desenha-se uma linha entre eles; perto do cursor, as linhas
   acendem. Cuidados com desempenho e acessibilidade:
   - poucos pontos (proporcional à área, com limite) e sem bibliotecas
   - pára quando o hero sai do ecrã ou o separador fica em segundo plano
   - com "reduzir movimento" ativo, desenha uma imagem fixa
   - é decorativo (aria-hidden), por isso não afeta leitores de ecrã
   ========================================================================== */
(function () {
    'use strict';

    var canvas = document.querySelector('canvas.net');
    if (!canvas || !canvas.getContext) return;

    var hero = canvas.parentNode;
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var nodes = [];
    var width = 0;
    var height = 0;
    var linkDist = 140;
    var mouse = { x: -9999, y: -9999 };
    var frame = 0;
    var visible = true;

    function resize() {
        var rect = hero.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        /* Menos pontos em ecrãs pequenos: poupa bateria e fica mais limpo */
        linkDist = width < 600 ? 100 : 140;
        var count = Math.max(16, Math.min(70, Math.round((width * height) / 15000)));
        nodes = [];
        for (var i = 0; i < count; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.28,
                vy: (Math.random() - 0.5) * 0.28,
                r: 1.2 + Math.random() * 1.5
            });
        }
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < nodes.length; i++) {
            var a = nodes[i];

            /* Linhas entre pontos próximos: quanto mais perto, mais visível */
            for (var j = i + 1; j < nodes.length; j++) {
                var b = nodes[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if (d < linkDist) {
                    ctx.strokeStyle = 'rgba(139,131,245,' + ((1 - d / linkDist) * 0.55).toFixed(3) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }

            /* Linha até ao cursor, mais forte, para o hero reagir à pessoa */
            var mx = a.x - mouse.x;
            var my = a.y - mouse.y;
            var md = Math.sqrt(mx * mx + my * my);
            if (md < 170) {
                ctx.strokeStyle = 'rgba(201,206,242,' + ((1 - md / 170) * 0.6).toFixed(3) + ')';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(201,206,242,0.9)';
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function step() {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;
            /* Ao sair por um lado, o ponto volta a entrar pelo oposto */
            if (n.x < -10) n.x = width + 10;
            if (n.x > width + 10) n.x = -10;
            if (n.y < -10) n.y = height + 10;
            if (n.y > height + 10) n.y = -10;
        }
        draw();
        frame = window.requestAnimationFrame(step);
    }

    function start() {
        if (reduce || frame || !visible || document.hidden) return;
        frame = window.requestAnimationFrame(step);
    }

    function stop() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
    }

    hero.addEventListener('pointermove', function (event) {
        var rect = hero.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    hero.addEventListener('pointerleave', function () {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize, 150);
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible) start(); else stop();
        }).observe(hero);
    }

    resize();
    start();
})();
