// DOM References
const themeSwitch = document.getElementById('theme-toggle');
const body = document.body;
const navLinks = document.querySelectorAll('.nav-links a');
const educationItems = document.querySelectorAll('.education-item');

// Check and Apply Saved Theme Preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark-mode') {
    body.classList.add('dark-mode');
    themeSwitch.checked = true;
}

// Theme Toggle with Ripple Effect
themeSwitch.addEventListener('change', function (e) {
    if (this.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', '');
    }
});

// Smooth Scrolling for Anchor Links
navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        }
    });
});

// Highlight Active Navigation Link on Scroll
window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('section');
    navLinks.forEach(link => link.classList.remove('active'));
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop - sectionHeight / 3) {
            const currentId = section.getAttribute('id');
            navLinks.forEach(link => {
                if (link.getAttribute('href') === `#${currentId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// Intersection Observer for Education Section Fade-In
if (educationItems.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, { threshold: 0.2 });

    educationItems.forEach(item => observer.observe(item));
}

// Simplify the fade-in observer
const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, { threshold: 0.1 });

// Initialize fade-in elements
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fade-in-element').forEach(item =>
        fadeInObserver.observe(item)
    );
});

// On Page Load: Add Animation Class and Reset Scroll
window.addEventListener('load', () => {
    document.body.classList.add('page-loaded');
    window.scrollTo(0, 0);
});

// Prevent Animation During Resize
let resizeTimer;
window.addEventListener('resize', () => {
    document.body.classList.add('resize-animation-stopper');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
    }, 400);
});

// Initialize animations on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });
});