/* Figures for the PSNR study guide. Conceptual figures are computed here from the
   rule they show. Data figures read window.GUIDE_DATA (data.js), which is dumped
   from the project's result tables. Colors come from CSS classes, so light and
   dark mode both work. Each figure is wrapped in its own try/catch. */
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


    /* ---------------- helpers added for this guide ---------------- */
    var PI = Math.PI;
    var D = window.GUIDE_DATA || null;

    function guard(name, fn) {
        try { fn(); } catch (e) { if (window.console) console.error('figure ' + name + ' failed', e); }
    }

    function tip(node, str) {
        var t = document.createElementNS(NS, 'title');
        t.textContent = str;
        node.appendChild(t);
        return node;
    }

    function niceTicks(lo, hi, n) {
        var span = hi - lo, raw = span / (n || 5);
        var mag = Math.pow(10, Math.floor(Math.log10(raw)));
        var step = mag * ([1, 2, 2.5, 5, 10].find(function (m) { return m * mag >= raw; }) || 10);
        var out = [], v = Math.ceil(lo / step - 1e-9) * step;
        for (; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
        return out;
    }

    function fmt(v) {
        var a = Math.abs(v);
        if (a === 0) return '0';
        if (a >= 10) return String(Math.round(v)).replace('-', '−');
        var s = (a >= 1 ? v.toFixed(1) : (a >= 0.1 ? v.toFixed(2) : v.toFixed(3)));
        s = s.replace(/0+$/, '').replace(/\.$/, '');
        return s.replace('-', '−');
    }

    /* A frame with the axes on the bottom and left edges of the box, ticks,
       light grid lines and axis labels. */
    function boxFrame(a, xt, yt, xlabel, ylabel) {
        var b = a.box, s = a.svg;
        yt.forEach(function (v) {
            var py = a.y(v);
            el('line', { x1: b[0], x2: b[0] + b[2], y1: py, y2: py, class: 'grid' }, s);
            text(s, b[0] - 6, py + 3.5, fmt(v), 'small', 'end');
        });
        xt.forEach(function (v) {
            var px = a.x(v);
            el('line', { x1: px, x2: px, y1: b[1] + b[3], y2: b[1] + b[3] + 4, class: 'axis' }, s);
            text(s, px, b[1] + b[3] + 16, fmt(v), 'small');
        });
        el('line', { x1: b[0], x2: b[0] + b[2], y1: b[1] + b[3], y2: b[1] + b[3], class: 'axis' }, s);
        el('line', { x1: b[0], x2: b[0], y1: b[1], y2: b[1] + b[3], class: 'axis' }, s);
        if (xlabel) text(s, b[0] + b[2] / 2, b[1] + b[3] + 32, xlabel, 'small');
        if (ylabel) {
            var t = text(s, 0, 0, ylabel, 'small');
            t.setAttribute('transform', 'translate(' + (b[0] - 38) + ',' + (b[1] + b[3] / 2) + ') rotate(-90)');
        }
    }

    /* Point marks. Safe = filled circle; not safe = hollow square; a third
       class = cross. Shape and color both carry the class. */
    function mark(a, xv, yv, kind, label) {
        var px = a.x(xv), py = a.y(yv), n;
        var b = a.box;
        px = Math.max(b[0], Math.min(b[0] + b[2], px));
        var clipped = py < b[1] ? -1 : (py > b[1] + b[3] ? 1 : 0);
        py = Math.max(b[1], Math.min(b[1] + b[3], py));
        if (clipped) {
            var d = clipped < 0 ? 'M' + (px - 4) + ',' + (py + 5) + ' L' + px + ',' + (py - 2) + ' L' + (px + 4) + ',' + (py + 5) + ' Z'
                : 'M' + (px - 4) + ',' + (py - 5) + ' L' + px + ',' + (py + 2) + ' L' + (px + 4) + ',' + (py - 5) + ' Z';
            n = el('path', { d: d, class: kind === 'ok' ? 'pt-ok' : 'pt-bad-fill' }, a.svg);
        } else if (kind === 'ok') {
            n = el('circle', { cx: px, cy: py, r: 3.6, class: 'pt-ok' }, a.svg);
        } else if (kind === 'bad') {
            n = el('rect', { x: px - 3.2, y: py - 3.2, width: 6.4, height: 6.4, class: 'pt-bad' }, a.svg);
        } else {
            n = el('path', { d: 'M' + (px - 3.2) + ',' + (py - 3.2) + ' L' + (px + 3.2) + ',' + (py + 3.2) + ' M' + (px - 3.2) + ',' + (py + 3.2) + ' L' + (px + 3.2) + ',' + (py - 3.2), class: 'pt-x' }, a.svg);
        }
        if (label) tip(n, label + (clipped ? ' (off the chart, drawn at the edge)' : ''));
        return n;
    }

    function hl(a, yv, cls) {
        var b = a.box;
        return el('line', { x1: b[0], x2: b[0] + b[2], y1: a.y(yv), y2: a.y(yv), class: cls }, a.svg);
    }

    /* ---------------- Figure 1.1: field against decision ---------------- */
    guard('field', function () {
        var s = svgIn('fig-field', 720, 300); if (!s) return;
        var N = 720, T = 0.62;
        function sig(x) { return 0.52 + 0.30 * Math.sin(2 * PI * 1.25 * x) + 0.10 * Math.sin(2 * PI * 3.4 * x + 0.6); }
        function err(x) { return 0.03 * Math.sin(2 * PI * 23 * x); }
        var a = new Axes(s, [70, 24, 620, 140], [0, 1], [0, 1.05]);
        el('line', { x1: 70, x2: 690, y1: 164, y2: 164, class: 'axis' }, s);
        a.curve(sig, 'a');
        a.curve(function (x) { return sig(x) + err(x); }, 'b thin');
        hl(a, T, 'd thin dash');
        text(s, 694, a.y(T) + 4, 'T', 'lab', 'start');
        text(s, 62, 40, 'value', 'small', 'end');
        text(s, 62, 150, 'pixels →', 'small', 'end');
        /* decision strips */
        var rows = [['exact ≥ T', function (x) { return sig(x) >= T; }],
            ['approx ≥ T', function (x) { return sig(x) + err(x) >= T; }]];
        var flips = 0;
        rows.forEach(function (r, k) {
            var y = 196 + k * 26;
            text(s, 62, y + 12, r[0], 'small', 'end');
            el('rect', { x: 70, y: y, width: 620, height: 16, class: 'strip-off' }, s);
            for (var i = 0; i < N; i++) {
                var x = i / N;
                if (r[1](x)) el('rect', { x: 70 + 620 * i / N, y: y, width: 620 / N + 0.6, height: 16, class: 'strip-on' }, s);
            }
        });
        var y3 = 196 + 2 * 26;
        text(s, 62, y3 + 12, 'flipped', 'small', 'end');
        el('rect', { x: 70, y: y3, width: 620, height: 16, class: 'strip-off' }, s);
        for (var i = 0; i < N; i++) {
            var x = i / N;
            if ((sig(x) >= T) !== (sig(x) + err(x) >= T)) {
                flips++;
                el('rect', { x: 70 + 620 * i / N, y: y3, width: 620 / N + 0.6, height: 16, class: 'strip-flip' }, s);
            }
        }
        var note = document.getElementById('fig-field-n');
        if (note) note.textContent = (100 * flips / N).toFixed(1) + '%';
    });

    /* ---------------- Figure 2.1: the peak moves every Sobel point ---------------- */
    guard('peak', function () {
        var s = svgIn('fig-peak', 720, 200); if (!s || !D) return;
        var sh = 20 * Math.log10(6);
        var p = D.ranking[0].pts;
        var a = new Axes(s, [110, 20, 580, 120], [-10, 70], [-0.6, 1.6]);
        boxFrame(a, niceTicks(-10, 70, 8), [], 'PSNR of the Sobel magnitude M (dB)');
        text(s, 102, a.y(1) + 4, 'peak 255', 'small', 'end');
        text(s, 102, a.y(0) + 4, 'peak 1530', 'small', 'end');
        p.forEach(function (q) {
            el('line', { x1: a.x(q[1] - sh), x2: a.x(q[1]), y1: a.y(1), y2: a.y(0), class: 'grid' }, s);
        });
        p.forEach(function (q) {
            mark(a, q[1] - sh, 1, q[3] ? 'ok' : 'bad', q[0] + ': ' + (q[1] - sh).toFixed(1) + ' dB at peak 255');
            mark(a, q[1], 0, q[3] ? 'ok' : 'bad', q[0] + ': ' + q[1].toFixed(1) + ' dB at peak 1530');
        });
        a.vline(30, 'axis dash');
        text(s, a.x(30), 14, '30 dB', 'small');
    });

    /* ---------------- Figure 3.1: truncating M is a threshold shift ---------------- */
    guard('trunc', function () {
        var s = svgIn('fig-trunc', 720, 250); if (!s) return;
        var k = 3, T = 20, q = Math.ceil(T / 8) * 8;
        var a = new Axes(s, [70, 16, 600, 180], [0, 48], [0, 48]);
        boxFrame(a, [0, 8, 16, 20, 24, 32, 40, 48], [0, 8, 16, 20, 24, 32, 40, 48], 'M (exact)', 'value compared with T');
        a.curve(function (m) { return m; }, 'a thin dash', 200);
        var xs = [], ys = [];
        for (var m = 0; m <= 48; m++) { xs.push(m); ys.push(Math.floor(m / 8) * 8); }
        a.dots(xs, ys, 'dot-b', 2.6);
        hl(a, T, 'd thin dash');
        text(s, a.x(48) + 6, a.y(T) + 4, 'T = 20', 'small', 'start');
        a.vline(T, 'axis dash');
        a.vline(q, 'b thin');
        text(s, a.x(T) - 4, a.y(46), 'exact: M ≥ 20', 'small', 'end');
        text(s, a.x(q) + 4, a.y(46), 'truncated: M ≥ 24', 'small', 'start');
    });

    /* ---------------- Figure 5.1: the three verdicts ---------------- */
    guard('verdict', function () {
        var s = svgIn('fig-verdict', 720, 230); if (!s) return;
        var a = new Axes(s, [190, 26, 480, 150], [-3.2, 1.2], [0, 4]);
        el('rect', { x: a.x(-3.2), y: 26, width: a.x(-1) - a.x(-3.2), height: 150, class: 'fb' }, s);
        boxFrame(a, [-3, -2, -1, 0, 1], [], 'task change of the design against exact, in units of δ');
        a.vline(0, 'axis');
        a.vline(-1, 'd thin dash');
        text(s, a.x(-1), 18, '−δ', 'lab');
        text(s, a.x(0), 18, '0', 'lab');
        var rows = [['safe', -0.8, 0.5, 'ok'], ['inconclusive', -1.6, -0.3, 'mid'], ['shown inferior', -2.9, -1.5, 'bad']];
        rows.forEach(function (r, i) {
            var y = 3.4 - i * 1.2;
            el('line', { x1: a.x(r[1]), x2: a.x(r[2]), y1: a.y(y), y2: a.y(y), class: r[3] === 'ok' ? 'a' : (r[3] === 'bad' ? 'b' : 'c') }, s);
            [r[1], r[2]].forEach(function (e) {
                el('line', { x1: a.x(e), x2: a.x(e), y1: a.y(y) - 6, y2: a.y(y) + 6, class: r[3] === 'ok' ? 'a' : (r[3] === 'bad' ? 'b' : 'c') }, s);
            });
            el('circle', { cx: a.x((r[1] + r[2]) / 2), cy: a.y(y), r: 3.6, class: r[3] === 'ok' ? 'dot-a' : (r[3] === 'bad' ? 'dot-b' : 'dot-c') }, s);
            text(s, 180, a.y(y) + 4, r[0], 'lab', 'end');
        });
    });

    /* ---------------- Figure 6.1: the pipeline ---------------- */
    guard('pipeline', function () {
        var s = svgIn('fig-pipeline', 720, 270); if (!s) return;
        el('defs', {}, s).innerHTML = '';
        var mk = el('marker', { id: 'arr', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, s.querySelector('defs'));
        el('path', { d: 'M0,0 L10,5 L0,10 Z', class: 'arrowhead' }, mk);
        function box(x, y, w, h, l1, l2, cls) {
            el('rect', { x: x, y: y, width: w, height: h, rx: 7, class: cls || 'node' }, s);
            text(s, x + w / 2, y + (l2 ? h / 2 - 3 : h / 2 + 4), l1, 'lab');
            if (l2) text(s, x + w / 2, y + h / 2 + 12, l2, 'small');
        }
        function arrow(x1, y1, x2, y2, cls) {
            el('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: cls || 'wire', 'marker-end': 'url(#arr)' }, s);
        }
        box(10, 20, 170, 50, 'Python reference', 'same C models via ctypes');
        box(250, 20, 190, 50, 'task sweep on images', 'every design, 50 + 50 images');
        box(520, 20, 190, 50, 'task quality', 'F, repeatability, BD-rate…');
        arrow(180, 45, 248, 45); arrow(440, 45, 518, 45);
        box(10, 130, 170, 50, 'HLS kernel (C++)', 'same arithmetic');
        box(250, 130, 90, 50, 'csim', '');
        box(360, 130, 90, 50, 'csynth', '');
        box(470, 130, 90, 50, 'cosim', '');
        box(590, 130, 120, 50, 'place & route', 'LUT, FF, timing');
        arrow(180, 155, 248, 155); arrow(340, 155, 358, 155); arrow(450, 155, 468, 155); arrow(560, 155, 588, 155);
        box(470, 210, 120, 46, 'netlist sim', 'real images');
        box(610, 210, 100, 46, 'SAIF', '→ power');
        arrow(650, 180, 540, 208); arrow(590, 233, 608, 233);
        /* golden vectors: Python output compared bit for bit in csim and cosim */
        el('path', { d: 'M95,70 L95,100 L515,100 L515,128', class: 'wire-b dash', 'marker-end': 'url(#arr)' }, s);
        el('line', { x1: 295, y1: 100, x2: 295, y2: 128, class: 'wire-b dash', 'marker-end': 'url(#arr)' }, s);
        text(s, 405, 94, 'golden vectors: outputs must match bit for bit', 'small lab-b');
    });

    /* ---------------- Figure 6.2: Sobel adder swaps against exact + ---------------- */
    guard('lut', function () {
        var s = svgIn('fig-lut', 720, 210); if (!s || !D) return;
        var H = D.sobel_lut, ex = H.exact, all = [];
        ['u8', 'u12', 's12'].forEach(function (k) { all = all.concat(H.slots[k]); });
        var lo = Math.floor((Math.min.apply(null, all) - 5) / 10) * 10, hi = Math.ceil((Math.max.apply(null, all) + 5) / 10) * 10;
        var a = new Axes(s, [90, 20, 470, 130], [lo, hi], [-0.5, 2.5]);
        boxFrame(a, niceTicks(lo, hi, 8), [], 'post-route LUTs of the whole Sobel kernel');
        ['u8', 'u12', 's12'].forEach(function (k, i) {
            var y = 2 - i, v = H.slots[k], more = v.filter(function (x) { return x > ex; }).length;
            text(s, 82, a.y(y) + 4, k, 'lab', 'end');
            text(s, a.x(hi) + 8, a.y(y) + 4, more + ' of ' + v.length + ' cost more', 'small', 'start');
            v.forEach(function (x, j) {
                var jy = y + ((j % 5) - 2) * 0.09;
                mark(a, x, jy, x > ex ? 'bad' : 'ok', k + ' swap: ' + x + ' LUT');
            });
        });
        a.vline(ex, 'd thin');
        text(s, a.x(ex), 14, 'exact + : ' + ex + ' LUT', 'small');
    });

    /* ---------------- Figure 9.1: PSNR against task change, per task ---------------- */
    guard('ranking', function () {
        var host = document.getElementById('fig-ranking'); if (!host || !D) return;
        D.ranking.forEach(function (P, idx) {
            var cell = document.createElement('div');
            cell.className = 'panel';
            cell.id = 'fig-ranking-' + idx;
            host.appendChild(cell);
            var s = svgIn(cell.id, 340, 250);
            var xs = P.pts.map(function (q) { return q[1]; }), ys = P.pts.map(function (q) { return q[2]; });
            var x0 = Math.floor(Math.min(Math.min.apply(null, xs), 30) / 10) * 10 - 2, x1 = Math.ceil(Math.max.apply(null, xs) / 10) * 10 + 2;
            var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = (y1 - y0) * 0.08 || 0.01;
            y0 -= pad; y1 += pad;
            var a = new Axes(s, [62, 36, 262, 160], [x0, x1], [y0, y1]);
            boxFrame(a, niceTicks(x0, x1, 5), niceTicks(y0, y1, 4), 'PSNR (dB)', P.ylab);
            if (y0 < 0 && y1 > 0) hl(a, 0, 'axis thin');
            a.vline(30, 'axis dash');
            a.vline(P.safe, 'b');
            P.pts.forEach(function (q) {
                mark(a, q[1], q[2], q[3] ? 'ok' : 'bad', q[0] + ': ' + q[1].toFixed(1) + ' dB, change ' + q[2].toFixed(4) + (q[3] ? ', safe' : ', not safe'));
            });
            text(s, 62, 14, P.title, 'lab', 'start');
            text(s, 62, 28, 'τ = ' + P.tau.toFixed(2) + ', safe PSNR ' + P.safe.toFixed(1) + ' dB, n = ' + P.pts.length, 'small', 'start');
        });
    });

    /* ---------------- Figure 9.2: safe PSNR per task ---------------- */
    guard('safe', function () {
        var s = svgIn('fig-safe', 720, 270); if (!s) return;
        /* Table 2 of the paper: not safe, shown inferior, held-out */
        var rows = [['Sobel, re-tuned T', 29.0, 27.5, 28.9], ['Sobel, fixed T', 39.4, 29.0, 39.3],
            ['Harris (exploratory)', 67.9, 52.0, null], ['Denoising', 44.9, 44.1, 45.0],
            ['Compression', 48.7, 45.9, 49.1], ['Segmentation', 66.3, 60.0, 63.9]];
        var a = new Axes(s, [170, 26, 500, 190], [20, 75], [-0.5, rows.length - 0.5]);
        boxFrame(a, [20, 30, 40, 50, 60, 70], [], 'PSNR (dB)');
        a.vline(30, 'axis dash');
        text(s, a.x(30), 16, '30 dB rule', 'small');
        rows.forEach(function (r, i) {
            var y = rows.length - 1 - i;
            text(s, 162, a.y(y) + 4, r[0], 'lab', 'end');
            el('line', { x1: a.x(r[2]), x2: a.x(r[1]), y1: a.y(y), y2: a.y(y), class: 'grid' }, s);
            tip(el('circle', { cx: a.x(r[2]), cy: a.y(y), r: 4.2, class: 'pt-hollow' }, s), r[0] + ': shown-inferior only ' + r[2] + ' dB');
            tip(el('circle', { cx: a.x(r[1]), cy: a.y(y), r: 4.2, class: 'pt-safeval' }, s), r[0] + ': safe PSNR ' + r[1] + ' dB');
            if (r[3] !== null) tip(el('path', { d: 'M' + a.x(r[3]) + ',' + (a.y(y) + 4) + ' l5,5 l-5,5 l-5,-5 Z', class: 'pt-held' }, s), r[0] + ': held-out ' + r[3] + ' dB');
            text(s, a.x(Math.max(r[1], r[3] || 0)) + 10, a.y(y) + 4, r[1].toFixed(1), 'small', 'start');
        });
    });

    /* ---------------- Figure 9.3: Eq. 1 against the measured denoising loss ---------------- */
    guard('eq1', function () {
        var s = svgIn('fig-eq1', 720, 290); if (!s || !D) return;
        var dn = 26.68, delta = 0.1;
        var P = D.ranking.filter(function (p) { return p.title === 'Denoising'; })[0];
        /* The loss axis is logarithmic (log10 of the loss in dB), so designs
           from a few dB of loss down to a thousandth of a dB all fit. */
        var xmin = Math.floor(Math.min.apply(null, P.pts.map(function (q) { return q[1]; })) / 10) * 10;
        var a = new Axes(s, [70, 16, 600, 210], [xmin, 80], [-3, 1.3]);
        boxFrame(a, niceTicks(xmin, 80, 7), [], 'PSNR of the design against the exact smoother (dB)', 'denoising loss (dB, log scale)');
        [-3, -2, -1, 0, 1].forEach(function (e) {
            el('line', { x1: 70, x2: 670, y1: a.y(e), y2: a.y(e), class: 'grid' }, s);
            text(s, 64, a.y(e) + 3.5, ['0.001', '0.01', '0.1', '1', '10'][e + 3], 'small', 'end');
        });
        hl(a, Math.log10(delta), 'd thin dash');
        text(s, a.x(80) + 6, a.y(Math.log10(delta)) + 4, 'δ', 'lab', 'start');
        a.curve(function (x) { return Math.log10(10 * Math.log10(1 + Math.pow(10, (dn - x) / 10))); }, 'a', 600);
        var xs = dn - 10 * Math.log10(Math.pow(10, delta / 10) - 1);
        a.vline(xs, 'a thin dash');
        text(s, a.x(xs) - 4, 30, 'Eq. 1: ' + xs.toFixed(1) + ' dB', 'small lab-a', 'end');
        a.vline(P.safe, 'b thin');
        text(s, a.x(P.safe) + 4, 30, 'measured: ' + P.safe.toFixed(1) + ' dB', 'small lab-b', 'start');
        var tiny = 0;
        P.pts.forEach(function (q) {
            var loss = -q[2];
            if (loss < 0.001) tiny++;
            mark(a, q[1], Math.log10(Math.max(loss, 1e-6)), q[3] ? 'ok' : 'bad', q[0] + ': ' + q[1].toFixed(1) + ' dB, loss ' + loss.toFixed(4) + ' dB' + (q[3] ? ', safe' : ', not safe'));
        });
        var note = document.getElementById('fig-eq1-n');
        if (note) note.textContent = String(tiny);
    });

    /* ---------------- Figure 9.4: the same circuit in two uses ---------------- */
    guard('twouses', function () {
        var s = svgIn('fig-twouses', 720, 270); if (!s || !D) return;
        var xs = D.twouses.map(function (q) { return q[1]; });
        var x0 = Math.floor(Math.min.apply(null, xs) / 10) * 10, x1 = Math.ceil(Math.max.apply(null, xs) / 10) * 10;
        var a = new Axes(s, [70, 16, 600, 190], [x0, x1], [-0.04, 1.04]);
        boxFrame(a, niceTicks(x0, x1, 8), [0, 0.25, 0.5, 0.75, 1], 'PSNR of the Gaussian output (dB)', 'images with topology change');
        a.vline(30, 'axis dash');
        var kinds = ['ok', 'bad', 'x'], names = ['safe in both uses', 'safe as smoother only', 'not safe as smoother'];
        D.twouses.forEach(function (q) {
            mark(a, q[1], q[2], kinds[q[3]], q[0] + ': ' + q[1].toFixed(1) + ' dB, topology changed on ' + Math.round(100 * q[2]) + '% of images (' + names[q[3]] + ')');
        });
    });

    /* ---------------- Figure 9.5: fragile images ---------------- */
    guard('images', function () {
        var s = svgIn('fig-images', 720, 260); if (!s || !D) return;
        var P = D.images.pts, xs = P.map(function (q) { return q[0]; });
        var x1 = Math.ceil(Math.max.apply(null, xs) * 2) / 2;
        var a = new Axes(s, [70, 16, 600, 180], [0, x1], [-0.04, 1.04]);
        boxFrame(a, niceTicks(0, x1, 6), [0, 0.25, 0.5, 0.75, 1], 'pixels within ±1 gray level of the Otsu threshold (%)', 'fragility');
        P.forEach(function (q) { mark(a, q[0], q[1], 'ok', q[0].toFixed(2) + '% near threshold, fragility ' + q[1].toFixed(2)); });
        text(s, 680, 30, 'Spearman ρ = ' + D.images.rho.toFixed(2) + ', 50 images', 'small', 'end');
    });
})();
