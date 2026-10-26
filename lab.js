/* lab.js v1.0 \u2014 Matematyka 1 Lab: Desmos-style plotter (+ domain strip) and sequence-limit lab.
   Usage (after a <div>):
     <div data-lab="plot" data-expr="arcsin(x/2)/(x-1)"></div>
     <div data-lab="seq"  data-config='{"expr":"(1+a/n)^n","params":{"a":{"min":-3,"max":5,"step":0.5,"val":2}}}'></div>
     <script src="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0/lab.js"></script>
   or from JS: Lab.plot(el, {expr, x:[-6,6], y:[-4,4], extra:[{expr,color}]}), Lab.seq(el, {expr, params, nmax, table}) */
(function (g) {
  'use strict';
  var CDN = {
    math: 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.1/math.min.js',
    kjs: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
    kcss: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css'
  };
  var C = { red: '#c74440', blue: '#2d70b3', green: '#388c46', purple: '#6042a6', orange: '#fa7e19', grid: '#e3e3e3', axis: '#444', ink: '#222' };
  var CSS = '.lab{background:#fff;color:#222;border:1px solid #ccc;border-radius:8px;padding:10px;font:14px/1.4 system-ui,sans-serif;max-width:100%;box-sizing:border-box;margin:6px 0}' +
    '.lab *{box-sizing:border-box}.lab .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0;color:#222}' +
    '.lab input[type=text]{flex:1;min-width:140px;padding:6px 8px;border:1px solid #bbb;border-radius:6px;background:#fff;color:#222;font:14px ui-monospace,monospace}' +
    '.lab button{padding:4px 10px;border:1px solid #bbb;border-radius:6px;background:#f4f4f4;color:#222;cursor:pointer;font:13px system-ui}.lab button:hover{background:#e6e6e6}' +
    '.lab canvas{display:block;width:100%;touch-action:none;background:#fff;border-radius:4px}' +
    '.lab .tex{min-height:30px;color:#222;overflow-x:auto;overflow-y:hidden}.lab .katex{color:#222}' +
    '.lab .err{color:#b00020;font-size:12px;min-height:14px}.lab .hov{font:12px ui-monospace,monospace;color:#444;min-height:16px}' +
    '.lab table{border-collapse:collapse;width:100%;font:12px ui-monospace,monospace;color:#222}' +
    '.lab td,.lab th{border-bottom:1px solid #ddd;padding:3px 6px;text-align:right;color:#222}' +
    '.lab input[type=range]{flex:1;min-width:120px}.lab .iv{padding:6px 8px;background:#f5f8fc;border-radius:6px;color:#222;display:none}' +
    '.lab .tag{font-size:12px;color:#555}';

  /* ---------- loading ---------- */
  function loadJS(u) { return new Promise(function (r, j) { var s = document.createElement('script'); s.src = u; s.onload = r; s.onerror = function () { j(new Error('load ' + u)); }; document.head.appendChild(s); }); }
  function loadCSS(u) { return new Promise(function (r) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; l.onload = r; l.onerror = r; document.head.appendChild(l); }); }
  var ready;
  function init() {
    if (ready) return ready;
    if (!document.getElementById('lab-css')) { var st = document.createElement('style'); st.id = 'lab-css'; st.textContent = CSS; document.head.appendChild(st); }
    ready = Promise.all([g.math ? 0 : loadJS(CDN.math), g.katex ? 0 : loadJS(CDN.kjs), g.katex ? 0 : loadCSS(CDN.kcss)]);
    return ready;
  }

  /* ---------- math helpers ---------- */
  function norm(s) {
    return String(s).replace(/\u221a/g, 'sqrt').replace(/\u03c0/g, 'pi').replace(/\|([^|]+)\|/g, 'abs($1)')
      .replace(/\barcsin\b/g, 'asin').replace(/\barccos\b/g, 'acos').replace(/\barcctg\b/g, 'acot').replace(/\barctg\b/g, 'atan').replace(/\barctan\b/g, 'atan')
      .replace(/\btg\b/g, 'tan').replace(/\bctg\b/g, 'cot').replace(/\bln\b/g, 'log');
  }
  var FN = { asin: '\\arcsin', acos: '\\arccos', atan: '\\operatorname{arctg}', acot: '\\operatorname{arcctg}', tan: '\\operatorname{tg}', cot: '\\operatorname{ctg}', log: '\\ln' };
  function tex(src) {
    var node = g.math.parse(norm(src));
    return node.toTex({
      parenthesis: 'keep', implicit: 'hide',
      handler: function (n, o) {
        if (n.type === 'FunctionNode' && n.fn && FN[n.fn.name] && n.args.length === 1) return FN[n.fn.name] + '\\left(' + n.args[0].toTex(o) + '\\right)';
      }
    });
  }
  function kt(el, s) { try { g.katex.render(s, el, { throwOnError: false }); } catch (e) { el.textContent = s; } }
  function fmt(v) { if (!isFinite(v)) return String(v); var a = Math.abs(v); if (a !== 0 && (a >= 1e7 || a < 1e-4)) return v.toExponential(3); return String(parseFloat(v.toPrecision(6))); }
  function nice(span, target) { var raw = span / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
  function num(v) { // LaTeX for a number, recognising multiples of pi/m
    if (v === 0) return '0';
    for (var m = 1; m <= 12; m++) { var k = v / Math.PI * m; if (Math.abs(k - Math.round(k)) < 1e-6 && Math.round(k) !== 0) { k = Math.round(k); var s = k < 0 ? '-' : '', a = Math.abs(k); var top = (a === 1 ? '' : a) + '\\pi'; return s + (m === 1 ? top : '\\frac{' + top + '}{' + m + '}'); } }
    return fmt(v);
  }
  function el_(x) { return typeof x === 'string' ? document.querySelector(x) : x; }
  function mk(root, html) { root.classList.add('lab'); root.innerHTML = html; return root; }
  function mkEv(code, extra) {
    return function (x, sc) {
      try { var s = { x: x }; if (sc) for (var k in sc) s[k] = sc[k]; var v = code.evaluate(s); return (typeof v === 'number' && isFinite(v)) ? v : null; } catch (e) { return null; }
    };
  }
  function setupCanvas(cv, W, H) { var d = window.devicePixelRatio || 1; cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.height = H + 'px'; var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }

  /* ---------- domain by sampling + bisection ---------- */
  function snap(v) {
    var k = v * 12 / Math.PI; if (Math.abs(k - Math.round(k)) < 1e-9) return Math.round(k) * Math.PI / 12;
    var r = Math.round(v * 1e6) / 1e6; return Math.abs(r - v) < 1e-9 ? r : v;
  }
  function domain(ev, xl, xr, N) {
    var sp = xr - xl, wl = xl, wr = xr; xl -= sp * .1; xr += sp * .1; N = Math.round(N * 1.2);
    var cl = function (x) { var y = ev(x); return y !== null && Math.abs(y) < 1e9; };
    var xs = [], ok = [], ys = [], i, k;
    for (i = 0; i <= N; i++) { var x = xl + (xr - xl) * i / N; xs.push(x); var y = ev(x); ys.push(y); ok.push(y !== null); }
    var bp = [];
    for (i = 0; i < N; i++) {
      if (ok[i] !== ok[i + 1]) {
        var a = xs[i], b = xs[i + 1], oa = ok[i];
        for (k = 0; k < 45; k++) { var m = (a + b) / 2; if ((ev(m) !== null) === oa) a = m; else b = m; }
        bp.push(snap((a + b) / 2));
      } else if (ok[i] && ok[i + 1] && Math.abs(ys[i]) > 20 && Math.abs(ys[i + 1]) > 20 && ys[i] * ys[i + 1] < 0) { // pole?
        var a2 = xs[i], b2 = xs[i + 1], sa = Math.sign(ys[i]);
        for (k = 0; k < 45; k++) { var m2 = (a2 + b2) / 2, v2 = ev(m2); if (v2 === null) break; if (Math.sign(v2) === sa) a2 = m2; else b2 = m2; }
        var pm = (a2 + b2) / 2, pv = ev(pm);
        if (pv === null || Math.abs(pv) > Math.max(Math.abs(ys[i]), Math.abs(ys[i + 1]))) bp.push(snap(pm));
      }
    }
    var cnt = 0;
    for (var q = Math.ceil(xl * 4); q / 4 < xr && cnt < 400; q++, cnt++) { // isolated holes on a 0.25 grid
      var hx = q / 4;
      if (ev(hx) === null && ev(hx - 1e-6) !== null && ev(hx + 1e-6) !== null) bp.push(hx);
    }
    bp.sort(function (u, v) { return u - v; });
    var u = []; bp.forEach(function (b) { if (!u.length || Math.abs(b - u[u.length - 1]) > 1e-7) u.push(b); });
    var pts = [xl].concat(u.filter(function (b) { return b > xl && b < xr; }), [xr]);
    var res = [], n = pts.length;
    for (i = 0; i < n - 1; i++) {
      var A = pts[i], B = pts[i + 1]; if (ev((A + B) / 2) === null) continue;
      var last = res[res.length - 1], lastSeg = (i + 1 === n - 1);
      if (last && last.b === A && cl(A)) { last.b = B; last.eb = lastSeg; last.cb = lastSeg ? false : cl(B); }
      else res.push({ a: A, b: B, ea: i === 0, eb: lastSeg, ca: i === 0 ? false : cl(A), cb: lastSeg ? false : cl(B) });
    }
    var out = [];
    res.forEach(function (d) {
      if (d.b <= wl || d.a >= wr) return;
      if (d.a < wl) { d.a = wl; d.ea = true; d.ca = false; } if (d.b > wr) { d.b = wr; d.eb = true; d.cb = false; }
      out.push(d);
    });
    return out;
  }
  function ivTex(iv) {
    if (!iv.length) return '\\emptyset';
    if (iv.length === 1 && iv[0].ea && iv[0].eb) return '\\mathbb{R}';
    return iv.map(function (d) {
      if (!d.ea && !d.eb && d.ca && d.cb && Math.abs(d.a - d.b) < 1e-9) return '\\{' + num(d.a) + '\\}';
      return (d.ea ? '(-\\infty' : (d.ca ? '[' : '(') + num(d.a)) + ',' + (d.eb ? '\\infty)' : num(d.b) + (d.cb ? ']' : ')'));
    }).join('\\cup ');
  }

  /* ---------- PLOT ---------- */
  var PRE = ['arcsin(x/2)/(x-1)', 'sqrt(6-x)/(x-1)', 'ln(5-x)/sqrt(x+2)', 'tg(x)', '1/x', 'sqrt(x^2-4)'];
  function plot(root, cfg) {
    root = el_(root); cfg = cfg || {};
    return init().then(function () {
      var presets = cfg.presets || PRE;
      mk(root, '<div class="row"><input type="text" spellcheck="false" autocomplete="off"><button data-a="in">+</button><button data-a="out">\u2212</button><button data-a="reset">reset</button><button data-a="iv">Poka\u017c zapis przedzia\u0142owy</button></div>' +
        (presets.length ? '<div class="row" data-r="pre"></div>' : '') +
        '<div class="tex"></div><div class="err"></div><canvas></canvas><div class="hov"></div><div class="iv"></div>');
      var inp = root.querySelector('input'), cv = root.querySelector('canvas'), texEl = root.querySelector('.tex'), errEl = root.querySelector('.err'), hov = root.querySelector('.hov'), ivEl = root.querySelector('.iv');
      var X0 = (cfg.x || [-6, 6]).slice(), Y0 = (cfg.y || [-4, 4]).slice(), v = { x0: X0[0], x1: X0[1], y0: Y0[0], y1: Y0[1] };
      var H = cfg.height || 340, STRIP = cfg.domain === false ? 0 : 36, W = 600, code = null, ev = null, dom = [], extras = [], showIv = false, ctx;
      function compileExtras() { extras = (cfg.extra || []).map(function (e, i) { try { return { ev: mkEv(g.math.compile(norm(e.expr))), color: e.color || [C.blue, C.green, C.purple, C.orange][i % 4] }; } catch (er) { return null; } }).filter(Boolean); }
      compileExtras();
      function setExpr(s) {
        try { code = g.math.compile(norm(s)); ev = mkEv(code); errEl.textContent = ''; kt(texEl, 'f(x)=' + tex(s)); }
        catch (e) { code = null; ev = null; errEl.textContent = 'Nie rozumiem wyra\u017cenia: ' + e.message; texEl.textContent = ''; }
        draw();
      }
      function X(x) { return (x - v.x0) / (v.x1 - v.x0) * W; }
      function Y(y) { return (v.y1 - y) / (v.y1 - v.y0) * H; }
      function curve(f, color, wd) {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.lineJoin = 'round';
        var pen = false, prev = 0;
        for (var px = 0; px <= W; px++) {
          var y = f(v.x0 + px / W * (v.x1 - v.x0)); if (y === null) { pen = false; continue; }
          var py = Math.max(-1e5, Math.min(1e5, Y(y)));
          if (pen && Math.abs(py - prev) > 2 * H) pen = false;
          if (pen) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          pen = true; prev = py;
        }
        ctx.stroke();
      }
      function draw() {
        W = Math.max(280, (cfg.width || root.clientWidth - 22));
        ctx = setupCanvas(cv, W, H + STRIP);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H + STRIP);
        var sx = nice(v.x1 - v.x0, W / 70), sy = nice(v.y1 - v.y0, H / 50), t;
        ctx.lineWidth = 1; ctx.strokeStyle = C.grid; ctx.beginPath();
        for (t = Math.ceil(v.x0 / sx) * sx; t <= v.x1; t += sx) { ctx.moveTo(Math.round(X(t)) + .5, 0); ctx.lineTo(Math.round(X(t)) + .5, H); }
        for (t = Math.ceil(v.y0 / sy) * sy; t <= v.y1; t += sy) { ctx.moveTo(0, Math.round(Y(t)) + .5); ctx.lineTo(W, Math.round(Y(t)) + .5); }
        ctx.stroke();
        var ax = Math.max(0, Math.min(W, X(0))), ay = Math.max(0, Math.min(H, Y(0)));
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke();
        ctx.fillStyle = '#555'; ctx.font = '11px system-ui,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (t = Math.ceil(v.x0 / sx) * sx; t <= v.x1; t += sx) { if (Math.abs(t) < sx / 1e3) continue; ctx.fillText(fmt(+t.toFixed(10)), X(t), Math.min(H - 13, ay + 3)); }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (t = Math.ceil(v.y0 / sy) * sy; t <= v.y1; t += sy) { if (Math.abs(t) < sy / 1e3) continue; ctx.fillText(fmt(+t.toFixed(10)), Math.max(30, ax - 4), Y(t)); }
        extras.forEach(function (e) { curve(e.ev, e.color, 2.4); });
        if (ev) curve(ev, C.red, 2.6);
        if (STRIP) {
          ctx.fillStyle = '#f5f8fc'; ctx.fillRect(0, H, W, STRIP); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, H + .5); ctx.lineTo(W, H + .5); ctx.stroke();
          dom = ev ? domain(ev, v.x0, v.x1, Math.round(2 * W)) : [];
          var yy = H + 19; ctx.fillStyle = '#2d70b3'; ctx.font = 'italic 12px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('D', 6, H + 8);
          dom.forEach(function (d) {
            var xa = X(d.a), xb = X(d.b); ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xb, yy); ctx.stroke();
            [[xa, d.ea, d.ca], [xb, d.eb, d.cb]].forEach(function (p) {
              if (p[1]) return;
              ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(45,112,179,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], yy); ctx.lineTo(p[0], 0); ctx.stroke(); ctx.setLineDash([]);
              ctx.beginPath(); ctx.arc(p[0], yy, 5, 0, 7); ctx.fillStyle = p[2] ? C.blue : '#fff'; ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.stroke();
            });
          });
          if (showIv) { ivEl.style.display = 'block'; kt(ivEl, 'D=' + ivTex(dom) + '\\quad\\text{(w oknie } x\\in[' + fmt(v.x0) + ',' + fmt(v.x1) + ']\\text{)}'); } else ivEl.style.display = 'none';
        }
      }
      function zoom(f) { var cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2, hx = (v.x1 - v.x0) / 2 * f, hy = (v.y1 - v.y0) / 2 * f; v.x0 = cx - hx; v.x1 = cx + hx; v.y0 = cy - hy; v.y1 = cy + hy; draw(); }
      root.querySelectorAll('button[data-a]').forEach(function (b) {
        b.onclick = function () {
          var a = b.dataset.a;
          if (a === 'in') zoom(.7); else if (a === 'out') zoom(1 / .7);
          else if (a === 'reset') { v = { x0: X0[0], x1: X0[1], y0: Y0[0], y1: Y0[1] }; draw(); }
          else if (a === 'iv') { showIv = !showIv; b.textContent = showIv ? 'Ukryj zapis przedzia\u0142owy' : 'Poka\u017c zapis przedzia\u0142owy'; draw(); }
        };
      });
      var pre = root.querySelector('[data-r=pre]');
      if (pre) presets.forEach(function (p) { var b = document.createElement('button'); b.textContent = p; b.style.fontFamily = 'ui-monospace,monospace'; b.onclick = function () { inp.value = p; setExpr(p); }; pre.appendChild(b); });
      inp.addEventListener('input', function () { setExpr(inp.value); });
      var drag = null;
      cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, v: Object.assign({}, v) }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointerup', function () { drag = null; });
      cv.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect();
        if (drag) {
          var dx = (e.clientX - drag.x) / r.width * (drag.v.x1 - drag.v.x0), dy = (e.clientY - drag.y) / (r.height - STRIP) * (drag.v.y1 - drag.v.y0);
          v.x0 = drag.v.x0 - dx; v.x1 = drag.v.x1 - dx; v.y0 = drag.v.y0 + dy; v.y1 = drag.v.y1 + dy; draw();
        } else if (ev) {
          var x = v.x0 + (e.clientX - r.left) / r.width * (v.x1 - v.x0), y = ev(x);
          hov.textContent = 'x = ' + fmt(x) + '    f(x) = ' + (y === null ? '\u2014 (poza dziedzin\u0105)' : fmt(y));
        }
      });
      if (g.ResizeObserver) new ResizeObserver(function () { if (Math.abs(root.clientWidth - 22 - W) > 2) draw(); }).observe(root);
      var e0 = cfg.expr || presets[0] || 'x'; inp.value = e0; setExpr(e0);
      return { setExpr: function (s) { inp.value = s; setExpr(s); }, domain: function () { return dom; } };
    });
  }

  /* ---------- SEQ LAB ---------- */
  function seq(root, cfg) {
    root = el_(root); cfg = cfg || {};
    return init().then(function () {
      var P = cfg.params || {}, vals = {}, k, nmax = cfg.nmax || 10000, name = cfg.name || 'a_n', tbl = cfg.table || [10, 100, 1000, 1e4, 1e5, 1e6];
      for (k in P) vals[k] = P[k].val !== undefined ? P[k].val : P[k].min;
      var html = '';
      if (cfg.editable !== false) html += '<div class="row"><input type="text" data-r="expr" spellcheck="false"></div>';
      html += '<div class="tex"></div><div class="err"></div>';
      for (k in P) html += '<div class="row"><span data-k="' + k + '" style="min-width:60px"></span><input type="range" data-p="' + k + '" min="' + P[k].min + '" max="' + P[k].max + '" step="' + (P[k].step || 1) + '" value="' + vals[k] + '"></div>';
      if (cfg.guess !== false) html += '<div class="row"><span>Tw\u00f3j typ granicy&nbsp;<i>L</i>:</span><input type="text" data-r="guess" placeholder="np. e^2  albo  0  albo  1/2" spellcheck="false"></div>';
      html += '<canvas></canvas><div class="hov"></div><div data-r="tbl"></div>';
      mk(root, html);
      var exprIn = root.querySelector('[data-r=expr]'), guessIn = root.querySelector('[data-r=guess]'), texEl = root.querySelector('.tex'), errEl = root.querySelector('.err'), cv = root.querySelector('canvas'), hov = root.querySelector('.hov'), tb = root.querySelector('[data-r=tbl]');
      var H = cfg.height || 300, W = 600, code = null, series = [], L = null, ctx, yr = [0, 1], LOG = Math.log10(nmax);
      function val(n) { try { var s = { n: n }; for (var q in vals) s[q] = vals[q]; var r = code.evaluate(s); return (typeof r === 'number' && isFinite(r)) ? r : null; } catch (e) { return null; } }
      function setExpr(s) {
        try { code = g.math.compile(norm(s)); errEl.textContent = ''; kt(texEl, name + '=' + tex(s)); } catch (e) { code = null; errEl.textContent = 'Nie rozumiem wyra\u017cenia: ' + e.message; }
        render();
      }
      function readL() { L = null; if (guessIn && guessIn.value.trim()) { try { var r = g.math.evaluate(norm(guessIn.value)); if (typeof r === 'number' && isFinite(r)) L = r; } catch (e) { } } }
      function sample() {
        var ns = [], i; if (nmax <= 400) for (i = 1; i <= nmax; i++) ns.push(i);
        else { var seen = {}; for (i = 0; i <= 400; i++) { var n = Math.round(Math.pow(10, LOG * i / 400)); if (!seen[n]) { seen[n] = 1; ns.push(n); } } }
        series = ns.map(function (n) { return [n, val(n)]; }).filter(function (p) { return p[1] !== null; });
        var lo = Infinity, hi = -Infinity; series.forEach(function (p) { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; });
        if (L !== null) { lo = Math.min(lo, L); hi = Math.max(hi, L); }
        if (!isFinite(lo)) { lo = 0; hi = 1; } if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
        var pad = (hi - lo) * .12; yr = [lo - pad, hi + pad];
      }
      function X(n) { return 38 + Math.log10(n) / LOG * (W - 50); }
      function Y(y) { return 8 + (yr[1] - y) / (yr[1] - yr[0]) * (H - 34); }
      function render() {
        readL(); W = Math.max(280, cfg.width || root.clientWidth - 22);
        ctx = setupCanvas(cv, W, H); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        if (!code) return; sample();
        var sy = nice(yr[1] - yr[0], 6), t, j;
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.fillStyle = '#555'; ctx.font = '11px system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.beginPath();
        for (t = Math.ceil(yr[0] / sy) * sy; t <= yr[1]; t += sy) { ctx.moveTo(38, Math.round(Y(t)) + .5); ctx.lineTo(W - 12, Math.round(Y(t)) + .5); }
        ctx.stroke();
        for (t = Math.ceil(yr[0] / sy) * sy; t <= yr[1]; t += sy) ctx.fillText(fmt(+t.toFixed(10)), 34, Y(t));
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.strokeStyle = C.grid; ctx.beginPath();
        for (j = 0; j <= Math.floor(LOG); j++) { ctx.moveTo(Math.round(X(Math.pow(10, j))) + .5, 8); ctx.lineTo(Math.round(X(Math.pow(10, j))) + .5, H - 26); }
        ctx.stroke();
        for (j = 0; j <= Math.floor(LOG); j++) ctx.fillText(j === 0 ? '1' : j === 1 ? '10' : '10^' + j, X(Math.pow(10, j)), H - 22);
        ctx.fillText('n  (skala logarytmiczna)', W / 2, H - 11);
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(38, 8); ctx.lineTo(38, H - 26); ctx.lineTo(W - 12, H - 26); ctx.stroke();
        if (L !== null) { ctx.setLineDash([6, 4]); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(38, Y(L)); ctx.lineTo(W - 12, Y(L)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = C.blue; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('L = ' + fmt(L), 44, Y(L) - 2); }
        ctx.strokeStyle = C.red; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath();
        series.forEach(function (p, i) { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); }); ctx.stroke();
        if (nmax <= 60) { ctx.fillStyle = C.red; series.forEach(function (p) { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 3, 0, 7); ctx.fill(); }); }
        tbl.filter(function (n) { return n <= nmax; }).forEach(function (n) { var y = val(n); if (y === null) return; ctx.fillStyle = '#fff'; ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(n), Y(y), 4.5, 0, 7); ctx.fill(); ctx.stroke(); });
        var h = '<table><tr><th>n</th><th>' + name.replace(/_/g, '<sub>') + (name.indexOf('_') >= 0 ? '</sub>' : '') + '</th>' + (L !== null ? '<th>|' + name.replace(/_/g, '<sub>') + (name.indexOf('_') >= 0 ? '</sub>' : '') + ' \u2212 L|</th>' : '') + '</tr>';
        tbl.forEach(function (n) { var y = val(n); h += '<tr><td>' + n.toLocaleString('en-US').replace(/,/g, ' ') + '</td><td>' + (y === null ? '\u2014' : y.toFixed(6)) + '</td>' + (L !== null ? '<td>' + (y === null ? '\u2014' : fmt(Math.abs(y - L))) + '</td>' : '') + '</tr>'; });
        tb.innerHTML = h + '</table>';
      }
      function sl(kk) { var s = root.querySelector('[data-k=' + kk + ']'); kt(s, kk + '=' + fmt(vals[kk])); }
      for (k in P) (function (kk) { sl(kk); root.querySelector('[data-p=' + kk + ']').addEventListener('input', function (e) { vals[kk] = +e.target.value; sl(kk); render(); }); })(k);
      if (exprIn) exprIn.addEventListener('input', function () { setExpr(exprIn.value); });
      if (guessIn) guessIn.addEventListener('input', render);
      cv.addEventListener('pointermove', function (e) {
        if (!code) return; var r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W, n = Math.max(1, Math.round(Math.pow(10, (px - 38) / (W - 50) * LOG))), y = val(n);
        hov.textContent = 'n = ' + n + '    ' + name.replace('_', '') + ' = ' + (y === null ? '\u2014' : y.toFixed(8));
      });
      if (g.ResizeObserver) new ResizeObserver(function () { if (Math.abs(root.clientWidth - 22 - W) > 2) render(); }).observe(root);
      var e0 = cfg.expr || '(1+a/n)^n'; if (exprIn) exprIn.value = e0; setExpr(e0);
      return { set: function (o) { Object.assign(vals, o); render(); } };
    });
  }

  /* ---------- auto-mount ---------- */
  function auto() {
    document.querySelectorAll('[data-lab]').forEach(function (d) {
      if (d.dataset.labDone) return; d.dataset.labDone = '1';
      var cfg = {}; try { if (d.dataset.config) cfg = JSON.parse(d.dataset.config); } catch (e) { }
      if (d.dataset.expr) cfg.expr = d.dataset.expr;
      (d.dataset.lab === 'seq' ? seq : plot)(d, cfg).catch(function (e) { d.textContent = 'lab.js: ' + e.message; });
    });
  }
  g.Lab = { version: '1.0', plot: plot, seq: seq, auto: auto, norm: norm, tex: function (s) { return init().then(function () { return tex(s); }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
