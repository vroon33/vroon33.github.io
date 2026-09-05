/* Auto / light / dark, cycled by the button in the corner.
   Auto means "follow the operating system", which is the default. */
(function () {
    var btn = document.getElementById('themebtn');
    if (!btn) return;

    var order = ['auto', 'light', 'dark'];
    var icons = { auto: '◐', light: '☀', dark: '☾' };
    var labels = { auto: 'Auto', light: 'Light', dark: 'Dark' };

    var current = 'auto';
    try { current = localStorage.getItem('tools-theme') || 'auto'; } catch (e) { }
    if (order.indexOf(current) < 0) current = 'auto';

    function apply() {
        if (current === 'auto') document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', current);
        btn.querySelector('.ico').textContent = icons[current];
        btn.querySelector('.lbl').textContent = labels[current];
    }

    apply();

    btn.addEventListener('click', function () {
        current = order[(order.indexOf(current) + 1) % order.length];
        try {
            if (current === 'auto') localStorage.removeItem('tools-theme');
            else localStorage.setItem('tools-theme', current);
        } catch (e) { }
        apply();
    });
})();
