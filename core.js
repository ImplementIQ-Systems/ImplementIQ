/* ==========================================================================
   ImplementIQ Systems: comportamento do site

   O JavaScript faz só cinco coisas, cada uma na sua função:
   1. Idioma PT/EN (os textos ficam no próprio HTML, em data-pt e data-en)
   2. Menu em ecrãs pequenos
   3. Linha no cabeçalho quando a página já foi deslizada
   4. Entrada dos blocos ao deslizar (classe "in")
   5. Ano atual no rodapé

   Tudo o resto (animação do diagrama, perguntas frequentes, scroll suave)
   é feito apenas com HTML, CSS e SVG, por isso o site continua legível
   mesmo que este ficheiro falhe a carregar.
   ========================================================================== */
(function () {
    'use strict';

    var STORAGE_KEY = 'lang';
    var lang = 'pt';

    var MENU_LABEL = {
        pt: { open: 'Abrir menu', close: 'Fechar menu' },
        en: { open: 'Open menu', close: 'Close menu' }
    };

    /* localStorage pode estar bloqueado (modo privado, por exemplo);
       por isso as leituras e escritas ficam protegidas com try/catch. */
    function readLang() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function saveLang(value) {
        try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignorar */ }
    }

    /* 1. Idioma ------------------------------------------------------------ */

    function applyLang(next) {
        lang = next;
        document.documentElement.lang = next === 'pt' ? 'pt-PT' : 'en';

        /* Cada elemento com data-pt tem também data-en. Trocamos o conteúdo.
           Os elementos do <head> (title e meta) têm tratamento próprio. */
        /* Etiquetas de acessibilidade (aria-label) com tradução própria */
        document.querySelectorAll('[data-aria-pt]').forEach(function (el) {
            el.setAttribute('aria-label', el.getAttribute('data-aria-' + next));
        });

        document.querySelectorAll('[data-pt]').forEach(function (el) {
            var value = el.getAttribute('data-' + next);
            if (value === null) return;

            if (el.parentNode === document.head) {
                if (el.localName === 'title') document.title = value;
                else el.setAttribute('content', value);
            } else {
                el.innerHTML = value;
            }
        });

        /* Textos de exemplo dentro dos campos do formulário */
        document.querySelectorAll('[data-placeholder-pt]').forEach(function (el) {
            el.setAttribute('placeholder', el.getAttribute('data-placeholder-' + next));
        });

        /* Ligações que mudam com o idioma (a mensagem pré-escrita do WhatsApp) */
        document.querySelectorAll('[data-href-pt]').forEach(function (el) {
            el.setAttribute('href', el.getAttribute('data-href-' + next));
        });

        var locale = document.querySelector('meta[property="og:locale"]');
        if (locale) locale.setAttribute('content', next === 'pt' ? 'pt_PT' : 'en_GB');

        var toggle = document.getElementById('langToggle');
        if (toggle) {
            toggle.textContent = next === 'pt' ? 'EN' : 'PT';
            toggle.setAttribute('aria-label', next === 'pt' ? 'Switch to English' : 'Mudar para português');
        }

        updateMenuLabel();
    }

    function setupLanguage() {
        var toggle = document.getElementById('langToggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                var next = lang === 'pt' ? 'en' : 'pt';
                applyLang(next);
                saveLang(next);
            });
        }

        /* O HTML já vem em português; só é preciso trocar se o visitante
           tinha escolhido inglês numa visita anterior. */
        if (readLang() === 'en') applyLang('en');
    }

    /* 2. Menu em ecrãs pequenos -------------------------------------------- */

    var menuButton = null;
    var menuLinks = null;

    function updateMenuLabel() {
        if (!menuButton) return;
        var isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-label', MENU_LABEL[lang][isOpen ? 'close' : 'open']);
    }

    function setMenu(open) {
        if (!menuButton || !menuLinks) return;
        menuLinks.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        updateMenuLabel();
    }

    function setupMenu() {
        menuButton = document.getElementById('menuBtn');
        menuLinks = document.getElementById('navLinks');
        if (!menuButton || !menuLinks) return;

        menuButton.addEventListener('click', function () {
            setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
        });

        /* Ao escolher uma ligação, o menu fecha */
        menuLinks.addEventListener('click', function (event) {
            if (event.target.closest('a')) setMenu(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') setMenu(false);
        });
    }

    /* 3. Cabeçalho --------------------------------------------------------- */

    function setupHeader() {
        var header = document.getElementById('siteHeader');
        if (!header) return;

        function update() {
            header.classList.toggle('scrolled', window.scrollY > 8);
        }

        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    /* 4. Entrada ao deslizar ------------------------------------------------ */

    /* Cada elemento com a classe "reveal" começa ligeiramente descido e
       transparente (ver style.css). Quando entra no ecrã, ganha a classe "in"
       e o CSS faz a transição. O observador deixa de o vigiar logo a seguir,
       por isso a animação acontece uma só vez. */
    function setupReveal() {
        var items = document.querySelectorAll('.reveal, .reveal-group');
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* Sem suporte ou com movimento reduzido: mostrar tudo de imediato */
        if (!('IntersectionObserver' in window) || reduce) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

        items.forEach(function (el) { observer.observe(el); });
    }

    /* 5. Ano no rodapé ----------------------------------------------------- */

    function setupYear() {
        document.querySelectorAll('.year').forEach(function (el) {
            el.textContent = new Date().getFullYear();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMenu();
        setupLanguage();
        setupHeader();
        setupReveal();
        setupYear();
    });
})();

/* ── PARTICLE NETWORK (page-hero .iq-net) ──────────────────────────────────
   Aglomerado compacto no lado direito do hero: os pontos vivem numa zona
   fixa (R) alinhada com a margem direita do conteúdo, e as bordas desvanecem
   (alfa por distância ao centro da zona), por isso não há "caixa" visível. */
(function () {
    var N = 36, MAX_DIST = 105, ZONE_W = 380, ZONE_H = 290;

    function initCanvas(c) {
        var ctx = c.getContext('2d');
        var pts = [], R = { x: 0, y: 0, w: 0, h: 0 };
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resize() {
            c.width  = c.parentElement.offsetWidth;
            c.height = c.parentElement.offsetHeight;
            /* margem direita do conteúdo (.wrap tem no máx. 1100px, centrado) */
            var right = Math.min(c.width - 16, c.width / 2 + 550);
            R.w = Math.min(ZONE_W, c.width * 0.45);
            R.h = Math.min(ZONE_H, c.height * 0.8);
            R.x = right - R.w;
            R.y = (c.height - R.h) / 2 + 8;
        }

        function init() {
            pts = [];
            for (var i = 0; i < N; i++) {
                pts.push({
                    x: R.x + Math.random() * R.w,
                    y: R.y + Math.random() * R.h,
                    vx: (Math.random() - 0.5) * 0.26,
                    vy: (Math.random() - 0.5) * 0.26
                });
            }
        }

        /* 1 no centro da zona, 0 na borda: serve para desvanecer */
        function fade(p) {
            var dx = (p.x - (R.x + R.w / 2)) / (R.w / 2);
            var dy = (p.y - (R.y + R.h / 2)) / (R.h / 2);
            return Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), 0.6);
        }

        function draw(move) {
            ctx.clearRect(0, 0, c.width, c.height);
            for (var i = 0; i < N; i++) {
                var p = pts[i];
                if (move) {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < R.x || p.x > R.x + R.w) p.vx *= -1;
                    if (p.y < R.y || p.y > R.y + R.h) p.vy *= -1;
                }
                var fp = fade(p);
                for (var j = i + 1; j < N; j++) {
                    var q = pts[j], dx = p.x - q.x, dy = p.y - q.y;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d < MAX_DIST) {
                        var a = (1 - d / MAX_DIST) * 1.1 * Math.min(fp, fade(q));
                        ctx.strokeStyle = 'rgba(155,148,255,' + Math.min(a, 0.9) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                    }
                }
                ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(185,180,255,' + Math.min(0.95, fp * 1.2) + ')'; ctx.fill();
            }
            if (move) requestAnimationFrame(function () { draw(true); });
        }

        resize(); init(); draw(!reduce);
        window.addEventListener('resize', function () { resize(); init(); if (reduce) draw(false); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.iq-net').forEach(initCanvas);
    });
})();
