// DOM References
const themeSwitch = document.getElementById('theme-toggle');
const body = document.body;
const navLinks = document.querySelectorAll('.nav-links a');
const educationItems = document.querySelectorAll('.education-item');

// Apply saved theme on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    themeSwitch.checked = savedTheme === 'dark-mode';
}

// Theme Toggle with Ripple Effect
themeSwitch.addEventListener('change', function () {
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
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    let scrollY = window.scrollY + window.innerHeight / 3;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
    });
});

// Intersection Observer for Education Section Fade-In
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            sectionObserver.unobserve(entry.target); // Stop observing once visible
        }
    });
}, { threshold: 0.2 });

educationItems.forEach(item => sectionObserver.observe(item));

// Simplify the fade-in observer
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in-element');
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    fadeElements.forEach(item => fadeInObserver.observe(item));
});

// On Page Load: Add Animation Class and Reset Scroll
window.addEventListener('load', () => {
    body.classList.add('page-loaded');
    window.scrollTo(0, 0);
});

// Prevent Animation During Resize
let resizeTimer;
window.addEventListener('resize', () => {
    body.classList.add('resize-animation-stopper');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        body.classList.remove('resize-animation-stopper');
    }, 400);
});
