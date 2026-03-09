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
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
   3D PHOTO EFFECT — REMOVIDO
   Hover tratado apenas por CSS (sombra + translateY subtil)
========================= */
function setup3DPhotoEffect() {}

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
   INIT
========================= */
document.addEventListener('DOMContentLoaded', function () {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
        currentLang = savedLang;
        document.documentElement.lang = currentLang === 'pt' ? 'pt' : 'en';
    }

    updateContent();
    updateLanguageButton();
    updateCopyrightYear();
    setupMobileMenu();
    setupSmoothScroll();
    setupNavScroll();
    setupScrollAnimations();
    setupFAQ();
    setupParallax();
    setup3DPhotoEffect();

    const langButton = document.querySelector('.lang-toggle');
    if (langButton) {
        langButton.addEventListener('click', toggleLanguage);
    }
});
