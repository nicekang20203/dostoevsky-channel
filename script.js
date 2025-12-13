/**
 * Dostoevsky Blog - Interactive Features
 * 역사를 품은 문학 / Literature Embracing History
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Navigation.init();
    LanguageSwitcher.init();
    QuoteCarousel.init();
    ScrollAnimations.init();
    SmoothScroll.init();
    TimelineAnimations.init();
});

/**
 * Navigation Module
 * Handles mobile menu toggle and scroll state
 */
const Navigation = {
    init() {
        this.nav = document.querySelector('.main-nav');
        this.toggle = document.getElementById('navToggle');
        this.links = document.getElementById('navLinks');
        this.navLinks = document.querySelectorAll('.nav-links a');
        
        this.bindEvents();
        this.handleScroll();
    },

    bindEvents() {
        // Mobile menu toggle
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu when clicking a link
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.links && this.links.classList.contains('active')) {
                if (!this.links.contains(e.target) && !this.toggle.contains(e.target)) {
                    this.closeMenu();
                }
            }
        });

        // Handle scroll for nav background
        window.addEventListener('scroll', throttle(() => this.handleScroll(), 100));

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeMenu();
        });
    },

    toggleMenu() {
        this.toggle.classList.toggle('active');
        this.links.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        
        // Toggle hamburger animation
        const spans = this.toggle.querySelectorAll('span');
        if (this.links.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    },

    closeMenu() {
        this.toggle?.classList.remove('active');
        this.links?.classList.remove('active');
        document.body.classList.remove('menu-open');
        
        const spans = this.toggle?.querySelectorAll('span');
        if (spans) {
            spans.forEach(span => {
                span.style.transform = '';
                span.style.opacity = '';
            });
        }
    },

    handleScroll() {
        if (window.scrollY > 100) {
            this.nav?.classList.add('scrolled');
        } else {
            this.nav?.classList.remove('scrolled');
        }
    }
};

/**
 * Language Switcher Module
 * Toggles between English and Korean
 */
const LanguageSwitcher = {
    currentLang: 'en',

    init() {
        this.buttons = document.querySelectorAll('.lang-btn');
        this.translatableElements = document.querySelectorAll('[data-en][data-ko]');
        
        // Check for saved preference
        const savedLang = localStorage.getItem('dostoevsky-lang');
        if (savedLang) {
            this.currentLang = savedLang;
            this.updateLanguage();
        }

        this.bindEvents();
    },

    bindEvents() {
        this.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang && lang !== this.currentLang) {
                    this.setLanguage(lang);
                }
            });
        });
    },

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('dostoevsky-lang', lang);
        this.updateLanguage();
    },

    updateLanguage() {
        // Update button states
        this.buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });

        // Update all translatable elements
        this.translatableElements.forEach(el => {
            const text = el.dataset[this.currentLang];
            if (text) {
                // Check if element contains HTML (like <br> tags)
                if (text.includes('<')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang === 'ko' ? 'ko' : 'en';
        
        // Add body class for additional CSS hooks
        document.body.classList.remove('lang-en', 'lang-ko');
        document.body.classList.add(`lang-${this.currentLang}`);
    }
};

/**
 * Quote Carousel Module
 * Handles quote navigation with keyboard support
 */
const QuoteCarousel = {
    currentIndex: 0,
    autoPlayInterval: null,
    autoPlayDelay: 8000,

    init() {
        this.carousel = document.querySelector('.quotes-carousel');
        this.quotes = document.querySelectorAll('.quote-card');
        this.prevBtn = document.querySelector('.quote-nav-btn.prev');
        this.nextBtn = document.querySelector('.quote-nav-btn.next');
        this.dots = document.querySelectorAll('.quote-dot');

        if (!this.carousel || this.quotes.length === 0) return;

        this.bindEvents();
        this.showQuote(0);
        this.startAutoPlay();
    },

    bindEvents() {
        // Navigation buttons
        this.prevBtn?.addEventListener('click', () => {
            this.stopAutoPlay();
            this.prev();
            this.startAutoPlay();
        });

        this.nextBtn?.addEventListener('click', () => {
            this.stopAutoPlay();
            this.next();
            this.startAutoPlay();
        });

        // Dot navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.stopAutoPlay();
                this.goTo(index);
                this.startAutoPlay();
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isInViewport()) return;
            
            if (e.key === 'ArrowLeft') {
                this.stopAutoPlay();
                this.prev();
                this.startAutoPlay();
            } else if (e.key === 'ArrowRight') {
                this.stopAutoPlay();
                this.next();
                this.startAutoPlay();
            }
        });

        // Pause on hover
        this.carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.carousel.addEventListener('mouseleave', () => this.startAutoPlay());

        // Touch support
        let touchStartX = 0;
        let touchEndX = 0;

        this.carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            this.stopAutoPlay();
        }, { passive: true });

        this.carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
            this.startAutoPlay();
        }, { passive: true });
    },

    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    },

    showQuote(index) {
        this.quotes.forEach((quote, i) => {
            quote.classList.toggle('active', i === index);
            quote.setAttribute('aria-hidden', i !== index);
        });

        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
            dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });

        this.currentIndex = index;
    },

    next() {
        const nextIndex = (this.currentIndex + 1) % this.quotes.length;
        this.showQuote(nextIndex);
    },

    prev() {
        const prevIndex = (this.currentIndex - 1 + this.quotes.length) % this.quotes.length;
        this.showQuote(prevIndex);
    },

    goTo(index) {
        if (index >= 0 && index < this.quotes.length) {
            this.showQuote(index);
        }
    },

    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
    },

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    },

    isInViewport() {
        if (!this.carousel) return false;
        const rect = this.carousel.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }
};

/**
 * Timeline Animations Module
 * Reveals timeline items as they scroll into view
 */
const TimelineAnimations = {
    init() {
        this.timelineItems = document.querySelectorAll('.timeline-item');
        
        if (this.timelineItems.length === 0) return;
        
        this.observeTimeline();
    },

    observeTimeline() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px -100px 0px'
            });

            this.timelineItems.forEach(item => {
                observer.observe(item);
            });
        } else {
            // Fallback for older browsers
            this.timelineItems.forEach(item => item.classList.add('visible'));
        }
    }
};

/**
 * Scroll Animations Module
 * Reveals elements as they enter the viewport
 */
const ScrollAnimations = {
    init() {
        this.observeElements();
    },

    observeElements() {
        // Elements to animate on scroll
        const animatedElements = document.querySelectorAll(
            '.family-member, .context-card, .role-card, .anna-event, .work-card, .section-header, .anna-hero, .anna-roles, .family-quote, .anna-quote'
        );

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            animatedElements.forEach((el, index) => {
                el.classList.add('animate-prepare');
                // Add staggered delay for grid items
                if (el.classList.contains('context-card') || 
                    el.classList.contains('role-card') || 
                    el.classList.contains('anna-event') ||
                    el.classList.contains('family-member')) {
                    el.style.transitionDelay = `${index * 0.1}s`;
                }
                observer.observe(el);
            });
        } else {
            // Fallback for older browsers
            animatedElements.forEach(el => el.classList.add('animate-in'));
        }
    }
};

/**
 * Smooth Scroll Module
 * Handles anchor link scrolling
 */
const SmoothScroll = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    this.scrollTo(target);
                }
            });
        });
    },

    scrollTo(element) {
        const navHeight = document.querySelector('.main-nav')?.offsetHeight || 0;
        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - navHeight - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Add CSS for scroll animations
 */
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .animate-prepare {
        opacity: 0;
        transform: translateY(30px);
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .timeline-item {
        opacity: 0;
        transform: translateX(-30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .timeline-item.visible {
        opacity: 1;
        transform: translateX(0);
    }
    
    body.menu-open {
        overflow: hidden;
    }
    
    .main-nav.scrolled {
        background: rgba(13, 11, 14, 0.98);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
    }
    
    /* Stagger animations for grids */
    .family-member.animate-prepare,
    .context-card.animate-prepare,
    .role-card.animate-prepare,
    .anna-event.animate-prepare {
        opacity: 0;
        transform: translateY(40px);
    }
    
    .family-member.animate-in,
    .context-card.animate-in,
    .role-card.animate-in,
    .anna-event.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Work cards hover enhancement */
    .work-card .work-desc {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        transition: all 0.3s ease;
    }
    
    .work-card.featured .work-desc {
        -webkit-line-clamp: unset;
    }
    
    .work-card:hover .work-desc {
        -webkit-line-clamp: unset;
    }
    
    /* Quote card transitions */
    .quote-card {
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .quote-card.active {
        transition-delay: 0.1s;
    }
`;
document.head.appendChild(styleSheet);

/**
 * Parallax effect for hero section (optional, performance-conscious)
 */
const ParallaxHero = {
    init() {
        this.hero = document.querySelector('.hero');
        if (!this.hero) return;
        
        // Only enable on desktop for performance
        if (window.innerWidth > 1024) {
            window.addEventListener('scroll', throttle(() => this.handleScroll(), 16));
        }
    },

    handleScroll() {
        const scrolled = window.pageYOffset;
        const heroHeight = this.hero.offsetHeight;
        
        if (scrolled < heroHeight) {
            const heroContent = this.hero.querySelector('.hero-content');
            if (heroContent) {
                heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrolled / heroHeight) * 0.5;
            }
        }
    }
};

// Initialize parallax if desired (commented out by default for performance)
// document.addEventListener('DOMContentLoaded', () => ParallaxHero.init());
