// Apply saved theme immediately (before loader)
const savedTheme = localStorage.getItem('theme');
const f1Car = document.querySelector('.f1-car');

if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (f1Car) f1Car.src = 'images/f1_white3.png';
} else {
    if (f1Car) f1Car.src = 'images/f1_black.png';
}

// Page Loader
window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const body = document.body;

    // Add loading class
    body.classList.add('loading');

    // After loader animation completes (2.5s total)
    setTimeout(() => {
        loader.classList.add('loaded');
        body.classList.remove('loading');

        // Reveal navbar first
        setTimeout(() => {
            body.classList.add('navbar-loaded');

            // Then reveal main content after navbar appears
            setTimeout(() => {
                body.classList.add('content-loaded');

                // Trigger hero section reveal
                setTimeout(() => {
                    const heroSection = document.getElementById('hero');
                    if (heroSection) {
                        heroSection.classList.add('active');
                    }
                }, 300);
            }, 400); // Wait 400ms after navbar
        }, 100); // Small delay after loader disappears
    }, 2500);
});

// DOM References
const nav = document.querySelector('nav');
const navToggle = document.querySelector('.nav-toggle');
const primaryNavigation = document.getElementById('primary-navigation');
const logo = document.getElementById('logo');
const menuBackdrop = document.getElementById('menuBackdrop');

let lastScrollY = window.scrollY;
let ticking = false;
const SCROLL_THRESHOLD = 10; // Minimum scroll distance to trigger direction change

// Navbar scroll behavior
function updateNavbarOnScroll() {
    const currentScrollY = window.scrollY;

    // Check if we've scrolled past the threshold
    if (Math.abs(currentScrollY - lastScrollY) < SCROLL_THRESHOLD) {
        ticking = false;
        return;
    }

    if (currentScrollY < 50) {
        // At top of page, always show navbar without shadow
        nav.classList.remove('nav-hidden');
        nav.classList.remove('scrolled');
    } else {
        // Scrolled down - add shadow
        nav.classList.add('scrolled');

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down - hide navbar (only after scrolling past 100px)
            nav.classList.add('nav-hidden');
        } else {
            // Scrolling up - show navbar
            nav.classList.remove('nav-hidden');
        }
    }

    lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
    ticking = false;
}

// Optimized scroll listener using requestAnimationFrame
function onScroll() {
    if (!ticking) {
        window.requestAnimationFrame(updateNavbarOnScroll);
        ticking = true;
    }
}

window.addEventListener('scroll', onScroll, { passive: true });

// Logo click to reload
if (logo) {
    logo.addEventListener('click', () => {
        window.location.reload();
    });
}

// Mobile Navigation Toggle
function setMobileNavOpen(isOpen) {
    if (!nav || !navToggle || !primaryNavigation || !menuBackdrop) return;

    nav.classList.toggle('nav-open', isOpen);
    navToggle.classList.toggle('active', isOpen);
    menuBackdrop.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));

    // Prevent body scroll when menu is open
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

if (navToggle && primaryNavigation && nav && menuBackdrop) {
    // Click to toggle on all devices
    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = nav.classList.contains('nav-open');
        setMobileNavOpen(!isOpen);
    });

    // Close menu when clicking backdrop
    menuBackdrop.addEventListener('click', () => {
        setMobileNavOpen(false);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const isOpen = nav.classList.contains('nav-open');
        if (isOpen && !nav.contains(e.target) && !primaryNavigation.contains(e.target)) {
            setMobileNavOpen(false);
        }
    });

    // Close menu when clicking on a nav link
    const navLinks = primaryNavigation.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            setMobileNavOpen(false);
        });
    });
}

// Cursor Glow Effect for Both Modes
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    document.body.style.setProperty('--mouse-x', `${x}%`);
    document.body.style.setProperty('--mouse-y', `${y}%`);
    document.body.classList.add('cursor-active');
});

// Remove cursor glow when leaving the window
document.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-active');
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight - 20;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Optionally unobserve after revealing (no reset on scroll up)
            // observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(element => {
    revealObserver.observe(element);
});

// Theme Toggle
const themeToggleMobile = document.getElementById('theme-toggle');
const themeToggleDesktop = document.getElementById('theme-toggle-desktop');
const body = document.body;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    if (themeToggleMobile) themeToggleMobile.checked = true;
    if (themeToggleDesktop) themeToggleDesktop.checked = true;
}

function toggleTheme(checked) {
    const f1Car = document.querySelector('.f1-car');

    if (checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        if (f1Car) f1Car.src = 'images/f1_white3.png';
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        if (f1Car) f1Car.src = 'images/f1_black.png';
    }
    // Sync both toggles
    if (themeToggleMobile) themeToggleMobile.checked = checked;
    if (themeToggleDesktop) themeToggleDesktop.checked = checked;
}

if (themeToggleMobile) {
    themeToggleMobile.addEventListener('change', function () {
        toggleTheme(this.checked);
    });
}

if (themeToggleDesktop) {
    themeToggleDesktop.addEventListener('change', function () {
        toggleTheme(this.checked);
    });
}
