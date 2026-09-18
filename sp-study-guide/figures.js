/* Figures for the study guide. Every plot is computed here from the formula
   it illustrates, so the pictures match the text. Colors come from CSS classes
   so that light and dark mode both work. */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs, parent) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    function svgIn(id, w, h) {
        var host = document.getElementById(id);
        if (!host) return null;
        var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img' });
        host.appendChild(s);
        return s;
    }

    function text(svg, x, y, str, cls, anchor) {
        var t = el('text', { x: x, y: y, 'text-anchor': anchor || 'middle', class: cls || '' }, svg);
        t.textContent = str;
        return t;
    }

    var clipSeq = 0;

    /* A plotting box. xr and yr are data ranges; box is [x, y, w, h] in pixels.
       Everything drawn as data is clipped to the box, so no curve can spill
       over its own frame or over the figure next to it. */
    function Axes(svg, box, xr, yr) {
        this.svg = svg; this.box = box; this.xr = xr; this.yr = yr;
        this.clip = 'clip' + (++clipSeq);
        var cp = el('clipPath', { id: this.clip }, svg);
        el('rect', { x: box[0] - 1, y: box[1] - 1, width: box[2] + 2, height: box[3] + 2 }, cp);
    }
    /* Marks one element as data, so the box clips it. */
    Axes.prototype.cut = function (node) {
        node.setAttribute('clip-path', 'url(#' + this.clip + ')');
        return node;
    };
    Axes.prototype.x = function (v) { return this.box[0] + (v - this.xr[0]) / (this.xr[1] - this.xr[0]) * this.box[2]; };
    Axes.prototype.y = function (v) { return this.box[1] + this.box[3] - (v - this.yr[0]) / (this.yr[1] - this.yr[0]) * this.box[3]; };
    Axes.prototype.frame = function (opts) {
        opts = opts || {};
        var b = this.box;
        var x0 = this.x(Math.max(this.xr[0], Math.min(this.xr[1], 0)));
        var y0 = this.y(Math.max(this.yr[0], Math.min(this.yr[1], 0)));
        if (opts.xaxis !== false) el('line', { x1: b[0], x2: b[0] + b[2], y1: y0, y2: y0, class: 'axis' }, this.svg);
        if (opts.yaxis !== false) el('line', { x1: x0, x2: x0, y1: b[1], y2: b[1] + b[3], class: 'axis' }, this.svg);
        if (opts.xlabel) text(this.svg, b[0] + b[2] + 9, y0 + 4, opts.xlabel, 'small', 'start');
        if (opts.ylabel) text(this.svg, x0 + 4, b[1] + 9, opts.ylabel, 'small', 'start');
        if (opts.title) text(this.svg, b[0] + b[2] / 2, b[1] - 6, opts.title, 'lab');
        return this;
    };
    Axes.prototype.xticks = function (vals, labels, y) {
        var yy = (y === undefined) ? this.y(Math.max(this.yr[0], Math.min(this.yr[1], 0))) : this.y(y);
        for (var i = 0; i < vals.length; i++) {
            var px = this.x(vals[i]);
            el('line', { x1: px, x2: px, y1: yy - 3, y2: yy + 3, class: 'axis' }, this.svg);
            if (labels) text(this.svg, px, yy + 14, labels[i], 'small');
        }
    };
    Axes.prototype.yticks = function (vals, labels) {
        var xx = this.x(Math.max(this.xr[0], Math.min(this.xr[1], 0)));
        for (var i = 0; i < vals.length; i++) {
            var py = this.y(vals[i]);
            el('line', { x1: xx - 3, x2: xx + 3, y1: py, y2: py, class: 'axis' }, this.svg);
            if (labels) text(this.svg, xx - 6, py + 4, labels[i], 'small', 'end');
        }
    };
    Axes.prototype.curve = function (fn, cls, n) {
        n = n || 400;
        var pts = [];
        for (var i = 0; i <= n; i++) {
            var xv = this.xr[0] + (this.xr[1] - this.xr[0]) * i / n;
            var yv = fn(xv);
            if (!isFinite(yv)) continue;
            yv = Math.max(this.yr[0] - 4 * (this.yr[1] - this.yr[0]), Math.min(this.yr[1] + 4 * (this.yr[1] - this.yr[0]), yv));
            pts.push(this.x(xv).toFixed(2) + ',' + this.y(yv).toFixed(2));
        }
        return this.cut(el('polyline', { points: pts.join(' '), class: cls }, this.svg));
    };
    Axes.prototype.poly = function (xs, ys, cls, close) {
        var pts = [];
        for (var i = 0; i < xs.length; i++) pts.push(this.x(xs[i]).toFixed(2) + ',' + this.y(ys[i]).toFixed(2));
        return this.cut(el(close ? 'polygon' : 'polyline', { points: pts.join(' '), class: cls }, this.svg));
    };
    Axes.prototype.stems = function (ns, vals, cls, dotcls, r) {
        var y0 = this.y(0);
        for (var i = 0; i < ns.length; i++) {
            var px = this.x(ns[i]), py = this.y(vals[i]);
            this.cut(el('line', { x1: px, x2: px, y1: y0, y2: py, class: cls || 'stem' }, this.svg));
            this.cut(el('circle', { cx: px, cy: py, r: r || 3.2, class: dotcls || 'dot-a' }, this.svg));
        }
    };
    Axes.prototype.dots = function (xs, ys, cls, r) {
        for (var i = 0; i < xs.length; i++) this.cut(el('circle', { cx: this.x(xs[i]), cy: this.y(ys[i]), r: r || 3.2, class: cls }, this.svg));
    };
    Axes.prototype.vline = function (xv, cls) {
        var b = this.box;
        return el('line', { x1: this.x(xv), x2: this.x(xv), y1: b[1], y2: b[1] + b[3], class: cls }, this.svg);
    };

    var PI = Math.PI;

    /* ---------------- Figure 1.1: impulse and step ---------------- */
    (function () {
        var s = svgIn('fig-impulse', 720, 190); if (!s) return;
        var ns = [], d = [], u = [];
        for (var n = -5; n <= 6; n++) { ns.push(n); d.push(n === 0 ? 1 : 0); u.push(n >= 0 ? 1 : 0); }
        var a = new Axes(s, [30, 30, 300, 120], [-5.8, 6.8], [-0.25, 1.35]).frame({ xlabel: 'n', title: 'δ[n]', yaxis: false });
        a.xticks([-4, -2, 0, 2, 4, 6], ['−4', '−2', '0', '2', '4', '6']);
        a.stems(ns, d);
        var b = new Axes(s, [390, 30, 300, 120], [-5.8, 6.8], [-0.25, 1.35]).frame({ xlabel: 'n', title: 'u[n]', yaxis: false });
        b.xticks([-4, -2, 0, 2, 4, 6], ['−4', '−2', '0', '2', '4', '6']);
        b.stems(ns, u);
    })();

    /* ---------------- Figure 3.1: convolution of two pulses ---------------- */
    (function () {
        var s = svgIn('fig-conv', 720, 200); if (!s) return;
        var range = [-1.6, 7.6], ns = [];
        for (var n = -1; n <= 7; n++) ns.push(n);
        var x = ns.map(function (n) { return (n >= 0 && n <= 4) ? 1 : 0; });
        var h = ns.map(function (n) { return (n >= 0 && n <= 2) ? 1 : 0; });
        var y = ns.map(function (n) { var acc = 0; for (var k = 0; k <= 4; k++) { var m = n - k; if (m >= 0 && m <= 2) acc++; } return acc; });
        var a = new Axes(s, [24, 34, 200, 130], range, [-0.4, 3.4]).frame({ xlabel: 'n', title: 'x[n]', yaxis: false });
        a.xticks([0, 2, 4, 6], ['0', '2', '4', '6']); a.stems(ns, x);
        var b = new Axes(s, [260, 34, 200, 130], range, [-0.4, 3.4]).frame({ xlabel: 'n', title: 'h[n]', yaxis: false });
        b.xticks([0, 2, 4, 6], ['0', '2', '4', '6']); b.stems(ns, h, 'stem', 'dot-a');
        var c = new Axes(s, [496, 34, 200, 130], range, [-0.4, 3.4]).frame({ xlabel: 'n', title: 'y[n] = x[n] ∗ h[n]', yaxis: false });
        c.xticks([0, 2, 4, 6], ['0', '2', '4', '6']); c.yticks([1, 2, 3], ['1', '2', '3']);
        c.stems(ns, y, 'b', 'dot-b');
    })();

    /* ---------------- Figure 4.1: square wave partial sums ---------------- */
    (function () {
        var s = svgIn('fig-fs-square', 720, 260); if (!s) return;
        var a = new Axes(s, [40, 20, 620, 210], [-1, 1], [-0.25, 1.3]).frame({ xlabel: 't / T₀' });
        a.xticks([-1, -0.5, 0, 0.5, 1], ['−1', '−0.5', '0', '0.5', '1']);
        a.yticks([0.5, 1], ['0.5', '1']);
        var sq = function (t) { var u = t - Math.floor(t + 0.5); return Math.abs(u) < 0.25 ? 1 : 0; };
        a.curve(function (t) { return sq(t); }, 'axis thin dash', 2400);
        function partial(K) {
            return function (t) {
                var v = 0.5;
                for (var k = 1; k <= K; k += 2) v += 2 * Math.sin(k * PI / 2) / (k * PI) * Math.cos(2 * PI * k * t);
                return v;
            };
        }
        a.curve(partial(1), 'a thin', 800);
        a.curve(partial(3), 'b thin', 800);
        a.curve(partial(9), 'c thin', 1200);
        a.curve(partial(49), 'd', 3000);
    })();

    /* ---------------- Figure 5.1: rect and sinc ---------------- */
    (function () {
        var s = svgIn('fig-rect-sinc', 720, 210); if (!s) return;
        var a = new Axes(s, [30, 30, 270, 140], [-3, 3], [-0.5, 1.4]).frame({ xlabel: 't', title: 'x(t)' });
        a.xticks([-1, 1], ['−T₁', 'T₁']);
        a.poly([-3, -1, -1, 1, 1, 3], [0, 0, 1, 1, 0, 0], 'a');
        var b = new Axes(s, [360, 30, 340, 140], [-4 * PI, 4 * PI], [-0.6, 2.4]).frame({ xlabel: 'ω', title: 'X(jω) = 2T₁ sinc(ωT₁)' });
        b.xticks([-3 * PI, -2 * PI, -PI, PI, 2 * PI, 3 * PI], ['−3π/T₁', '−2π/T₁', '−π/T₁', 'π/T₁', '2π/T₁', '3π/T₁']);
        b.yticks([2], ['2T₁']);
        b.curve(function (w) { return w === 0 ? 2 : 2 * Math.sin(w) / w; }, 'a', 800);
    })();

    /* ---------------- Figure 7.1: sampling spectra ---------------- */
    (function () {
        var s = svgIn('fig-sampling', 720, 430); if (!s) return;
        var wm = 1;
        function tri(ax, c, h) {
            ax.poly([c - wm, c, c + wm], [0, h, 0], 'fa', true);
            ax.poly([c - wm, c, c + wm], [0, h, 0], 'a thin');
        }
        function copies(ax, ws) {
            var kmax = Math.ceil((5 + wm) / ws);
            for (var k = -kmax; k <= kmax; k++) tri(ax, k * ws, 1);
        }
        var a1 = new Axes(s, [40, 30, 640, 86], [-5, 5], [-0.15, 1.35]).frame({ xlabel: 'ω', title: 'X(jω): bandlimited to ωₘ' });
        a1.xticks([-wm, wm], ['−ωₘ', 'ωₘ']);
        tri(a1, 0, 1);

        var ws = 3;
        var a2 = new Axes(s, [40, 168, 640, 86], [-5, 5], [-0.15, 1.35]).frame({ xlabel: 'ω', title: 'Xₚ(jω) with ωₛ > 2ωₘ: the copies stay apart' });
        a2.xticks([-ws, -wm, wm, ws], ['−ωₛ', '−ωₘ', 'ωₘ', 'ωₛ']);
        copies(a2, ws);
        a2.poly([-ws / 2, -ws / 2, ws / 2, ws / 2], [0, 1.2, 1.2, 0], 'c thin dash');
        text(s, a2.x(ws / 2) + 5, a2.y(1.2) + 4, 'Hᵣ(jω)', 'small lab-c', 'start');

        var ws2 = 1.5;
        var a3 = new Axes(s, [40, 306, 640, 86], [-5, 5], [-0.15, 1.35]).frame({ xlabel: 'ω', title: 'Xₚ(jω) with ωₛ < 2ωₘ: the copies overlap and add' });
        a3.xticks([-ws2, ws2], ['−ωₛ', 'ωₛ']);
        copies(a3, ws2);
        a3.curve(function (w) {
            var v = 0;
            for (var m = -6; m <= 6; m++) { var d = Math.abs(w - m * ws2); if (d < wm) v += 1 - d; }
            return v;
        }, 'd', 1600);
        text(s, a3.x(3.55), a3.y(0.72), 'sum', 'small lab-d', 'start');
    })();

    /* ---------------- Figure 7.2: aliased sinusoids ---------------- */
    (function () {
        var s = svgIn('fig-alias', 720, 220); if (!s) return;
        var a = new Axes(s, [40, 20, 620, 170], [0, 1], [-1.35, 1.35]).frame({ xlabel: 't (ms)' });
        a.xticks([0, 0.2, 0.4, 0.6, 0.8, 1], ['0', '0.2', '0.4', '0.6', '0.8', '1']);
        a.curve(function (t) { return Math.cos(2 * PI * 7 * t); }, 'b thin', 1200);
        a.curve(function (t) { return Math.cos(2 * PI * 3 * t); }, 'a', 800);
        var ts = [], vs = [];
        for (var n = 0; n <= 10; n++) { ts.push(n / 10); vs.push(Math.cos(2 * PI * 3 * n / 10)); }
        a.dots(ts, vs, 'dot-c', 4.2);
    })();

    /* ---------------- Figure 7.3: sinc interpolation ---------------- */
    (function () {
        var s = svgIn('fig-sinc-interp', 720, 240); if (!s) return;
        var N = 13;
        var sig = function (t) { return Math.sin(2 * PI * 0.11 * t + 0.4) + 0.5 * Math.cos(2 * PI * 0.27 * t); };
        var a = new Axes(s, [40, 20, 620, 190], [0, N - 1], [-1.9, 1.9]).frame({ xlabel: 't / T' });
        var tk = []; for (var i = 0; i < N; i++) tk.push(i);
        a.xticks(tk, tk.map(String));
        var samp = tk.map(sig);
        var sinc = function (x) { return x === 0 ? 1 : Math.sin(PI * x) / (PI * x); };
        for (var n = 0; n < N; n++) {
            (function (n) {
                a.curve(function (t) { return samp[n] * sinc(t - n); }, 'axis thin', 600);
            })(n);
        }
        a.curve(function (t) { var v = 0; for (var n = 0; n < N; n++) v += samp[n] * sinc(t - n); return v; }, 'a', 800);
        a.stems(tk, samp, 'stem', 'dot-b', 3.6);
    })();

    /* ---------------- Figure 6.1: s-plane ROCs ---------------- */
    (function () {
        var s = svgIn('fig-splane', 720, 230); if (!s) return;
        function pane(x0, title, shade) {
            var a = new Axes(s, [x0, 30, 200, 160], [-5, 2], [-1, 1]);
            var b = a.box;
            /* shading */
            var sx0 = a.x(Math.max(-5, shade[0])), sx1 = a.x(Math.min(2, shade[1]));
            el('rect', { x: sx0, y: b[1], width: sx1 - sx0, height: b[3], class: 'fa' }, s);
            a.frame({ xlabel: 'σ', ylabel: 'jω', title: title });
            a.xticks([-3, -1], ['−3', '−1']);
            /* poles */
            [-3, -1].forEach(function (p) {
                var px = a.x(p), py = a.y(0);
                el('line', { x1: px - 5, y1: py - 5, x2: px + 5, y2: py + 5, class: 'pole' }, s);
                el('line', { x1: px - 5, y1: py + 5, x2: px + 5, y2: py - 5, class: 'pole' }, s);
            });
            if (shade[0] > -5) a.vline(shade[0], 'a thin dash');
            if (shade[1] < 2) a.vline(shade[1], 'a thin dash');
        }
        pane(20, 'right-sided: Re{s} > −1', [-1, 99]);
        pane(260, 'two-sided: −3 < Re{s} < −1', [-3, -1]);
        pane(500, 'left-sided: Re{s} < −3', [-99, -3]);
    })();

    /* ---------------- Figure 9.1: z-plane ROCs ---------------- */
    (function () {
        var s = svgIn('fig-zplane', 720, 286); if (!s) return;
        function pane(cx, title, outside) {
            var R = 95, a = 0.6;
            var cy = 145;
            var cid = 'zc' + cx;
            var cp = el('clipPath', { id: cid }, s);
            el('rect', { x: cx - 170, y: 16, width: 340, height: 264 }, cp);
            if (outside) {
                /* everything outside the pole circle: a ring drawn with an
                   even-odd path, so the hole in the middle stays clear */
                var Ro = 128;
                el('path', {
                    'clip-path': 'url(#' + cid + ')',
                    d: 'M ' + (cx - Ro) + ' ' + cy + ' a ' + Ro + ' ' + Ro + ' 0 1 0 ' + (2 * Ro) + ' 0 a ' + Ro + ' ' + Ro + ' 0 1 0 ' + (-2 * Ro) + ' 0 Z' +
                        ' M ' + (cx - R * a) + ' ' + cy + ' a ' + (R * a) + ' ' + (R * a) + ' 0 1 0 ' + (2 * R * a) + ' 0 a ' + (R * a) + ' ' + (R * a) + ' 0 1 0 ' + (-2 * R * a) + ' 0 Z',
                    'fill-rule': 'evenodd', class: 'fa'
                }, s);
            } else {
                el('circle', { cx: cx, cy: cy, r: R * a, class: 'fa' }, s);
            }
            el('line', { x1: cx - 150, x2: cx + 150, y1: cy, y2: cy, class: 'axis' }, s);
            el('line', { x1: cx, x2: cx, y1: cy - 115, y2: cy + 115, class: 'axis' }, s);
            el('circle', { cx: cx, cy: cy, r: R, class: 'c thin' }, s);
            el('circle', { cx: cx, cy: cy, r: R * a, class: 'a thin dash' }, s);
            text(s, cx + R + 4, cy - R + 10, 'unit circle', 'small lab-c', 'start');
            text(s, cx + 150, cy + 14, 'Re', 'small', 'end');
            text(s, cx + 5, cy - 108, 'Im', 'small', 'start');
            text(s, cx, cy - 128, title, 'lab');
            /* pole at a, zero at origin */
            var px = cx + R * a, py = cy;
            el('line', { x1: px - 5, y1: py - 5, x2: px + 5, y2: py + 5, class: 'pole' }, s);
            el('line', { x1: px - 5, y1: py + 5, x2: px + 5, y2: py - 5, class: 'pole' }, s);
            el('circle', { cx: cx, cy: cy, r: 4.5, class: 'zero' }, s);
            text(s, px, py + 18, 'a', 'small');
            text(s, cx + R, cy + 18, '1', 'small');
        }
        pane(185, 'aⁿu[n]:  ROC |z| > |a|  (stable)', true);
        pane(535, '−aⁿu[−n−1]:  ROC |z| < |a|', false);
    })();

    /* ---------------- Pole-zero plot + magnitude response ---------------- */
    function pzfig(id, zeros, poles, title, opts) {
        opts = opts || {};
        var s = svgIn(id, 720, 250); if (!s) return;
        var cx = 150, cy = 130, R = 92;
        el('line', { x1: cx - 120, x2: cx + 120, y1: cy, y2: cy, class: 'axis' }, s);
        el('line', { x1: cx, x2: cx, y1: cy - 112, y2: cy + 112, class: 'axis' }, s);
        el('circle', { cx: cx, cy: cy, r: R, class: 'c thin' }, s);
        text(s, cx, 14, 'z-plane', 'lab');
        text(s, cx + 120, cy + 14, 'Re', 'small', 'end');
        text(s, cx + 5, cy - 104, 'Im', 'small', 'start');
        text(s, cx + R + 3, cy + 14, '1', 'small', 'start');
        text(s, cx - R - 3, cy + 14, '−1', 'small', 'end');
        zeros.forEach(function (z) { el('circle', { cx: cx + R * z[0], cy: cy - R * z[1], r: 4.5, class: 'zero' }, s); });
        var counts = {};
        poles.forEach(function (p) {
            var px = cx + R * p[0], py = cy - R * p[1];
            el('line', { x1: px - 5, y1: py - 5, x2: px + 5, y2: py + 5, class: 'pole' }, s);
            el('line', { x1: px - 5, y1: py + 5, x2: px + 5, y2: py - 5, class: 'pole' }, s);
            var key = p[0].toFixed(3) + ',' + p[1].toFixed(3); counts[key] = (counts[key] || 0) + 1;
        });
        for (var key in counts) if (counts[key] > 1) {
            var xy = key.split(',').map(Number);
            text(s, cx + R * xy[0] + 8, cy - R * xy[1] - 6, '×' + counts[key], 'small lab', 'start');
        }
        /* magnitude response */
        function mag(W) {
            var ex = Math.cos(W), ey = Math.sin(W), num = 1, den = 1;
            zeros.forEach(function (z) { num *= Math.hypot(ex - z[0], ey - z[1]); });
            poles.forEach(function (p) { den *= Math.hypot(ex - p[0], ey - p[1]); });
            return num / den;
        }
        var peak = 0;
        for (var i = 0; i <= 2000; i++) { var v = mag(PI * i / 2000); if (v > peak) peak = v; }
        var a = new Axes(s, [330, 34, 370, 160], [0, PI], [-0.08, 1.15]).frame({ xlabel: 'Ω', title: title || '|H(e^{jΩ})| (normalized)' });
        a.xticks([0, PI / 4, PI / 2, 3 * PI / 4, PI], ['0', 'π/4', 'π/2', '3π/4', 'π']);
        a.yticks([0.5, 1], ['0.5', '1']);
        if (opts.marks) opts.marks.forEach(function (m) { a.vline(m, 'axis thin dash'); });
        a.curve(function (W) { return mag(W) / peak; }, 'a', 1500);
    }

    pzfig('fig-pz-first', [[0, 0]], [[0.8, 0]], '|H|, pole at z = 0.8');

    (function () {
        var zs = [], ps = [];
        for (var k = 1; k < 8; k++) zs.push([Math.cos(2 * PI * k / 8), Math.sin(2 * PI * k / 8)]);
        for (var j = 0; j < 7; j++) ps.push([0, 0]);
        pzfig('fig-pz-ma', zs, ps, '|H|, 8-point moving average', { marks: [PI / 4, PI / 2, 3 * PI / 4, PI] });
    })();

    (function () {
        var th = PI / 3, r = 0.95;
        pzfig('fig-pz-notch',
            [[Math.cos(th), Math.sin(th)], [Math.cos(th), -Math.sin(th)]],
            [[r * Math.cos(th), r * Math.sin(th)], [r * Math.cos(th), -r * Math.sin(th)]],
            '|H|, notch at Ω₀ = π/3', { marks: [th] });
    })();

    /* ---------------- Figure 10.4: bilinear warping ---------------- */
    (function () {
        var s = svgIn('fig-bilinear', 720, 240); if (!s) return;
        var a = new Axes(s, [46, 20, 600, 190], [0, 20], [0, 3.6]).frame({ xlabel: '' });
        a.xticks([0, 2, 5, 10, 15, 20], ['0', '2', '5', '10', '15', '20']);
        text(s, a.x(20) + 9, a.y(0) + 4, 'ωT', 'small', 'start');
        a.yticks([PI / 2, PI], ['π/2', 'π']);
        el('line', { x1: a.x(0), x2: a.x(20), y1: a.y(PI), y2: a.y(PI), class: 'grid' }, s);
        a.curve(function (w) { return w; }, 'b thin dash', 100);
        a.curve(function (w) { return 2 * Math.atan(w / 2); }, 'a', 600);
        text(s, a.x(3.4), a.y(3.45), 'Ω = ωT', 'small lab-b', 'start');
        text(s, a.x(14), a.y(2.9), 'Ω = 2 arctan(ωT/2)', 'small lab-a', 'middle');
        text(s, a.x(0) - 6, a.y(0) + 4, '0', 'small', 'end');
    })();

    /* ---------------- Figure 8.1: first-order DTFT ---------------- */
    (function () {
        var s = svgIn('fig-dtft-first', 720, 230); if (!s) return;
        var a = new Axes(s, [40, 20, 620, 180], [-PI, PI], [-0.4, 5.6]).frame({ xlabel: 'Ω' });
        a.xticks([-PI, -PI / 2, 0, PI / 2, PI], ['−π', '−π/2', '0', 'π/2', 'π']);
        a.yticks([1, 5], ['1', '5']);
        function m(aa) { return function (W) { return 1 / Math.sqrt(1 - 2 * aa * Math.cos(W) + aa * aa); }; }
        a.curve(m(0.8), 'a', 800);
        a.curve(m(-0.8), 'b', 800);
    })();

    /* ---------------- Figure 8.2: Dirichlet kernel ---------------- */
    (function () {
        var s = svgIn('fig-dirichlet', 720, 230); if (!s) return;
        var N = 8;
        var a = new Axes(s, [40, 20, 620, 180], [-PI, PI], [-0.6, 8.8]).frame({ xlabel: 'Ω' });
        a.xticks([-PI, -PI / 2, -PI / 4, 0, PI / 4, PI / 2, PI], ['−π', '−π/2', '−2π/N', '0', '2π/N', 'π/2', 'π']);
        a.yticks([N], ['N']);
        a.curve(function (W) { var d = Math.sin(W / 2); return Math.abs(d) < 1e-9 ? N : Math.abs(Math.sin(N * W / 2) / d); }, 'a', 1600);
    })();

    /* ---------------- Figure 11.1: DFT samples the DTFT ---------------- */
    (function () {
        var s = svgIn('fig-dft-samples', 720, 250); if (!s) return;
        var N = 8, x = [];
        for (var n = 0; n < N; n++) x.push(Math.cos(2 * PI * 1.3 * n / N));
        function dtft(W) {
            var re = 0, im = 0;
            for (var n = 0; n < N; n++) { re += x[n] * Math.cos(W * n); im -= x[n] * Math.sin(W * n); }
            return Math.hypot(re, im);
        }
        var a = new Axes(s, [40, 20, 620, 190], [0, 2 * PI], [-0.4, 4.6]).frame({ xlabel: 'Ω' });
        a.xticks([0, PI / 2, PI, 3 * PI / 2, 2 * PI], ['0', 'π/2', 'π', '3π/2', '2π']);
        var kx = [], kl = [];
        for (var k = 0; k < N; k++) { kx.push(2 * PI * k / N); kl.push('k=' + k); }
        a.xticks(kx, kl, -0.4);
        a.curve(dtft, 'a thin', 1200);
        var x32 = [], y32 = [];
        for (var k2 = 0; k2 < 32; k2++) { var W2 = 2 * PI * k2 / 32; x32.push(W2); y32.push(dtft(W2)); }
        a.dots(x32, y32, 'dot-c', 2.6);
        var x8 = [], y8 = [];
        for (var k3 = 0; k3 < N; k3++) { var W3 = 2 * PI * k3 / N; x8.push(W3); y8.push(dtft(W3)); }
        a.stems(x8, y8, 'b thin', 'dot-b', 4);
    })();

    /* ---------------- Figure 11.2: windows in dB ---------------- */
    (function () {
        var s = svgIn('fig-windows', 720, 260); if (!s) return;
        var N = 32;
        function spec(w) {
            var peak = 0;
            for (var n = 0; n < N; n++) peak += w[n];
            return function (W) {
                var re = 0, im = 0;
                for (var n = 0; n < N; n++) { re += w[n] * Math.cos(W * n); im -= w[n] * Math.sin(W * n); }
                var m = Math.hypot(re, im) / peak;
                return Math.max(-100, 20 * Math.log10(m + 1e-12));
            };
        }
        var rect = [], hann = [], black = [];
        for (var n = 0; n < N; n++) {
            rect.push(1);
            hann.push(0.5 - 0.5 * Math.cos(2 * PI * n / (N - 1)));
            black.push(0.42 - 0.5 * Math.cos(2 * PI * n / (N - 1)) + 0.08 * Math.cos(4 * PI * n / (N - 1)));
        }
        var a = new Axes(s, [46, 20, 650, 200], [-PI / 3, PI / 3], [-100, 6]);
        var b = a.box;
        el('line', { x1: b[0], x2: b[0] + b[2], y1: a.y(0), y2: a.y(0), class: 'axis' }, s);
        el('line', { x1: b[0], x2: b[0] + b[2], y1: a.y(-100), y2: a.y(-100), class: 'axis' }, s);
        el('line', { x1: a.x(0), x2: a.x(0), y1: b[1], y2: b[1] + b[3], class: 'axis' }, s);
        [-20, -40, -60, -80].forEach(function (d) {
            el('line', { x1: b[0], x2: b[0] + b[2], y1: a.y(d), y2: a.y(d), class: 'grid' }, s);
            text(s, b[0] - 5, a.y(d) + 4, d + ' dB', 'small', 'end');
        });
        text(s, b[0] - 5, a.y(0) + 4, '0 dB', 'small', 'end');
        a.xticks([-PI / 3, -PI / 6, 0, PI / 6, PI / 3], ['−π/3', '−π/6', '0', 'π/6', 'π/3'], -100);
        text(s, b[0] + b[2] + 9, a.y(-100) + 14, 'Ω', 'small', 'start');
        a.curve(spec(black), 'c thin', 2000);
        a.curve(spec(hann), 'b thin', 2000);
        a.curve(spec(rect), 'a', 2000);
    })();

    /* ---------------- Figure 12.1: one butterfly ---------------- */
    (function () {
        var s = svgIn('fig-butterfly', 720, 200); if (!s) return;
        var xl = 200, xr = 520, yt = 55, yb = 145;
        el('line', { x1: xl, y1: yt, x2: xr, y2: yt, class: 'wire' }, s);
        el('line', { x1: xl, y1: yt, x2: xr, y2: yb, class: 'wire' }, s);
        el('line', { x1: xl, y1: yb, x2: xr, y2: yt, class: 'wire-b' }, s);
        el('line', { x1: xl, y1: yb, x2: xr, y2: yb, class: 'wire-b' }, s);
        [[xl, yt], [xl, yb], [xr, yt], [xr, yb]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 5, class: 'node' }, s); });
        text(s, xl - 14, yt + 4, 'a', 'lab', 'end');
        text(s, xl - 14, yb + 4, 'b', 'lab', 'end');
        text(s, xr + 14, yt + 4, "a' = a + W·b", 'lab', 'start');
        text(s, xr + 14, yb + 4, "b' = a − W·b", 'lab', 'start');
        /* twiddle marker on the lower input */
        var tx = xl + 70;
        el('rect', { x: tx - 20, y: yb - 12, width: 40, height: 24, rx: 5, fill: 'var(--card)', stroke: 'var(--fig-b)', 'stroke-width': 1.4 }, s);
        var tw = text(s, tx, yb + 4, '', 'lab lab-b');
        tw.textContent = 'W';
        var sup = el('tspan', { dy: -5, 'font-size': '9px' }, tw); sup.textContent = 'k';
        var sub = el('tspan', { dy: 9, dx: -4, 'font-size': '9px' }, tw); sub.textContent = 'N';
        text(s, xr - 40, yb - 8, '−1', 'small lab-b');
        text(s, 360, 24, 'one complex multiply, two complex adds', 'small');
    })();

    /* ---------------- Figure 12.2: 8-point DIT flow graph ---------------- */
    (function () {
        var s = svgIn('fig-fft8', 720, 400); if (!s) return;
        var N = 8, stages = 3;
        var x0 = 108, xEnd = 612, rowY = function (r) { return 40 + r * 44; };
        var colX = function (c) { return x0 + c * (xEnd - x0) / stages; };
        var order = [0, 4, 2, 6, 1, 5, 3, 7];
        var sup = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷'];
        /* stage separators and labels */
        for (var c = 1; c < stages; c++) el('line', { x1: colX(c), x2: colX(c), y1: 22, y2: rowY(N - 1) + 18, class: 'grid' }, s);
        for (var st = 0; st < stages; st++) text(s, (colX(st) + colX(st + 1)) / 2, 18, 'stage ' + (st + 1), 'small');
        /* wires */
        for (var st2 = 0; st2 < stages; st2++) {
            var span = 1 << st2, group = span * 2, xa = colX(st2), xb = colX(st2 + 1);
            for (var base = 0; base < N; base += group) {
                for (var j = 0; j < span; j++) {
                    var top = base + j, bot = base + j + span;
                    var yt = rowY(top), yb = rowY(bot);
                    el('line', { x1: xa, y1: yt, x2: xb, y2: yt, class: 'wire' }, s);
                    el('line', { x1: xa, y1: yt, x2: xb, y2: yb, class: 'wire' }, s);
                    el('line', { x1: xa, y1: yb, x2: xb, y2: yt, class: 'wire-b' }, s);
                    el('line', { x1: xa, y1: yb, x2: xb, y2: yb, class: 'wire-b' }, s);
                    var p = j * (N / group); /* exponent of W_8 */
                    var lx = xa + 34, ly = yb - 6;
                    var t = text(s, lx, ly, 'W' + sup[p], 'small lab-b', 'start');
                    text(s, xb - 22, yb - 6, '−1', 'small lab-b', 'end');
                }
            }
        }
        /* nodes */
        for (var st3 = 0; st3 <= stages; st3++) for (var r = 0; r < N; r++) el('circle', { cx: colX(st3), cy: rowY(r), r: 4.2, class: 'node' }, s);
        /* labels */
        for (var r2 = 0; r2 < N; r2++) {
            text(s, x0 - 12, rowY(r2) + 4, 'x[' + order[r2] + ']', 'lab', 'end');
            text(s, xEnd + 12, rowY(r2) + 4, 'X[' + r2 + ']', 'lab', 'start');
        }
        text(s, 4, rowY(N - 1) + 30, 'bit-reversed input', 'small', 'start');
        text(s, 716, rowY(N - 1) + 30, 'natural-order output', 'small', 'end');
    })();
})();
