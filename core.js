let currentLang = 'pt';

/* =========================
   LANGUAGE SYSTEM
========================= */
function toggleLanguage() {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    updateContent();
    updateLanguageButton();
    localStorage.setItem('lang', currentLang);
    document.documentElement.lang = currentLang === 'pt' ? 'pt' : 'en';
}

function updateContent() {
    document.querySelectorAll('[data-pt]').forEach(element => {
        const translation = element.getAttribute(`data-${currentLang}`);
        if (translation) {
            element.innerHTML = translation;
        }
    });
}

function updateLanguageButton() {
    const langButton = document.querySelector('.lang-toggle');
    if (langButton) {
        langButton.textContent = currentLang === 'pt' ? 'EN' : 'PT';
        langButton.classList.toggle('active', currentLang === 'en');
        langButton.setAttribute('aria-label',
            currentLang === 'pt' ? 'Switch to English' : 'Mudar para Português'
        );
    }
}

/* =========================
   DYNAMIC COPYRIGHT YEAR
========================= */
function updateCopyrightYear() {
    const yearEl = document.querySelector('.copyright-year');
    if (yearEl) {
        yearEl.textContent = `\u00A9 ${new Date().getFullYear()}`;
    }
}

/* =========================
   MOBILE MENU
========================= */
function setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('navMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        btn.setAttribute('aria-label',
            isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'
        );
    });

    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('open');
        });
    });
}

/* =========================
   SMOOTH SCROLL
========================= */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* =========================
   NAV SCROLL EFFECT
========================= */
function setupNavScroll() {
    const nav = document.querySelector('.navigation');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
}

/* =========================
   ANIMATION ON SCROLL
========================= */
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

/* =========================
   FAQ ACCORDION
========================= */
function setupFAQ() {
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const isActive = faqItem.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
            });

            if (!isActive) {
                faqItem.classList.add('active');
                button.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/* =========================
   PARALLAX (DESKTOP ONLY)
========================= */
function setupParallax() {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 1024) return;
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.25;

            ['.hero', '.process-section', '.cta-section'].forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.backgroundPositionY = `${rate}px`;
                }
            });
            ticking = false;
        });
    }, { passive: true });
}

/* =========================
   COOKIE CONSENT (RGPD)
========================= */
function setupCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('cookieAccept');
    const rejectBtn = document.getElementById('cookieReject');
    if (!banner) return;

    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
        setTimeout(() => { banner.style.display = 'block'; }, 800);
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookie_consent', 'all');
        banner.style.display = 'none';
    });

    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('cookie_consent', 'essential');
        banner.style.display = 'none';
    });
}

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', function () {
    // Restore saved language
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
        currentLang = savedLang;
        document.documentElement.lang = currentLang === 'pt' ? 'pt' : 'en';
    }

    // Populate content from data attributes
    updateContent();
    updateLanguageButton();
    updateCopyrightYear();

    // Setup interactions
    setupMobileMenu();
    setupSmoothScroll();
    setupNavScroll();
    setupScrollAnimations();
    setupFAQ();
    setupParallax();
    setupCookieBanner();

    // Language toggle
    const langButton = document.querySelector('.lang-toggle');
    if (langButton) {
        langButton.addEventListener('click', toggleLanguage);
    }
});
