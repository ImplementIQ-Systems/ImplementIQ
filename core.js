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
