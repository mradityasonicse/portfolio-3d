/* ==========================================================================
   Premium Portfolio — Sheryians-Style Scripting
   Features: Page Loader · Blob Cursor · Char Split · Marquee · GSAP · Canvas
   ========================================================================== */

// Web3Forms access key config to route notifications to Gmail
const WEB3FORMS_KEY = ""; 

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
});

/* ==========================================================================
   1. PAGE LOADER
   ========================================================================== */
function initLoader() {
    const loader = document.getElementById('page-loader');
    const bar = document.getElementById('loader-bar');
    const count = document.getElementById('loader-count');
    const brandSpans = document.querySelectorAll('.loader-brand span');

    if (!loader) {
        initAll();
        return;
    }

    // Animate brand letters in
    let delay = 0;
    brandSpans.forEach((span) => {
        setTimeout(() => {
            span.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
            span.style.transform = 'translateY(0%)';
        }, delay);
        delay += 80;
    });

    // Progress counter
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 18;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            setTimeout(() => {
                // Slide loader up
                loader.style.transition = 'transform 0.9s cubic-bezier(0.76,0,0.24,1), opacity 0.6s ease';
                loader.style.transform = 'translateY(-100%)';
                loader.style.opacity = '0';

                setTimeout(() => {
                    loader.style.display = 'none';
                    initAll();
                }, 900);
            }, 300);
        }

        bar.style.width = `${progress}%`;
        count.textContent = `${Math.floor(progress)}%`;
    }, 60);
}

/* ==========================================================================
   2. INIT ALL (called after loader)
   ========================================================================== */
function initAll() {
    const isIndexPage = !!document.getElementById('timeline-progress-bar');

    // Blob cursor disabled as requested
    if (!isIndexPage) {
        initMobileNav();
        initHeroCanvas();
    }
    initScrollHeader();

    // Fetch settings and render content dynamic elements first
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.settings) {
                applyDynamicTheme(data.settings);
                applySectionOrder(data.settings.layout_sections_order);
                applyDynamicContent(data.settings);
            }
            if (data.projects) {
                renderProjects(data.projects);
            }
            if (data.education) {
                renderEducation(data.education);
            }
            if (data.experience) {
                renderExperience(data.experience);
            }

            // Re-run dependencies that require populated DOM
            initProjectPreviews();
            
            if (!isIndexPage) {
                initFormTabs();
                initContactForm();
                initBookingForm();
            }
            
            initCharSplit();
            
            if (!isIndexPage) {
                initCards3DTilt();
            }

            // Wait for GSAP after DOM has been dynamically updated and layouts are clean
            waitForGSAP(() => {
                initGSAPAnimations();
            });
        })
        .catch(err => {
            console.error('Failed to load portfolio settings, falling back to static markup:', err);

            initProjectPreviews();
            
            if (!isIndexPage) {
                initFormTabs();
                initContactForm();
                initBookingForm();
            }
            
            initCharSplit();
            
            if (!isIndexPage) {
                initCards3DTilt();
            }

            waitForGSAP(() => {
                initGSAPAnimations();
            });
        });
}

function waitForGSAP(cb, attempts = 0) {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        cb();
    } else if (attempts < 30) {
        setTimeout(() => waitForGSAP(cb, attempts + 1), 100);
    } else {
        initFallbackAnimations();
    }
}

/* ==========================================================================
   3. BLOB CURSOR
   ========================================================================== */
function initBlobCursor() {
    const blob = document.getElementById('blob');
    if (!blob) return;

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let pos = { x: mouse.x, y: mouse.y };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', () => blob.classList.add('clicking'));
    window.addEventListener('mouseup', () => blob.classList.remove('clicking'));

    // Smooth blob follow
    function animateBlob() {
        const lag = 0.08;
        pos.x += (mouse.x - pos.x) * lag;
        pos.y += (mouse.y - pos.y) * lag;
        blob.style.left = `${pos.x}px`;
        blob.style.top = `${pos.y}px`;
        requestAnimationFrame(animateBlob);
    }
    animateBlob();

    // Hover classes
    document.querySelectorAll('a, button, .project-row, .testimonial-card, .skill-tag, .nav-item').forEach(el => {
        el.addEventListener('mouseenter', () => blob.classList.add('hovering'));
        el.addEventListener('mouseleave', () => blob.classList.remove('hovering'));
    });

    document.addEventListener('mouseleave', () => { blob.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { blob.style.opacity = '1'; });
}

/* ==========================================================================
   4. HERO CANVAS — Particle Network
   ========================================================================== */
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const N = W < 768 ? 35 : 70;
    const DIST = 130;
    let mouse = { x: null, y: null, r: 150 };

    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
    window.addEventListener('resize', () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        spawnParticles();
    });

    class Dot {
        constructor() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.r = Math.random() * 1.2 + 0.6;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(217,20,20,0.55)';
            ctx.fill();
        }

        update() {
            if (this.x < 0 || this.x > W) this.vx *= -1;
            if (this.y < 0 || this.y > H) this.vy *= -1;
            this.x += this.vx;
            this.y += this.vy;

            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const d = Math.hypot(dx, dy);
                if (d < mouse.r) {
                    const f = (mouse.r - d) / mouse.r;
                    this.x += (dx / d) * f * 1.2;
                    this.y += (dy / d) * f * 1.2;
                }
            }
        }
    }

    let dots = [];
    function spawnParticles() {
        dots = Array.from({ length: N }, () => new Dot());
    }

    function connect() {
        for (let i = 0; i < dots.length; i++) {
            for (let j = i; j < dots.length; j++) {
                const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
                if (d < DIST) {
                    const alpha = (1 - d / DIST) * 0.15;
                    ctx.strokeStyle = `rgba(217,20,20,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);

        // Subtle grid
        ctx.beginPath();
        for (let x = 0; x < W; x += 65) {
            for (let y = 0; y < H; y += 65) {
                ctx.rect(x, y, 1, 1);
            }
        }
        ctx.fillStyle = 'rgba(17,17,17,0.05)';
        ctx.fill();

        dots.forEach(d => { d.update(); d.draw(); });
        connect();
        requestAnimationFrame(frame);
    }

    spawnParticles();
    frame();
}

/* ==========================================================================
   5. MOBILE NAV
   ========================================================================== */
function initMobileNav() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('mobile-nav');
    const header = document.getElementById('main-header');
    const links = document.querySelectorAll('.mobile-nav-item');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('active');
        header.classList.toggle('menu-active');
        document.body.style.overflow = open ? 'hidden' : '';
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            header.classList.remove('menu-active');
            document.body.style.overflow = '';
        });
    });
}

/* ==========================================================================
   6. SCROLL HEADER
   ========================================================================== */
function initScrollHeader() {
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
    });
}

/* ==========================================================================
   7. CHARACTER SPLIT ANIMATION
   ========================================================================== */
function initCharSplit() {
    const headline = document.querySelector('.hero-headline');
    if (!headline) return;

    const splitCharsEls = headline.querySelectorAll('.split-chars');

    splitCharsEls.forEach(el => {
        const text = el.textContent;
        el.innerHTML = '';
        el.setAttribute('aria-label', text);

        [...text].forEach(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00a0' : char;
            span.setAttribute('aria-hidden', 'true');
            el.appendChild(span);
        });
    });
}

/* ==========================================================================
   8. PROJECT ROW PREVIEWS
   ========================================================================== */
function initProjectPreviews() {
    const preview = document.getElementById('project-preview');
    const previewInner = document.getElementById('preview-inner');
    if (!preview) return;

    const rows = document.querySelectorAll('.project-row');
    let rafId;

    let mouse = { x: 0, y: 0 };
    let previewPos = { x: 0, y: 0 };

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function followMouse() {
        previewPos.x += (mouse.x - previewPos.x) * 0.12;
        previewPos.y += (mouse.y - previewPos.y) * 0.12;
        preview.style.left = `${previewPos.x}px`;
        preview.style.top = `${previewPos.y}px`;
        preview.style.transform = `translate(-50%, calc(-100% - 20px))`;
        rafId = requestAnimationFrame(followMouse);
    }

    rows.forEach(row => {
        const name = row.getAttribute('data-preview') || '';
        const color = row.getAttribute('data-color') || '#111';

        row.addEventListener('mouseenter', () => {
            previewInner.textContent = name;
            previewInner.style.background = color;
            preview.classList.add('active');
            followMouse();
        });

        row.addEventListener('mouseleave', () => {
            preview.classList.remove('active');
            cancelAnimationFrame(rafId);
        });
    });
}

/* ==========================================================================
   9. GSAP ANIMATIONS
   ========================================================================== */
function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // ---- Hero ----
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    let hasHeroAnimations = false;

    // Animate chars
    if (document.querySelector('.char')) {
        heroTl.to('.char', {
            y: '0%',
            rotate: 0,
            duration: 1.2,
            stagger: 0.03,
            ease: 'power4.out'
        }, 0.1);
        hasHeroAnimations = true;
    }
    if (document.getElementById('hero-badge')) {
        heroTl.fromTo('#hero-badge', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0);
        hasHeroAnimations = true;
    }
    if (document.getElementById('hero-subtitle')) {
        heroTl.fromTo('#hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.5);
        hasHeroAnimations = true;
    }
    if (document.getElementById('hero-actions')) {
        heroTl.fromTo('#hero-actions', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.65);
        hasHeroAnimations = true;
    }
    if (document.querySelector('.header') && hasHeroAnimations) {
        heroTl.fromTo('.header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1 }, 0);
    }
    if (document.querySelector('.scroll-indicator')) {
        heroTl.fromTo('.scroll-indicator', { opacity: 0 }, { opacity: 1, duration: 1 }, 1);
    }

    // ---- Section titles ----
    document.querySelectorAll('.section-title').forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, y: 50, skewY: 3 },
            {
                opacity: 1, y: 0, skewY: 0,
                duration: 1.2, ease: 'power4.out',
                scrollTrigger: { trigger: el, start: 'top 88%' }
            }
        );
    });

    // ---- Section labels ----
    document.querySelectorAll('.section-label').forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, x: -20 },
            {
                opacity: 1, x: 0,
                duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%' }
            }
        );
    });

    // ---- About ----
    if (document.querySelector('.about-lead')) {
        gsap.fromTo('.about-lead', { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: '.about-lead', start: 'top 85%' }
        });
    }
    if (document.querySelector('.about-text')) {
        gsap.fromTo('.about-text', { opacity: 0, y: 30 }, {
            opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: '.about-left', start: 'top 80%' }
        });
    }
    if (document.querySelector('.skills-card')) {
        gsap.fromTo('.skills-card', { opacity: 0, y: 50, scale: 0.97 }, {
            opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power4.out',
            scrollTrigger: { trigger: '.about-right', start: 'top 80%' }
        });
    }
    if (document.querySelector('.skill-tags')) {
        gsap.fromTo('.skill-tag', { opacity: 0, scale: 0.85 }, {
            opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(2)',
            scrollTrigger: { trigger: '.skill-tags', start: 'top 85%' }
        });
    }

    // ---- Project rows ----
    if (document.querySelector('.project-list') && document.querySelector('.project-row')) {
        document.querySelectorAll('.project-row').forEach((row, i) => {
            gsap.fromTo(row,
                { opacity: 0, x: -40 },
                {
                    opacity: 1, x: 0,
                    duration: 0.8, ease: 'power3.out',
                    delay: i * 0.08,
                    scrollTrigger: { trigger: '.project-list', start: 'top 85%' }
                }
            );
        });
    }

    // ---- Timeline fill ----
    const fill = document.getElementById('timeline-fill');
    if (fill) {
        gsap.fromTo(fill, { height: '0%' }, {
            height: '100%',
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.timeline',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }

    // ---- Timeline items ----
    document.querySelectorAll('.timeline-item').forEach(item => {
        gsap.fromTo(item,
            { opacity: 0, x: 50 },
            {
                opacity: 1, x: 0,
                duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: item, start: 'top 85%' }
            }
        );
    });

    // ---- Testimonials ----
    if (document.querySelector('.testimonials-grid')) {
        gsap.fromTo('.testimonial-card', { opacity: 0, y: 50 }, {
            opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
            scrollTrigger: { trigger: '.testimonials-grid', start: 'top 85%' }
        });
    }

    // ---- Contact ----
    if (document.querySelector('.contact-big-text')) {
        gsap.fromTo('.contact-big-text', { opacity: 0, y: 60 }, {
            opacity: 1, y: 0, duration: 1.2, ease: 'power4.out',
            scrollTrigger: { trigger: '.contact-big-text', start: 'top 85%' }
        });
    }
    if (document.querySelector('.contact-grid')) {
        gsap.fromTo('.contact-left > *', { opacity: 0, y: 30 }, {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' }
        });
        gsap.fromTo('.contact-form-box', { opacity: 0, y: 50 }, {
            opacity: 1, y: 0, duration: 1.2, ease: 'power4.out',
            scrollTrigger: { trigger: '.contact-grid', start: 'top 75%' }
        });
    }

    // ---- Parallax on hero headline ----
    if (document.getElementById('hero-headline') && document.getElementById('hero')) {
        gsap.to('#hero-headline', {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    // ---- Footer socials ----
    if (document.querySelector('.footer')) {
        gsap.fromTo('.social-link', { opacity: 0, y: 10 }, {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: '.footer', start: 'top 92%' }
        });
    }

    // ---- Homepage-specific ScrollTriggers ----
    const isIndexPage = !!document.getElementById('timeline-progress-bar');
    if (isIndexPage) {
        // 3D perspective tilt for timeline elements on scroll
        document.querySelectorAll(".timeline-element").forEach((element, idx) => {
            const isEven = idx % 2 === 0;
            const glassCard = element.querySelector(".glass-card");
            if (glassCard) {
                gsap.from(glassCard, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top 80%",
                        end: "top 50%",
                        scrub: 1
                    },
                    transform: `perspective(800px) rotateY(${isEven ? 25 : -25}deg) translate3d(${isEven ? 50 : -50}px, 0, 0)`,
                    opacity: 0,
                    duration: 1.5,
                    ease: "power2.out"
                });
            }
        });

        // Skills glow scroll triggers
        if (document.querySelector(".paper-overlay")) {
            gsap.from(".paper-overlay", {
                scrollTrigger: {
                    trigger: "#skills",
                    start: "top 75%",
                    end: "top 45%",
                    scrub: 1
                },
                scale: 0.95,
                opacity: 0.8,
                duration: 1.2,
                ease: "power1.out"
            });
        }
    }

    // ---- Profile Card 3D Parallax & Magnetic ----
    initProfileCard3D();

    // ---- Magnetic Navigation Links ----
    initMagneticLinks();
}

/* ==========================================================================
   10. FALLBACK ANIMATIONS (no GSAP)
   ========================================================================== */
function initFallbackAnimations() {
    // Show chars immediately
    document.querySelectorAll('.char').forEach(c => {
        c.style.transform = 'translateY(0) rotate(0deg)';
    });

    // Simple intersection observer
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('revealed');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-up, .section-title, .about-lead, .testimonial-card, .project-row, .timeline-item').forEach(el => {
        el.classList.add('reveal-up');
        observer.observe(el);
    });

    // Show header
    const header = document.querySelector('.header');
    if (header) header.style.opacity = '1';
}

/* ==========================================================================
   11. CONTACT FORM & CALL BOOKINGS & EMAIL ROUTING
   ========================================================================== */
function initFormTabs() {
    const tabMsg = document.getElementById('tab-btn-message');
    const tabBook = document.getElementById('tab-btn-booking');
    const formMsg = document.getElementById('contact-form');
    const formBook = document.getElementById('booking-form');

    if (!tabMsg || !tabBook || !formMsg || !formBook) return;

    tabMsg.addEventListener('click', () => {
        if (tabMsg.classList.contains('active')) return;
        tabMsg.classList.add('active');
        tabBook.classList.remove('active');

        // GSAP transition
        gsap.killTweensOf([formMsg, formBook]);
        gsap.to(formBook, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            onComplete: () => {
                formBook.style.display = 'none';
                formMsg.style.display = 'flex';
                gsap.fromTo(formMsg, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
            }
        });
    });

    tabBook.addEventListener('click', () => {
        if (tabBook.classList.contains('active')) return;
        tabBook.classList.add('active');
        tabMsg.classList.remove('active');

        // GSAP transition
        gsap.killTweensOf([formMsg, formBook]);
        gsap.to(formMsg, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            onComplete: () => {
                formMsg.style.display = 'none';
                formBook.style.display = 'flex';
                gsap.fromTo(formBook, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
            }
        });
    });
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    const submitBtn = document.getElementById('form-submit-btn');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Check if already sending
        if (submitBtn.classList.contains('sending')) return;

        // Visual feedback
        submitBtn.disabled = true;
        submitBtn.classList.add('sending');
        const span = submitBtn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'TRANSMITTING...';

        // Add spinner
        const spinner = document.createElement('span');
        spinner.className = 'btn-spinner';
        submitBtn.appendChild(spinner);

        // Hide old status
        status.style.display = 'none';
        status.className = 'form-status';
        status.textContent = '';

        // Gather form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };

        console.log('Sending contact form data:', formData);

        // Post request to SQL backend
        fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Server error'); });
            }
            return response.json();
        })
        .then(data => {
            // Send Gmail notification via Web3Forms in parallel if key is set
            if (WEB3FORMS_KEY) {
                const emailData = {
                    access_key: WEB3FORMS_KEY,
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    subject: `💬 New Portfolio Message from ${formData.name}`,
                    from_name: "Aditya Soni Portfolio Alert",
                    replyto: formData.email
                };
                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                })
                .then(res => res.json())
                .then(resData => console.log('Web3Forms: Notification successfully routed to Gmail.'))
                .catch(err => console.warn('Web3Forms: Notification failed:', err));
            }

            // Success animation
            submitBtn.classList.remove('sending');
            if (spinner) spinner.remove();
            submitBtn.classList.add('success');
            span.textContent = 'TRANSMITTED ✓';

            status.className = 'form-status success';
            status.textContent = data.message || '✓ Message stored successfully in SQL database.';
            
            // GSAP pulse on form status
            gsap.fromTo(status, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });

            form.reset();

            // Reset button and status after delay
            setTimeout(() => {
                gsap.to(status, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        status.style.display = 'none';
                        status.className = 'form-status';
                        status.textContent = '';
                    }
                });

                submitBtn.disabled = false;
                submitBtn.classList.remove('success');
                span.textContent = originalText;
            }, 5000);
        })
        .catch(err => {
            console.error('Submission error:', err);

            // Error animation
            submitBtn.classList.remove('sending');
            if (spinner) spinner.remove();
            submitBtn.classList.add('error');
            span.textContent = 'TRANSMIT FAILED ✗';

            status.className = 'form-status error';
            status.textContent = 'Error: ' + err.message + ' (Please check if the backend SQL server is running)';

            // GSAP shake effect on form card for premium feel
            gsap.fromTo(status, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            gsap.to('.contact-form-box', {
                x: 10,
                repeat: 5,
                yoyo: true,
                duration: 0.05,
                onComplete: () => {
                    gsap.set('.contact-form-box', { x: 0 });
                }
            });

            // Reset button and status after delay
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('error');
                span.textContent = originalText;
            }, 4000);
        });
    });
}

function initBookingForm() {
    const form = document.getElementById('booking-form');
    const status = document.getElementById('booking-status');
    const submitBtn = document.getElementById('booking-submit-btn');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (submitBtn.classList.contains('sending')) return;

        submitBtn.disabled = true;
        submitBtn.classList.add('sending');
        const span = submitBtn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'BOOKING SESSION...';

        const spinner = document.createElement('span');
        spinner.className = 'btn-spinner';
        submitBtn.appendChild(spinner);

        status.style.display = 'none';
        status.className = 'form-status';
        status.textContent = '';

        const formData = {
            name: document.getElementById('booking-name').value,
            email: document.getElementById('booking-email').value,
            booking_date: document.getElementById('booking-date').value,
            booking_time: document.getElementById('booking-time').value,
            topic: document.getElementById('booking-topic').value
        };

        // Post request to SQL backend
        fetch('/api/booking-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Server error'); });
            }
            return response.json();
        })
        .then(data => {
            // Send Gmail booking alert via Web3Forms
            if (WEB3FORMS_KEY) {
                const emailMsg = `Hello Aditya,\n\nA new consultation session has been scheduled:\n\nClient: ${formData.name}\nEmail: ${formData.email}\nDate: ${formData.booking_date}\nTime: ${formData.booking_time}\nTopic: ${formData.topic}\n\nYou can click 'Reply' directly to write back to the client at ${formData.email}.`;
                
                const emailData = {
                    access_key: WEB3FORMS_KEY,
                    name: formData.name,
                    email: formData.email,
                    message: emailMsg,
                    subject: `📅 New Call Booking Scheduled: ${formData.name}`,
                    from_name: "Aditya Soni Portfolio Booking",
                    replyto: formData.email
                };
                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                })
                .then(res => res.json())
                .then(resData => console.log('Web3Forms: Booking notification sent to Gmail.'))
                .catch(err => console.warn('Web3Forms: Booking email error:', err));
            }

            // Success feedback
            submitBtn.classList.remove('sending');
            if (spinner) spinner.remove();
            submitBtn.classList.add('success');
            span.textContent = 'SESSION BOOKED ✓';

            status.className = 'form-status success';
            status.textContent = data.message || '✓ Booking recorded successfully in SQL database.';
            
            gsap.fromTo(status, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            form.reset();

            setTimeout(() => {
                gsap.to(status, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        status.style.display = 'none';
                        status.className = 'form-status';
                        status.textContent = '';
                    }
                });

                submitBtn.disabled = false;
                submitBtn.classList.remove('success');
                span.textContent = originalText;
            }, 5000);
        })
        .catch(err => {
            console.error('Booking error:', err);

            submitBtn.classList.remove('sending');
            if (spinner) spinner.remove();
            submitBtn.classList.add('error');
            span.textContent = 'BOOKING FAILED ✗';

            status.className = 'form-status error';
            status.textContent = 'Error: ' + err.message + ' (Please check if the backend SQL server is running)';

            gsap.fromTo(status, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
            gsap.to('.contact-form-box', {
                x: 10, repeat: 5, yoyo: true, duration: 0.05,
                onComplete: () => gsap.set('.contact-form-box', { x: 0 })
            });

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.classList.remove('error');
                span.textContent = originalText;
            }, 4000);
        });
    });
}

function initMagneticLinks() {
    const items = document.querySelectorAll('.nav-item, .logo-link, .social-link');
    items.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);

            gsap.to(el, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'power3.out'
            });
        });
    });
}

/* ==========================================================================
   12. PROFILE CARD 3D PARALLAX & MAGNETIC EFFECT
   ========================================================================== */
function initProfileCard3D() {
    const card = document.getElementById('portrait-3d-card');
    if (card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const tiltX = (y / (rect.height / 2)) * -12;
            const tiltY = (x / (rect.width / 2)) * 12;
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        });
        return;
    }

    const legacyCard = document.getElementById('profile-card-3d');
    if (!legacyCard) return;
    const inner = legacyCard.querySelector('.profile-card-inner');
    const glow = legacyCard.querySelector('.profile-glow');
    if (!inner) return;

    legacyCard.addEventListener('mousemove', (e) => {
        const rect = legacyCard.getBoundingClientRect();
        const x = e.clientX - rect.left - (rect.width / 2);
        const y = e.clientY - rect.top - (rect.height / 2);
        const tiltX = (y / (rect.height / 2)) * -12;
        const tiltY = (x / (rect.width / 2)) * 12;

        gsap.to(inner, {
            rotateX: tiltX,
            rotateY: tiltY,
            transformPerspective: 800,
            x: x * 0.05,
            y: y * 0.05,
            duration: 0.35,
            ease: 'power2.out'
        });

        if (glow) {
            gsap.to(glow, {
                x: x * 0.15,
                y: y * 0.15,
                duration: 0.35,
                ease: 'power2.out'
            });
        }
    });

    legacyCard.addEventListener('mouseleave', () => {
        gsap.to([inner, glow].filter(Boolean), {
            rotateX: 0,
            rotateY: 0,
            x: 0,
            y: 0,
            duration: 0.7,
            ease: 'power3.out'
        });
    });
}

/* ==========================================================================
   13. CARD 3D TILT HOVER HANDLER
   ========================================================================== */
function initCards3DTilt() {
    const cards = document.querySelectorAll('.card-3d-tilt');
    if (cards.length === 0) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);

            // Calculate rotation angles (tilt max 8 deg)
            const tiltX = (y / (rect.height / 2)) * -8;
            const tiltY = (x / (rect.width / 2)) * 8;

            gsap.to(card, {
                rotateX: tiltX,
                rotateY: tiltY,
                transformPerspective: 1000,
                x: x * 0.02, // slight magnetic glide
                y: y * 0.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'power3.out'
            });
        });
    });
}

/* ==========================================================================
   14. DYNAMIC THEME & DATABASE RENDERING HELPERS
   ========================================================================== */
function applyDynamicTheme(settings) {
    let styleTag = document.getElementById('dynamic-theme-rules');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme-rules';
        document.head.appendChild(styleTag);
    }

    const displayFont = settings.font_display || 'Oswald';
    const bodyFont = settings.font_body || 'Inter';
    const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(displayFont)}:wght@300;400;500;600;700;800&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600;700;800&display=swap`;
    
    let fontLink = document.getElementById('dynamic-google-fonts');
    if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = 'dynamic-google-fonts';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }
    fontLink.href = fontUrl;

    let styleRules = `
        :root {
            --bg: ${settings.background_color || '#050811'};
            --bg2: ${settings.surface_color || '#0c1122'};
            --bg-card: ${settings.surface_color || '#0c1122'};
            --border: rgba(255, 255, 255, 0.08);
            --border-hover: ${settings.primary_color || '#f43f5e'};
            --accent: ${settings.primary_color || '#f43f5e'};
            --accent2: ${settings.secondary_color || '#8b5cf6'};
            --accent-color: ${settings.accent_color || '#f59e0b'};
            --accent-glow: ${settings.primary_color || '#f43f5e'}1f;
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --text-dim: #64748b;
            --font-display: '${displayFont}', sans-serif;
            --font-body: '${bodyFont}', sans-serif;
        }
        body {
            background-color: var(--bg) !important;
            color: var(--text) !important;
            font-family: var(--font-body) !important;
        }
        h1, h2, h3, h4, .font-display {
            font-family: var(--font-display) !important;
        }
        .gradient-text {
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
        }
        .gradient-border-glow::after {
            background: linear-gradient(135deg, var(--accent), var(--accent2)) !important;
        }
        .timeline-progress {
            background: linear-gradient(to bottom, var(--accent), var(--accent2)) !important;
        }
        .nav-link::after {
            background: linear-gradient(90deg, var(--accent), var(--accent2)) !important;
        }
    `;
    styleTag.innerHTML = styleRules;
}

function applySectionOrder(orderCsv) {
    if (!orderCsv) return;
    const order = orderCsv.split(',');
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const sections = Array.from(mainElement.children);
    sections.sort((a, b) => {
        const idA = a.id;
        const idB = b.id;
        if (!idA) return 1;
        if (!idB) return -1;
        
        let indexA = order.indexOf(idA);
        let indexB = order.indexOf(idB);
        
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        
        return indexA - indexB;
    });

    sections.forEach(section => {
        mainElement.appendChild(section);
    });
}

function renderEducation(items) {
    const container = document.getElementById('dynamic-education-list');
    if (!container || !items) return;

    const visibleItems = items.filter(item => item.is_visible !== 0);
    if (visibleItems.length === 0) {
        container.innerHTML = `<p class="text-on-brand-muted text-center py-8">No education items available.</p>`;
        return;
    }

    const isIndexPage = !!document.getElementById('timeline-progress-bar');

    if (isIndexPage) {
        let html = '';
        visibleItems.forEach((item, i) => {
            const isEven = i % 2 === 0;
            const alignClass = isEven ? 'md:justify-between' : 'md:flex-row-reverse md:justify-between';
            const textAlignment = isEven ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8';
            const plClass = isEven ? 'pl-12 md:pl-8' : 'pl-12 md:pl-0 md:pr-8';
            const timelineSide = isEven ? `
                <div class="hidden md:block w-[45%] ${textAlignment}">
                    <span class="text-xs font-mono font-bold text-brand-primary tracking-widest block uppercase">${item.timeline}</span>
                    <span class="text-sm font-bold text-white uppercase block mt-1">College Education</span>
                </div>
            ` : `
                <div class="hidden md:block w-[45%] ${textAlignment}">
                    <span class="text-xs font-mono font-bold text-brand-secondary tracking-widest block uppercase">${item.timeline}</span>
                    <span class="text-sm font-bold text-white uppercase block mt-1">College Education</span>
                </div>
            `;
            
            const dotBorderColor = isEven ? 'border-brand-primary' : 'border-brand-secondary';
            const dotBgColor = isEven ? 'bg-brand-primary' : 'bg-brand-secondary';

            html += `
                <div class="timeline-element relative flex flex-col md:flex-row ${alignClass} items-start md:items-center w-full">
                    ${timelineSide}
                    <div class="absolute left-4 md:left-1/2 w-6 h-6 rounded-full bg-brand-surface border-4 ${dotBorderColor} -translate-x-1/2 z-10 flex items-center justify-center">
                        <span class="w-1.5 h-1.5 rounded-full ${dotBgColor}"></span>
                    </div>
                    <div class="w-full md:w-[45%] ${plClass}">
                        <div class="glass-card p-6 rounded-2xl relative shadow-xl">
                            <span class="md:hidden text-xs font-mono font-bold text-brand-primary tracking-widest block uppercase mb-1">${item.timeline}</span>
                            <h3 class="font-display text-xl font-bold text-white uppercase">${item.degree}</h3>
                            <h4 class="text-sm text-brand-secondary font-semibold mt-1">${item.institution}</h4>
                            <p class="text-on-brand-muted text-sm mt-3 leading-relaxed">${item.description}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        // Vanilla CSS layout for education.html subpage
        let html = `
            <div class="timeline-track">
                <div class="timeline-track-fill" id="timeline-fill"></div>
            </div>
        `;
        visibleItems.forEach(item => {
            html += `
                <div class="timeline-item">
                    <div class="timeline-left">
                        <span class="timeline-period">${item.timeline}</span>
                        <span class="timeline-org">${item.institution}</span>
                    </div>
                    <div class="timeline-right">
                        <h3 class="timeline-role">${item.degree}</h3>
                        <p class="timeline-desc">${item.description}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
}

function renderProjects(items) {
    const container = document.getElementById('dynamic-projects-list');
    if (!container || !items) return;

    const visibleItems = items.filter(item => item.is_visible !== 0);
    if (visibleItems.length === 0) {
        container.innerHTML = `<p class="text-on-brand-muted text-center py-8">No projects available.</p>`;
        return;
    }

    const isIndexPage = !container.classList.contains('project-list');

    if (isIndexPage) {
        let html = '';
        visibleItems.forEach(item => {
            const tagsHtml = item.tags ? item.tags.split(',').map(tag => `
                <span class="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] font-mono text-on-brand-muted">${tag.trim()}</span>
            `).join('') : '';

            const linksHtml = `
                <div class="flex gap-4 mt-4 text-xs font-semibold">
                    ${item.live_link ? `<a href="${item.live_link}" target="_blank" class="text-brand-primary hover:underline flex items-center gap-1">Live Demo <i class="fa-solid fa-arrow-right text-[10px]"></i></a>` : ''}
                    ${item.github_link ? `<a href="${item.github_link}" target="_blank" class="text-on-brand-muted hover:text-white flex items-center gap-1">GitHub <i class="fa-brands fa-github"></i></a>` : ''}
                </div>
            `;

            html += `
                <div class="glass-card rounded-2xl p-8 relative overflow-hidden group hover:border-brand-primary/40 transition-colors duration-300">
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-brand-primary/10 border border-brand-primary/20 rounded-lg flex items-center justify-center text-brand-primary">
                                <i class="fa-solid fa-globe"></i>
                            </div>
                            <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-brand-primary">Project</span>
                        </div>
                        <h3 class="font-display text-xl font-bold text-white uppercase">${item.title}</h3>
                        <p class="text-on-brand-muted text-sm leading-relaxed">${item.description}</p>
                        <div class="flex flex-wrap gap-2 pt-2">
                            ${tagsHtml}
                        </div>
                        ${linksHtml}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        // Vanilla CSS project-row list layout for projects.html
        let html = '';
        visibleItems.forEach((item, index) => {
            const idxStr = String(index + 1).padStart(2, '0');
            const primaryTag = item.tags ? item.tags.split(',')[0].trim() : 'Project';
            const linkHref = item.live_link || item.github_link || '#';
            
            html += `
                <a href="${linkHref}" target="_blank" class="project-row" data-preview="${item.title}" data-color="var(--bg2)">
                    <span class="project-index">${idxStr}</span>
                    <span class="project-row-name">${item.title}</span>
                    <span class="project-row-tag">${primaryTag}</span>
                    <div class="project-row-arrow">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </a>
            `;
        });
        container.innerHTML = html;
    }
}

function renderExperience(items) {
    const container = document.getElementById('dynamic-experience-list');
    if (!container || !items) return;

    const visibleItems = items.filter(item => item.is_visible !== 0);
    if (visibleItems.length === 0) {
        container.innerHTML = `<p class="text-on-brand-muted text-center py-8">No current focus items available.</p>`;
        return;
    }

    const borderColors = ['border-l-brand-primary', 'border-l-brand-secondary', 'border-l-brand-accent'];
    const textColors = ['text-brand-primary', 'text-brand-secondary', 'text-brand-accent'];
    const iconClasses = ['fa-laptop-code', 'fa-shield-halved', 'fa-graduation-cap'];

    let html = '';
    visibleItems.forEach((item, i) => {
        const borderColor = borderColors[i % 3];
        const textColor = textColors[i % 3];
        const iconClass = iconClasses[i % 3];

        html += `
            <div class="glass-card p-8 rounded-2xl relative flex flex-col justify-between min-h-[240px] group border-l-4 ${borderColor}">
                <div class="space-y-4">
                    <div class="${textColor} text-3xl">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <h3 class="font-display text-xl font-bold text-white uppercase tracking-wide group-hover:${textColor} transition-colors">
                        ${item.role}
                    </h3>
                    <p class="text-on-brand-muted text-sm leading-relaxed">
                        ${item.description}
                    </p>
                </div>
                <div class="mt-6 text-xs font-mono text-on-brand-muted">
                    <span class="${textColor}"><i class="fa-solid fa-clock"></i> ${item.company} // ${item.timeline}</span>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'LIVE_THEME_UPDATE') {
        if (event.data.settings) {
            applyDynamicTheme(event.data.settings);
            applySectionOrder(event.data.settings.layout_sections_order);
            applyDynamicContent(event.data.settings);
        }
    }
});

function applyDynamicContent(settings) {
    const setHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    const setHref = (id, url) => {
        const el = document.getElementById(id);
        if (el && url) el.href = url;
    };

    // Brand Name, Logo Text & Footer Text
    if (settings.logo_text) {
        document.querySelectorAll('.logo-link').forEach(el => {
            const dotIndex = settings.logo_text.indexOf('.');
            if (dotIndex !== -1) {
                const before = settings.logo_text.substring(0, dotIndex);
                const after = settings.logo_text.substring(dotIndex);
                el.innerHTML = `${before}<span class="accent">${after}</span>`;
            } else {
                el.textContent = settings.logo_text;
            }
        });
    }

    if (settings.footer_text) {
        document.querySelectorAll('.footer-copy, .footer-text, #dynamic-footer-text').forEach(el => {
            el.textContent = settings.footer_text;
        });
    }

    // Hero Section
    if (settings.hero_badge) setText('dynamic-hero-badge', settings.hero_badge);
    if (settings.hero_title) {
        const formattedTitle = settings.hero_title.replace(/\n/g, '<br />');
        setHtml('dynamic-hero-title', formattedTitle);
    }
    if (settings.hero_subtitle) setText('dynamic-hero-subtitle', settings.hero_subtitle);
    if (settings.hero_description) setText('dynamic-hero-description', settings.hero_description);

    // About Section
    if (settings.about_lead) setText('dynamic-about-lead', settings.about_lead);
    if (settings.about_body) {
        const el = document.getElementById('dynamic-about-body');
        if (el) {
            const paragraphs = settings.about_body.split('\n\n');
            el.innerHTML = paragraphs.map(p => `<p class="about-text reveal-up">${p.replace(/\n/g, '<br>')}</p>`).join('');
        }
    }

    // Goals Section
    for (let i = 1; i <= 3; i++) {
        const title = settings[`goal_${i}_title`];
        const desc = settings[`goal_${i}_desc`];
        const status = settings[`goal_${i}_status`];
        
        if (title) setText(`dynamic-goal-${i}-title`, title);
        if (desc) {
            const el = document.getElementById(`dynamic-goal-${i}-desc`);
            if (el) {
                let formattedDesc = desc;
                formattedDesc = formattedDesc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                el.innerHTML = formattedDesc;
            }
        }
        if (status) setText(`dynamic-goal-${i}-status`, status);
    }

    // Contact Coordinates
    if (settings.contact_title) setHtml('dynamic-contact-title', settings.contact_title);
    if (settings.contact_subtitle) setText('dynamic-contact-subtitle', settings.contact_subtitle);
    if (settings.contact_email) {
        setHref('dynamic-contact-email', `mailto:${settings.contact_email}`);
        setText('dynamic-contact-email-text', settings.contact_email);
        document.querySelectorAll('.dynamic-contact-email-mailto').forEach(el => {
            el.href = `mailto:${settings.contact_email}`;
        });
    }
    if (settings.contact_location) setText('dynamic-contact-location', settings.contact_location);
    if (settings.contact_status) setText('dynamic-contact-status', settings.contact_status);

    setHref('dynamic-social-github', settings.social_github);
    setHref('dynamic-social-linkedin', settings.social_linkedin);
    setHref('dynamic-social-twitter', settings.social_twitter);

    const renderSkills = (id, commaString, hoverClass) => {
        const container = document.getElementById(id);
        if (!container || !commaString) return;
        const tags = commaString.split(',');
        let html = '';
        tags.forEach(tag => {
            const trimmed = tag.trim();
            if (trimmed) {
                html += `<span class="px-4 py-2 bg-neutral-950 border border-white/10 hover:${hoverClass} hover:text-white rounded-lg text-xs font-mono text-on-brand-muted transition-all cursor-default">${trimmed}</span>`;
            }
        });
        container.innerHTML = html;
    };

    renderSkills('dynamic-skills-web-dev', settings.skills_web_dev, 'border-brand-primary');
    renderSkills('dynamic-skills-security', settings.skills_security, 'border-brand-secondary');
    renderSkills('dynamic-skills-languages', settings.skills_languages, 'border-brand-accent');

    // SEO Settings
    if (settings.seo_title) {
        document.title = settings.seo_title;
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', settings.seo_title);
    }
    if (settings.seo_description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', settings.seo_description);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', settings.seo_description);
    }

    // Google Analytics Tracking
    if (settings.analytics_id) {
        let existingAnalytics = document.getElementById('dynamic-analytics');
        if (!existingAnalytics) {
            existingAnalytics = document.createElement('script');
            existingAnalytics.id = 'dynamic-analytics';
            existingAnalytics.async = true;
            existingAnalytics.src = `https://www.googletagmanager.com/gtag/js?id=${settings.analytics_id}`;
            document.head.appendChild(existingAnalytics);
            
            const initScript = document.createElement('script');
            initScript.id = 'dynamic-analytics-init';
            initScript.textContent = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.analytics_id}');
            `;
            document.head.appendChild(initScript);
        }
    }

    // Custom CSS Styles Injection
    let customCssTag = document.getElementById('dynamic-custom-css');
    if (settings.custom_css) {
        if (!customCssTag) {
            customCssTag = document.createElement('style');
            customCssTag.id = 'dynamic-custom-css';
            document.head.appendChild(customCssTag);
        }
        customCssTag.innerHTML = settings.custom_css;
    } else if (customCssTag) {
        customCssTag.remove();
    }

    // Custom JavaScript Code Injection
    let customJsTag = document.getElementById('dynamic-custom-js');
    if (settings.custom_javascript) {
        if (!customJsTag) {
            customJsTag = document.createElement('script');
            customJsTag.id = 'dynamic-custom-js';
            document.body.appendChild(customJsTag);
        }
        customJsTag.textContent = settings.custom_javascript;
    } else if (customJsTag) {
        customJsTag.remove();
    }
}


