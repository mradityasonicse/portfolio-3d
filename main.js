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
    // Blob cursor disabled as requested
    initMobileNav();
    initHeroCanvas();
    initScrollHeader();
    initProjectPreviews();
    initFormTabs();
    initContactForm();
    initBookingForm();
    initCharSplit();

    // Wait for GSAP
    waitForGSAP(() => {
        initGSAPAnimations();
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

    // Animate chars
    heroTl.to('.char', {
        y: '0%',
        rotate: 0,
        duration: 1.2,
        stagger: 0.03,
        ease: 'power4.out'
    }, 0.1)
    .fromTo('#hero-badge', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0)
    .fromTo('#hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.5)
    .fromTo('#hero-actions', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }, 0.65)
    .fromTo('.header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1 }, 0)
    .fromTo('.scroll-indicator', { opacity: 0 }, { opacity: 1, duration: 1 }, 1);

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
    gsap.fromTo('.about-lead', { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-lead', start: 'top 85%' }
    });
    gsap.fromTo('.about-text', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-left', start: 'top 80%' }
    });
    gsap.fromTo('.skills-card', { opacity: 0, y: 50, scale: 0.97 }, {
        opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.about-right', start: 'top 80%' }
    });
    gsap.fromTo('.skill-tag', { opacity: 0, scale: 0.85 }, {
        opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(2)',
        scrollTrigger: { trigger: '.skill-tags', start: 'top 85%' }
    });

    // ---- Project rows ----
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

    // ---- Timeline fill ----
    const fill = document.getElementById('timeline-fill');
    if (fill) {
        gsap.fromTo(fill, { height: '0%' }, {
            height: '100%', ease: 'none',
            scrollTrigger: {
                trigger: '.timeline',
                start: 'top 20%',
                end: 'bottom 50%',
                scrub: true
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
    gsap.fromTo('.testimonial-card', { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: '.testimonials-grid', start: 'top 85%' }
    });

    // ---- Contact ----
    gsap.fromTo('.contact-big-text', { opacity: 0, y: 60 }, {
        opacity: 1, y: 0, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.contact-big-text', start: 'top 85%' }
    });
    gsap.fromTo('.contact-left > *', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' }
    });
    gsap.fromTo('.contact-form-box', { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 75%' }
    });

    // ---- Parallax on hero headline ----
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

    // ---- Footer socials ----
    gsap.fromTo('.social-link', { opacity: 0, y: 10 }, {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.footer', start: 'top 92%' }
    });

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
    const card = document.getElementById('profile-card-3d');
    if (!card) return;

    const inner = card.querySelector('.profile-card-inner');
    const glow = card.querySelector('.profile-glow');

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - (rect.width / 2); // mouse X relative to center
        const y = e.clientY - rect.top - (rect.height / 2); // mouse Y relative to center

        // Calculate rotation angles (tilt max 12 deg)
        const tiltX = (y / (rect.height / 2)) * -12;
        const tiltY = (x / (rect.width / 2)) * 12;

        // Interpolate rotate and translate with GSAP for high-end smoothness
        gsap.to(inner, {
            rotateX: tiltX,
            rotateY: tiltY,
            transformPerspective: 800,
            x: x * 0.05, // subtle magnetic drift
            y: y * 0.05,
            duration: 0.35,
            ease: 'power2.out'
        });

        gsap.to(glow, {
            x: x * 0.15,
            y: y * 0.15,
            duration: 0.35,
            ease: 'power2.out'
        });
    });

    card.addEventListener('mouseleave', () => {
        // Smoothly return to center
        gsap.to([inner, glow], {
            rotateX: 0,
            rotateY: 0,
            x: 0,
            y: 0,
            duration: 0.7,
            ease: 'power3.out'
        });
    });
}
