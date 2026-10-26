/* lab.js v1.4 \u2014 Matematyka 1 Lab: Desmos-style plotter (+ domain strip) and sequence-limit lab.
   Usage (after a <div>):
     <div data-lab="plot" data-exprs='["arcsin(x/2)/(x-1)","sqrt(6-x)/(x-1)"]'></div>
     <div data-lab="seq"  data-expr="(1+a/n)^n" data-config='{"params":{"a":{"min":-3,"max":5,"step":0.5,"val":2}}}'></div>
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
  var CSS = '.lab{background:#fff!important;color:#222!important;border:1px solid #ccc;border-radius:8px;padding:10px;font:14px/1.4 system-ui,sans-serif;max-width:100%;box-sizing:border-box;margin:6px 0}' +
    '.lab *{box-sizing:border-box}.lab .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0;color:#222}' +
    '.lab input[type=text]{flex:1;min-width:140px;padding:6px 8px;border:1px solid #bbb!important;border-radius:6px;background:#fff!important;color:#222!important;-webkit-text-fill-color:#222!important;font:14px ui-monospace,monospace}.lab input::placeholder{color:#888!important;-webkit-text-fill-color:#888!important}' +
    '.lab button{padding:4px 10px;border:1px solid #bbb;border-radius:6px;background:#f4f4f4!important;color:#222!important;-webkit-text-fill-color:#222!important;opacity:1!important;cursor:pointer;font:13px system-ui}.lab button:hover{background:#e6e6e6!important}.lab span,.lab td,.lab th,.lab label,.lab sub,.lab i{color:#222!important}' +
    '.lab canvas{display:block;width:100%;touch-action:none;background:#fff;border-radius:4px}' +
    '.lab .tex{min-height:30px;color:#222;overflow-x:auto;overflow-y:hidden}.lab .katex{color:#222}' +
    '.lab .err{color:#b00020!important;font-size:12px;min-height:14px}.lab .hov{font:12px ui-monospace,monospace;color:#444;min-height:16px}' +
    '.lab table{border-collapse:collapse;width:100%;font:12px ui-monospace,monospace;color:#222}' +
    '.lab td,.lab th{border-bottom:1px solid #ddd;padding:3px 6px;text-align:right;color:#222}' +
    '.lab input[type=range]{flex:1;min-width:120px}.lab .iv{padding:6px 8px;background:#f5f8fc;border-radius:6px;color:#222;display:none}' +
    '.lab .tag{font-size:12px;color:#555}';


  var CSS2 = '.lab.lab-pl{padding:0!important;overflow:hidden}.lab .lp{display:flex;align-items:stretch;background:#fff}' +
'.lab .lp-rs{width:7px;flex:none;cursor:col-resize;background:#e8e8e8;border-right:1px solid #cfcfcf;touch-action:none}.lab .lp-rs:hover{background:#b9cde6}.lab .lp.narrow .lp-rs{display:none}.lab .hidden{display:none!important}' +
    '.lab .lp-hs{height:12px;cursor:ns-resize;background:#efefef;border-top:1px solid #cfcfcf;position:relative;touch-action:none}.lab .lp-hs:after{content:"";position:absolute;left:50%;top:4px;width:40px;margin-left:-20px;height:3px;border-radius:2px;background:#aaa}.lab .lp-hs:hover{background:#dbe6f3}' +
    '.lab .lp-show{position:absolute;left:10px;top:10px;width:36px;height:36px;border:1px solid #bbb;border-radius:4px;background:#f5f5f5!important;box-shadow:0 1px 3px rgba(0,0,0,.25);padding:0!important;align-items:center;justify-content:center;cursor:pointer}' +
    '.lab .lp-left{width:34%;min-width:210px;max-width:340px;border-right:1px solid #cfcfcf;background:#fff;display:flex;flex-direction:column}' +
    '.lab .lp.narrow{flex-direction:column}.lab .lp.narrow .lp-left{width:100%;max-width:none;border-right:0;border-bottom:1px solid #cfcfcf;max-height:260px}' +
    '.lab .lp-head{display:flex;align-items:center;gap:8px;padding:6px 8px;background:#efefef;border-bottom:1px solid #cfcfcf}' +
    '.lab .lp-list{overflow:auto;flex:1}.lab .lp-row{display:flex;align-items:stretch;border-bottom:1px solid #d9d9d9;min-height:58px;background:#fff}' +
    '.lab .lp-num{width:46px;flex:none;background:#efefef;border-right:1px solid #d9d9d9;position:relative}' +
    '.lab .lp-row.sel .lp-num{background:#2d70b3}.lab .lp-n{position:absolute;left:5px;top:3px;font:10px system-ui;color:#777!important}.lab .lp-row.sel .lp-n{color:#fff!important}' +
    '.lab .lp-ico{position:absolute;left:9px;top:16px;width:28px;height:28px;border-radius:50%!important;padding:0!important;cursor:pointer}' +
    '.lab .lp-body{flex:1;min-width:0;padding:8px 6px 8px 10px;display:flex;flex-direction:column;justify-content:center}' +
    '.lab .lp-disp{font-size:17px;cursor:text;overflow-x:auto;overflow-y:hidden;min-height:26px;color:#222!important}' +
    '.lab .lp-body input.lp-in{width:100%;min-width:0;flex:none;border:0!important;outline:0;background:transparent!important;font:15px ui-monospace,monospace;padding:2px 0;color:#222!important;-webkit-text-fill-color:#222!important}' +
    '.lab .lp-err{color:#b00020!important;font-size:11px}.lab .lp-x{border:0!important;background:transparent!important;color:#999!important;font-size:20px;padding:0 10px;cursor:pointer;align-self:flex-start;margin-top:10px}.lab .lp-x:hover{color:#444!important}' +
    '.lab .lp-foot{padding:8px 10px;border-top:1px solid #cfcfcf;background:#fafafa;overflow-x:auto}' +
    '.lab .lp-right{flex:1;min-width:0;position:relative}.lab .lp-hov{position:absolute;left:8px;bottom:46px;font:12px ui-monospace,monospace;color:#444!important;background:rgba(255,255,255,.85);padding:0 4px;pointer-events:none}' +
    '.lab .lp-zoom{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;border:1px solid #bbb;border-radius:4px;background:#f5f5f5;box-shadow:0 1px 3px rgba(0,0,0,.25);overflow:hidden}' +
    '.lab .lp-zoom button{width:36px;height:36px;border:0!important;border-bottom:1px solid #ddd!important;border-radius:0!important;background:#f5f5f5!important;font-size:22px;line-height:1;padding:0!important;display:flex;align-items:center;justify-content:center}.lab .lp-zoom button:last-child{border-bottom:0!important}';

  var CSS3 = '.lab input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:#c4c4c4!important;outline:0;margin:12px 0;width:100%;min-width:0;flex:none;padding:0}' +
    '.lab input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#2d70b3;border:2px solid #fff;box-shadow:0 0 0 1px #2d70b3,0 1px 3px rgba(0,0,0,.4)}' +
    '.lab input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#2d70b3;border:2px solid #fff;box-shadow:0 0 0 1px #2d70b3}.lab input[type=range]::-moz-range-track{background:#c4c4c4;height:4px}' +
    '.lab .lp-ph{display:flex;align-items:center;gap:6px;font-size:16px}.lab .lp-ph .lp-in{flex:1}' +
    '.lab .lp-body input.lp-val{width:84px;flex:none;min-width:0;padding:3px 6px;font:14px ui-monospace,monospace;border:1px solid #d0d0d0!important;border-radius:4px;background:#fff!important}' +
    '.lab .lp-mm{display:flex;justify-content:space-between}.lab .lp-body input.lp-mn,.lab .lp-body input.lp-mx{width:56px;flex:none;min-width:0;padding:0 2px;font:11px ui-monospace,monospace;border:0!important;background:transparent!important;color:#777!important;-webkit-text-fill-color:#777!important}.lab .lp-body input.lp-mx{text-align:right}' +
    '.lab .lp-tt{padding:8px 10px 2px;font:12px system-ui;color:#555!important}.lab [data-c=table]{padding-bottom:8px}.lab [data-c=table] table{margin:0 4px;width:calc(100% - 8px)}';

  /* ---------- loading ---------- */
  function loadJS(u) { return new Promise(function (r, j) { var s = document.createElement('script'); s.src = u; s.onload = r; s.onerror = function () { j(new Error('load ' + u)); }; document.head.appendChild(s); }); }
  function loadCSS(u) { return new Promise(function (r) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; l.onload = r; l.onerror = r; document.head.appendChild(l); }); }
  var ready;
  function init() {
    if (ready) return ready;
    if (!document.getElementById('lab-css')) { var st = document.createElement('style'); st.id = 'lab-css'; st.textContent = CSS + CSS2 + CSS3; document.head.appendChild(st); }
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
  function mkEvAst(src, vn, ctx, names) { // every operator/function node must give a finite real number (so 1.7/(-Infinity) is NOT silently -0)
    vn = vn || 'x';
    var root = g.math.parse(src), subs = [];
    root.traverse(function (n) { if (n.type === 'OperatorNode' || n.type === 'FunctionNode') subs.push(n.compile()); });
    var full = root.compile();
    return function (x) {
      try {
        var sc = {}, i, v, k; if (ctx) { if (names) names.forEach(function (q) { sc[q] = ctx[q]; }); else for (k in ctx) sc[k] = ctx[k]; } sc[vn] = x;
        for (i = 0; i < subs.length; i++) { v = subs[i].evaluate(sc); if (typeof v !== 'number' || !isFinite(v)) return null; }
        v = full.evaluate(sc); return (typeof v === 'number' && isFinite(v)) ? v : null;
      } catch (e) { return null; }
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

  /* ---------- PLOT (Desmos-style: expression list on the left, graph on the right) ---------- */
  var COLS = ['#c74440', '#2d70b3', '#388c46', '#6042a6', '#000000', '#fa7e19'];
  function cleanSrc(s) { return String(s).replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, ''); }
  function plot(root, cfg) {
    root = el_(root); cfg = cfg || {};
    return init().then(function () {
      var list = (cfg.exprs || []).slice();
      if (cfg.expr) list.unshift(cfg.expr);
      (cfg.extra || []).forEach(function (e) { list.push(e.expr || e); });
      if (!list.length || list[list.length - 1] !== '') list.push('');
      var ICO = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 8 8 2l6 6M4 7v7h8V7" fill="none" stroke="#555" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
      mk(root, '<div class="lp"><div class="lp-left"><div class="lp-head"><button data-a="add" title="Dodaj wyra\u017cenie" style="font-size:18px;line-height:1;padding:2px 10px">+</button><span class="tag">Wyra\u017cenia</span><button data-a="iv" style="margin-left:auto">Zapis dziedziny</button><button data-a="hide" title="Schowaj list\u0119" style="font-size:16px;line-height:1;padding:2px 9px">\u00ab</button></div><div class="lp-list"></div><div class="lp-foot" style="display:none"></div></div><div class="lp-rs" title="Przeci\u0105gnij, by zmieni\u0107 szeroko\u015b\u0107 listy"></div>' +
        '<div class="lp-right"><canvas></canvas><div class="lp-hov"></div><button class="lp-show" data-a="show" title="Poka\u017c list\u0119" style="display:none"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 5h12M3 9h12M3 13h12" stroke="#555" stroke-width="2" stroke-linecap="round"/></svg></button><div class="lp-zoom"><button data-a="reset" title="Widok pocz\u0105tkowy">' + ICO + '</button></div><div class="lp-zoom" style="top:56px"><button data-a="in" title="Przybli\u017c">+</button><button data-a="out" title="Oddal">\u2212</button></div></div></div><div class="lp-hs" title="Przeci\u0105gnij, by zmieni\u0107 wysoko\u015b\u0107"></div>');
      root.classList.add('lab-pl');
      var lp = root.querySelector('.lp'), left = root.querySelector('.lp-left'), listEl = root.querySelector('.lp-list'), foot = root.querySelector('.lp-foot'),
        right = root.querySelector('.lp-right'), cv = root.querySelector('canvas'), hov = root.querySelector('.lp-hov'), rs = root.querySelector('.lp-rs'), hs = root.querySelector('.lp-hs'), showBtn = root.querySelector('.lp-show'), hidden = false;
      var X0 = (cfg.x || [-6, 6]).slice(), Y0 = (cfg.y || [-4, 4]).slice();
      var v = { x0: X0[0], x1: X0[1], y0: Y0[0], y1: Y0[1] };
      var H = cfg.height || 520, STRIP = cfg.domain === false ? 0 : 40, W = 600, ctx, dom = [], showIv = false, colorIdx = 0, rows = [], sel = null;
      function newRow(s) { var r = { src: s, color: COLS[colorIdx++ % COLS.length], vis: true, ev: null, tex: '', err: '' }; comp(r); return r; }
      function comp(r) {
        var s = cleanSrc(r.src).trim();
        if (!s) { r.ev = null; r.tex = ''; r.err = ''; return; }
        try { r.ev = mkEvAst(norm(s)); r.tex = tex(s); r.err = ''; } catch (e) { r.ev = null; r.tex = ''; r.err = 'Nie rozumiem wyra\u017cenia'; }
      }
      rows = list.map(newRow); sel = rows.filter(function (r) { return r.ev; })[0] || rows[0];
      function active() { return (sel && sel.ev) ? sel : (rows.filter(function (r) { return r.ev && r.vis; })[0] || null); }
      function buildRow(r, i) {
        var d = document.createElement('div'); d.className = 'lp-row' + (r === sel ? ' sel' : '');
        d.innerHTML = '<div class="lp-num"><span class="lp-n">' + (i + 1) + '</span><button class="lp-ico"></button></div><div class="lp-body"><div class="lp-disp"></div><input type="text" class="lp-in" spellcheck="false" autocomplete="off" autocapitalize="off"><div class="lp-err"></div></div><button class="lp-x" title="Usu\u0144">\u00d7</button>';
        var ico = d.querySelector('.lp-ico'), disp = d.querySelector('.lp-disp'), inp = d.querySelector('input'), err = d.querySelector('.lp-err');
        inp.value = r.src;
        function paintIco() { ico.style.setProperty('background', r.vis ? r.color : '#fff', 'important'); ico.style.border = '3px solid ' + r.color; ico.style.opacity = r.vis ? 1 : .6; }
        function show() {
          err.textContent = r.err;
          if (r.tex && document.activeElement !== inp) { disp.style.display = 'block'; kt(disp, r.tex); inp.style.display = 'none'; }
          else { disp.style.display = 'none'; inp.style.display = 'block'; }
        }
        paintIco(); show();
        disp.onclick = function () { inp.style.display = 'block'; disp.style.display = 'none'; inp.focus(); };
        inp.onfocus = function () { sel = r; listEl.querySelectorAll('.lp-row').forEach(function (e) { e.classList.remove('sel'); }); d.classList.add('sel'); draw(); };
        inp.onblur = function () { show(); };
        inp.oninput = function () {
          r.src = inp.value; comp(r); err.textContent = (r.err && r.src.trim()) ? r.err : '';
          if (r === rows[rows.length - 1] && r.src.trim()) { var nr = newRow(''); rows.push(nr); listEl.appendChild(buildRow(nr, rows.length - 1)); }
          draw();
        };
        inp.onkeydown = function (e) {
          if (e.key === 'Enter') { e.preventDefault(); var nxt = rows[rows.indexOf(r) + 1]; if (!nxt) { nxt = newRow(''); rows.push(nxt); } renderList(); var ins = listEl.querySelectorAll('input'); ins[rows.indexOf(nxt)].focus(); }
        };
        ico.onclick = function () { r.vis = !r.vis; paintIco(); draw(); };
        d.querySelector('.lp-x').onclick = function () {
          if (rows.length <= 1) { r.src = ''; comp(r); inp.value = ''; show(); draw(); return; }
          rows.splice(rows.indexOf(r), 1); if (sel === r) sel = rows.filter(function (q) { return q.ev; })[0] || rows[0];
          if (rows[rows.length - 1].src.trim()) rows.push(newRow('')); renderList(); draw();
        };
        return d;
      }
      function renderList() { listEl.innerHTML = ''; rows.forEach(function (r, i) { listEl.appendChild(buildRow(r, i)); }); }
      renderList();
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
      function grid(step, color, wd) {
        var t; ctx.strokeStyle = color; ctx.lineWidth = wd; ctx.beginPath();
        for (t = Math.ceil(v.x0 / step) * step; t <= v.x1; t += step) { ctx.moveTo(Math.round(X(t)) + .5, 0); ctx.lineTo(Math.round(X(t)) + .5, H); }
        for (t = Math.ceil(v.y0 / step) * step; t <= v.y1; t += step) { ctx.moveTo(0, Math.round(Y(t)) + .5); ctx.lineTo(W, Math.round(Y(t)) + .5); }
        ctx.stroke();
      }
      function draw() {
        lp.classList.toggle('narrow', root.clientWidth < 560);
        var narrow = lp.classList.contains('narrow');
        left.style.height = narrow ? '' : (H + STRIP) + 'px';
        W = Math.max(240, right.clientWidth || 400);
        if (cfg.square !== false) { var ys = (v.x1 - v.x0) * H / W, cy = (v.y0 + v.y1) / 2; v.y0 = cy - ys / 2; v.y1 = cy + ys / 2; }
        ctx = setupCanvas(cv, W, H + STRIP);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H + STRIP);
        var s = nice(v.x1 - v.x0, W / 90), t;
        var sMinor = s / 5, sMajor = s;
        if ((v.x1 - v.x0) / sMinor < W / 6) grid(sMinor, '#ececec', 1);
        grid(sMajor, '#c8c8c8', 1);
        var ax = Math.max(0, Math.min(W, X(0))), ay = Math.max(0, Math.min(H, Y(0)));
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke();
        ctx.fillStyle = '#444'; ctx.font = '12px system-ui,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (t = Math.ceil(v.x0 / s) * s; t <= v.x1; t += s) { if (Math.abs(t) < s / 1e3 || X(t) < 14 || X(t) > W - 14) continue; ctx.fillText(fmt(+t.toFixed(10)), X(t), Math.min(H - 15, ay + 4)); }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (t = Math.ceil(v.y0 / s) * s; t <= v.y1; t += s) { if (Math.abs(t) < s / 1e3 || Y(t) < 9 || Y(t) > H - 9) continue; ctx.fillText(fmt(+t.toFixed(10)), Math.max(30, ax - 5), Y(t)); }
        rows.forEach(function (r) { if (r.ev && r.vis) curve(r.ev, r.color, 2.6); });
        var a = active();
        if (STRIP) {
          ctx.fillStyle = '#f5f8fc'; ctx.fillRect(0, H, W, STRIP); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, H + .5); ctx.lineTo(W, H + .5); ctx.stroke();
          dom = a ? domain(a.ev, v.x0, v.x1, Math.round(2 * W)) : [];
          var yy = H + 24, col = a ? a.color : C.blue; ctx.fillStyle = '#555'; ctx.font = 'italic 13px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('D', 7, H + 9);
          dom.forEach(function (d) {
            var xa = X(d.a), xb = X(d.b); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xb, yy); ctx.stroke();
            [[xa, d.ea, d.ca], [xb, d.eb, d.cb]].forEach(function (p) {
              if (p[1]) return;
              ctx.setLineDash([3, 3]); ctx.strokeStyle = col; ctx.globalAlpha = .45; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], yy); ctx.lineTo(p[0], 0); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
              ctx.beginPath(); ctx.arc(p[0], yy, 5, 0, 7); ctx.fillStyle = p[2] ? col : '#fff'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
            });
          });
        }
        if (showIv) { foot.style.display = 'block'; kt(foot, a ? 'D=' + ivTex(dom) + '\\ \\ \\text{(w oknie } x\\in[' + fmt(v.x0) + ',' + fmt(v.x1) + ']\\text{)}' : '\\text{wpisz wyra\u017cenie}'); } else foot.style.display = 'none';
      }
      function zoomAt(px, py, f) {
        var xm = v.x0 + px / W * (v.x1 - v.x0), ym = v.y1 - py / H * (v.y1 - v.y0), sp = (v.x1 - v.x0) * f;
        if (sp < 1e-6 || sp > 1e9) return;
        v.x0 = xm - (xm - v.x0) * f; v.x1 = xm + (v.x1 - xm) * f; v.y0 = ym - (ym - v.y0) * f; v.y1 = ym + (v.y1 - ym) * f;
      }
      root.querySelectorAll('button[data-a]').forEach(function (b) {
        b.onclick = function () {
          var a = b.dataset.a;
          if (a === 'in') { zoomAt(W / 2, H / 2, .7); draw(); } else if (a === 'out') { zoomAt(W / 2, H / 2, 1 / .7); draw(); }
          else if (a === 'reset') { v = { x0: X0[0], x1: X0[1], y0: Y0[0], y1: Y0[1] }; draw(); }
          else if (a === 'add') { var nr = newRow(''); rows.push(nr); renderList(); listEl.querySelectorAll('input')[rows.length - 1].focus(); }
          else if (a === 'hide' || a === 'show') { hidden = (a === 'hide'); left.classList.toggle('hidden', hidden); rs.classList.toggle('hidden', hidden); showBtn.style.display = hidden ? 'flex' : 'none'; draw(); }
          else if (a === 'iv') { showIv = !showIv; b.textContent = showIv ? 'Ukryj zapis' : 'Zapis dziedziny'; draw(); }
        };
      });
      /* touchpad: two-finger scroll and pinch zoom around the cursor; drag = pan */
      cv.addEventListener('wheel', function (e) {
        e.preventDefault(); var r = cv.getBoundingClientRect(), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(dy * (e.ctrlKey ? .012 : .003))); draw();
      }, { passive: false });
      var gs = 1;
      cv.addEventListener('gesturestart', function (e) { e.preventDefault(); gs = 1; });
      cv.addEventListener('gesturechange', function (e) { e.preventDefault(); var r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, gs / e.scale); gs = e.scale; draw(); });
      var ptr = {}, last = null, pd = 0;
      function np() { return Object.keys(ptr).length; }
      cv.addEventListener('pointerdown', function (e) { ptr[e.pointerId] = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); last = [e.clientX, e.clientY]; if (np() === 2) { var k = Object.keys(ptr); pd = Math.hypot(ptr[k[0]][0] - ptr[k[1]][0], ptr[k[0]][1] - ptr[k[1]][1]); } });
      function up(e) { delete ptr[e.pointerId]; var k = Object.keys(ptr); last = k.length ? ptr[k[0]].slice() : null; }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect();
        if (ptr[e.pointerId]) {
          ptr[e.pointerId] = [e.clientX, e.clientY];
          if (np() === 2) {
            var k = Object.keys(ptr), d = Math.hypot(ptr[k[0]][0] - ptr[k[1]][0], ptr[k[0]][1] - ptr[k[1]][1]);
            if (pd > 0 && d > 0) { zoomAt((ptr[k[0]][0] + ptr[k[1]][0]) / 2 - r.left, (ptr[k[0]][1] + ptr[k[1]][1]) / 2 - r.top, pd / d); draw(); } pd = d;
          } else if (np() === 1 && last) {
            var kx = (v.x1 - v.x0) / W, ky = (v.y1 - v.y0) / H, dx = e.clientX - last[0], dy = e.clientY - last[1];
            v.x0 -= dx * kx; v.x1 -= dx * kx; v.y0 += dy * ky; v.y1 += dy * ky; last = [e.clientX, e.clientY]; draw();
          }
        } else {
          var a = active(); if (!a) { hov.textContent = ''; return; }
          var x = v.x0 + (e.clientX - r.left) / r.width * (v.x1 - v.x0), y = a.ev(x);
          hov.textContent = 'x = ' + fmt(x) + '   y = ' + (y === null ? '\u2014' : fmt(y));
        }
      });
      function dragger(el, onmove) {
        el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.setPointerCapture(e.pointerId); var sx = e.clientX, sy = e.clientY, w0 = left.getBoundingClientRect().width, h0 = H;
          function mv(ev) { onmove(ev.clientX - sx, ev.clientY - sy, w0, h0); draw(); }
          function end() { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', end); el.removeEventListener('pointercancel', end); }
          el.addEventListener('pointermove', mv); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); });
      }
      dragger(rs, function (dx, dy, w0) { var w = Math.max(150, Math.min(root.clientWidth - 220, w0 + dx)); left.style.width = w + 'px'; left.style.maxWidth = 'none'; left.style.minWidth = '150px'; });
      dragger(hs, function (dx, dy, w0, h0) { H = Math.max(260, Math.min(1400, h0 + dy)); });
      cv.addEventListener('pointerleave', function () { hov.textContent = ''; });
      if (g.ResizeObserver) new ResizeObserver(function () { if (Math.abs((right.clientWidth || 400) - W) > 2 || (root.clientWidth < 560) !== lp.classList.contains('narrow')) draw(); }).observe(root);
      draw();
      return { domain: function () { return dom; }, rows: rows };
    });
  }

  /* ---------- SEQ LAB (same Desmos-style layout; free variables other than n become sliders automatically) ---------- */
  var KNOWN = { e: 1, pi: 1, tau: 1, phi: 1, i: 1, Infinity: 1, NaN: 1, n: 1 };
  function freeVars(src) {
    var names = {};
    try { g.math.parse(src).traverse(function (nd, path, parent) { if (nd.type === 'SymbolNode' && !(parent && parent.type === 'FunctionNode' && path === 'fn') && !KNOWN[nd.name] && typeof g.math[nd.name] !== 'function') names[nd.name] = 1; }); } catch (e) { }
    return Object.keys(names);
  }
  function seq(root, cfg) {
    root = el_(root); cfg = cfg || {};
    return init().then(function () {
      var list = (cfg.exprs || []).slice();
      if (cfg.expr) list.unshift(cfg.expr);
      if (!list.length || list[list.length - 1] !== '') list.push('');
      var P = cfg.params || {}, vals = {}, pdef = {}, nmax = cfg.nmax || 10000, tbl = cfg.table || [10, 100, 1000, 1e4, 1e5, 1e6], logMode = cfg.log !== false, name = cfg.name || 'a_n';
      var ICO = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 8 8 2l6 6M4 7v7h8V7" fill="none" stroke="#555" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
      var ICOY = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2v12M5 5l3-3 3 3M5 11l3 3 3-3" fill="none" stroke="#555" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
      mk(root, '<div class="lp"><div class="lp-left"><div class="lp-head"><button data-a="add" title="Dodaj ci\u0105g" style="font-size:18px;line-height:1;padding:2px 10px">+</button><span class="tag">Ci\u0105gi</span><button data-a="log" style="margin-left:auto">n: log</button><button data-a="hide" title="Schowaj list\u0119" style="font-size:16px;line-height:1;padding:2px 9px">\u00ab</button></div><div class="lp-list"><div data-c="rows"></div><div data-c="params"></div><div data-c="guess"></div><div data-c="table"></div></div></div><div class="lp-rs" title="Przeci\u0105gnij, by zmieni\u0107 szeroko\u015b\u0107 listy"></div>' +
        '<div class="lp-right"><canvas></canvas><div class="lp-hov"></div><button class="lp-show" data-a="show" title="Poka\u017c list\u0119" style="display:none"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 5h12M3 9h12M3 13h12" stroke="#555" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<div class="lp-zoom"><button data-a="reset" title="Widok pocz\u0105tkowy">' + ICO + '</button><button data-a="fit" title="Dopasuj o\u015b y">' + ICOY + '</button></div><div class="lp-zoom" style="top:100px"><button data-a="in" title="Przybli\u017c">+</button><button data-a="out" title="Oddal">\u2212</button></div></div></div><div class="lp-hs" title="Przeci\u0105gnij, by zmieni\u0107 wysoko\u015b\u0107"></div>');
      root.classList.add('lab-pl');
      var $ = function (s) { return root.querySelector(s); };
      var lp = $('.lp'), left = $('.lp-left'), rowsC = $('[data-c=rows]'), parC = $('[data-c=params]'), guessC = $('[data-c=guess]'), tabC = $('[data-c=table]'), right = $('.lp-right'), cv = $('canvas'), hov = $('.lp-hov'), rs = $('.lp-rs'), hs = $('.lp-hs'), showBtn = $('.lp-show'), logBtn = $('button[data-a=log]');
      var H = cfg.height || 520, W = 600, ctx, hidden = false, colorIdx = 0, rows = [], sel = null, L = null, userY = false;
      var saved = { log: [-.15, Math.log10(nmax) + .1], lin: [-nmax * .03, nmax * 1.03] };
      var v = { x0: saved[logMode ? 'log' : 'lin'][0], x1: saved[logMode ? 'log' : 'lin'][1], y0: 0, y1: 1 };
      function nOf(u) { return logMode ? Math.pow(10, u) : u; }
      function U(n) { return logMode ? Math.log10(n) : n; }
      function ensure(k) { if (!(k in vals)) { pdef[k] = P[k] || { min: -10, max: 10, step: 0.1, val: 1 }; vals[k] = pdef[k].val !== undefined ? pdef[k].val : pdef[k].min; } }
      function newRow(s) { var r = { src: s, color: COLS[colorIdx++ % COLS.length], vis: true, ev: null, tex: '', err: '', vars: [] }; comp(r); return r; }
      function comp(r) {
        var s = cleanSrc(r.src).trim(); r.vars = [];
        if (!s) { r.ev = null; r.tex = ''; r.err = ''; return; }
        try { var ns = norm(s); r.vars = freeVars(ns); r.vars.forEach(ensure); r.ev = mkEvAst(ns, 'n', vals, r.vars); r.tex = tex(s); r.err = ''; } catch (e) { r.ev = null; r.tex = ''; r.err = 'Nie rozumiem wyra\u017cenia'; }
      }
      rows = list.map(newRow); sel = rows.filter(function (r) { return r.ev; })[0] || rows[0];
      function active() { return (sel && sel.ev) ? sel : (rows.filter(function (r) { return r.ev && r.vis; })[0] || null); }
      function usedVars() { var o = {}; rows.forEach(function (r) { r.vars.forEach(function (k) { o[k] = 1; }); }); return Object.keys(o); }
      function fmtN(y) { return Math.abs(y) >= 1e7 || (y !== 0 && Math.abs(y) < 1e-6) ? y.toExponential(4) : y.toFixed(6); }
      /* ---- list: expression rows ---- */
      function buildRow(r, i) {
        var d = document.createElement('div'); d.className = 'lp-row' + (r === sel ? ' sel' : '');
        d.innerHTML = '<div class="lp-num"><span class="lp-n">' + (i + 1) + '</span><button class="lp-ico"></button></div><div class="lp-body"><div class="lp-disp"></div><input type="text" class="lp-in" spellcheck="false" autocomplete="off" autocapitalize="off"><div class="lp-err"></div></div><button class="lp-x" title="Usu\u0144">\u00d7</button>';
        var ico = d.querySelector('.lp-ico'), disp = d.querySelector('.lp-disp'), inp = d.querySelector('input'), err = d.querySelector('.lp-err');
        inp.value = r.src;
        function paintIco() { ico.style.setProperty('background', r.vis ? r.color : '#fff', 'important'); ico.style.border = '3px solid ' + r.color; ico.style.opacity = r.vis ? 1 : .6; }
        function show() {
          err.textContent = r.err;
          if (r.tex && document.activeElement !== inp) { disp.style.display = 'block'; kt(disp, name + '=' + r.tex); inp.style.display = 'none'; } else { disp.style.display = 'none'; inp.style.display = 'block'; }
        }
        paintIco(); show();
        disp.onclick = function () { inp.style.display = 'block'; disp.style.display = 'none'; inp.focus(); };
        inp.onfocus = function () { sel = r; rowsC.querySelectorAll('.lp-row').forEach(function (e) { e.classList.remove('sel'); }); d.classList.add('sel'); draw(); };
        inp.onblur = show;
        inp.oninput = function () {
          r.src = inp.value; comp(r); err.textContent = (r.err && r.src.trim()) ? r.err : '';
          if (r === rows[rows.length - 1] && r.src.trim()) { var nr = newRow(''); rows.push(nr); rowsC.appendChild(buildRow(nr, rows.length - 1)); }
          buildParams(); if (!userY) fitY(); draw();
        };
        inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); var nxt = rows[rows.indexOf(r) + 1]; if (!nxt) { nxt = newRow(''); rows.push(nxt); } renderRows(); rowsC.querySelectorAll('input')[rows.indexOf(nxt)].focus(); } };
        ico.onclick = function () { r.vis = !r.vis; paintIco(); if (!userY) fitY(); draw(); };
        d.querySelector('.lp-x').onclick = function () {
          if (rows.length <= 1) { r.src = ''; comp(r); inp.value = ''; show(); buildParams(); draw(); return; }
          rows.splice(rows.indexOf(r), 1); if (sel === r) sel = rows.filter(function (q) { return q.ev; })[0] || rows[0];
          if (rows[rows.length - 1].src.trim()) rows.push(newRow('')); renderRows(); buildParams(); if (!userY) fitY(); draw();
        };
        return d;
      }
      function renderRows() { rowsC.innerHTML = ''; rows.forEach(function (r, i) { rowsC.appendChild(buildRow(r, i)); }); }
      /* ---- list: sliders for free variables ---- */
      function buildParams() {
        var used = usedVars(), have = Array.prototype.map.call(parC.children, function (c) { return c.dataset.k; });
        if (used.join() === have.join()) return;
        parC.innerHTML = '';
        used.forEach(function (k) {
          var def = pdef[k], d = document.createElement('div'); d.className = 'lp-row'; d.dataset.k = k;
          d.innerHTML = '<div class="lp-num"></div><div class="lp-body"><div class="lp-ph"><span class="lp-pk"></span><span>=</span><input type="text" class="lp-val"></div><input type="range" class="lp-rg"><div class="lp-mm"><input type="text" class="lp-mn"><input type="text" class="lp-mx"></div></div>';
          var rg = d.querySelector('.lp-rg'), vi = d.querySelector('.lp-val'), mn = d.querySelector('.lp-mn'), mx = d.querySelector('.lp-mx');
          kt(d.querySelector('.lp-pk'), k);
          rg.min = def.min; rg.max = def.max; rg.step = def.step || 0.1; rg.value = vals[k]; vi.value = fmt(vals[k]); mn.value = def.min; mx.value = def.max;
          rg.oninput = function () { vals[k] = +rg.value; vi.value = fmt(vals[k]); if (!userY) fitY(); draw(); };
          vi.onchange = function () { var x = parseFloat(String(vi.value).replace(',', '.')); if (isFinite(x)) { vals[k] = x; if (x < +rg.min) { rg.min = x; mn.value = x; def.min = x; } if (x > +rg.max) { rg.max = x; mx.value = x; def.max = x; } rg.value = x; if (!userY) fitY(); draw(); } };
          mn.onchange = function () { var x = parseFloat(mn.value); if (isFinite(x)) { rg.min = x; def.min = x; } };
          mx.onchange = function () { var x = parseFloat(mx.value); if (isFinite(x)) { rg.max = x; def.max = x; } };
          parC.appendChild(d);
        });
      }
      /* ---- list: guess row ---- */
      if (cfg.guess !== false) {
        guessC.innerHTML = '<div class="lp-row"><div class="lp-num"></div><div class="lp-body"><div class="lp-ph"><span class="lp-pk"><i>L</i></span><span>=</span><input type="text" class="lp-in lp-gi" placeholder="Tw\u00f3j typ granicy, np. e^2" spellcheck="false" autocomplete="off"></div><div class="lp-err lp-gerr"></div></div></div>';
        var gi = guessC.querySelector('.lp-gi'), gerr = guessC.querySelector('.lp-gerr');
        gi.oninput = function () { L = null; gerr.textContent = ''; if (gi.value.trim()) { try { var q = g.math.evaluate(norm(gi.value)); if (typeof q === 'number' && isFinite(q)) L = q; else gerr.textContent = 'to nie jest liczba'; } catch (e) { gerr.textContent = 'Nie rozumiem wyra\u017cenia'; } } if (!userY) fitY(); draw(); };
      }
      function X(u) { return (u - v.x0) / (v.x1 - v.x0) * W; }
      function Y(y) { return (v.y1 - y) / (v.y1 - v.y0) * H; }
      function visibleN() { return [Math.max(1, Math.floor(nOf(v.x0))), Math.min(1e12, Math.ceil(nOf(v.x1)))]; }
      function fitY() {
        var vn = visibleN(), a = vn[0], b = vn[1], ns = [], i, lo = Infinity, hi = -Infinity;
        if (b - a < 400) for (i = a; i <= b; i++) ns.push(i); else for (i = 0; i <= 400; i++) ns.push(Math.round(logMode ? Math.pow(10, Math.log10(a) + (Math.log10(b) - Math.log10(a)) * i / 400) : a + (b - a) * i / 400));
        rows.forEach(function (r) { if (!r.ev || !r.vis) return; ns.forEach(function (n) { var y = r.ev(n); if (y !== null) { if (y < lo) lo = y; if (y > hi) hi = y; } }); });
        if (L !== null) { lo = Math.min(lo, L); hi = Math.max(hi, L); }
        if (!isFinite(lo)) { lo = 0; hi = 1; } if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
        var pad = (hi - lo) * .12; v.y0 = lo - pad; v.y1 = hi + pad;
      }
      function pts(r) {
        var out = [], last = -1;
        for (var px = 0; px <= W; px++) { var n = Math.round(nOf(v.x0 + px / W * (v.x1 - v.x0))); if (n < 1 || n > 1e12 || n === last) continue; last = n; var y = r.ev(n); out.push(y === null ? null : [n, y]); }
        return out;
      }
      function pow10(k, x, y) { ctx.textAlign = 'right'; ctx.fillText('10', x, y); ctx.font = '9px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(String(k), x + 1, y - 5); ctx.font = '12px system-ui,sans-serif'; }
      function draw() {
        lp.classList.toggle('narrow', root.clientWidth < 560);
        left.style.height = lp.classList.contains('narrow') ? '' : H + 'px';
        W = Math.max(240, right.clientWidth || 400);
        ctx = setupCanvas(cv, W, H); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        var t, k, s, ax = Math.max(0, Math.min(W, X(logMode ? 0 : 0))), sy = nice(v.y1 - v.y0, H / 90);
        function line(x1, y1, x2, y2) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
        /* minor + major grid */
        ctx.lineWidth = 1; ctx.strokeStyle = '#ececec'; ctx.beginPath();
        for (t = Math.ceil(v.y0 / (sy / 5)) * (sy / 5); t <= v.y1; t += sy / 5) line(0, Math.round(Y(t)) + .5, W, Math.round(Y(t)) + .5);
        if (logMode) { if (v.x1 - v.x0 <= 3.6) for (k = Math.floor(v.x0) - 1; k <= Math.ceil(v.x1); k++) for (var m = 2; m <= 9; m++) { var xx = X(k + Math.log10(m)); line(Math.round(xx) + .5, 0, Math.round(xx) + .5, H); } }
        else { s = nice(v.x1 - v.x0, W / 90); for (t = Math.ceil(v.x0 / (s / 5)) * (s / 5); t <= v.x1; t += s / 5) line(Math.round(X(t)) + .5, 0, Math.round(X(t)) + .5, H); }
        ctx.stroke(); ctx.strokeStyle = '#c8c8c8'; ctx.beginPath();
        for (t = Math.ceil(v.y0 / sy) * sy; t <= v.y1; t += sy) line(0, Math.round(Y(t)) + .5, W, Math.round(Y(t)) + .5);
        if (logMode) for (k = Math.floor(v.x0); k <= Math.ceil(v.x1); k++) line(Math.round(X(k)) + .5, 0, Math.round(X(k)) + .5, H);
        else for (t = Math.ceil(v.x0 / s) * s; t <= v.x1; t += s) line(Math.round(X(t)) + .5, 0, Math.round(X(t)) + .5, H);
        ctx.stroke();
        var ay = Math.max(0, Math.min(H, Y(0)));
        ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5; ctx.beginPath(); line(0, ay, W, ay); line(ax, 0, ax, H); ctx.stroke();
        ctx.fillStyle = '#444'; ctx.font = '12px system-ui,sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
        var ly = Math.min(H - 18, ay + 4);
        if (logMode) { for (k = Math.floor(v.x0); k <= Math.ceil(v.x1); k++) { var px = X(k); if (px < 16 || px > W - 16) continue; if (k === 0) { ctx.textAlign = 'center'; ctx.fillText('1', px, ly); } else if (k === 1) { ctx.textAlign = 'center'; ctx.fillText('10', px, ly); } else { ctx.textBaseline = 'alphabetic'; pow10(k, px + 8, ly + 12); ctx.textBaseline = 'top'; } } }
        else for (t = Math.ceil(v.x0 / s) * s; t <= v.x1; t += s) { if (Math.abs(t) < s / 1e3 || X(t) < 14 || X(t) > W - 14) continue; ctx.fillText(fmt(+t.toFixed(10)), X(t), ly); }
        ctx.textBaseline = 'middle'; var yl = ax < 36; ctx.textAlign = yl ? 'left' : 'right';
        for (t = Math.ceil(v.y0 / sy) * sy; t <= v.y1; t += sy) { if (Math.abs(t) < sy / 1e3 || Y(t) < 9 || Y(t) > H - 24) continue; ctx.fillText(fmt(+t.toFixed(10)), yl ? ax + 6 : ax - 5, Y(t)); }
        ctx.fillStyle = '#666'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(logMode ? 'n  (skala logarytmiczna)' : 'n', W - 8, H - 24);
        if (L !== null) { ctx.setLineDash([7, 5]); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath(); line(0, Y(L), W, Y(L)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = C.blue; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('L = ' + fmt(L), 8, Y(L) - 3); }
        rows.forEach(function (r) {
          if (!r.ev || !r.vis) return; var p = pts(r), pen = false;
          ctx.strokeStyle = r.color; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath();
          p.forEach(function (q) { if (!q) { pen = false; return; } var yy = Math.max(-1e5, Math.min(1e5, Y(q[1]))); if (pen) ctx.lineTo(X(U(q[0])), yy); else ctx.moveTo(X(U(q[0])), yy); pen = true; }); ctx.stroke();
          if (p.length < W / 6) { ctx.fillStyle = r.color; p.forEach(function (q) { if (q) { ctx.beginPath(); ctx.arc(X(U(q[0])), Y(q[1]), 3.2, 0, 7); ctx.fill(); } }); }
        });
        var a = active();
        if (a) tbl.forEach(function (n) { var y = a.ev(n); if (y === null) return; var xx = X(U(n)); if (xx < 0 || xx > W) return; ctx.fillStyle = '#fff'; ctx.strokeStyle = a.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xx, Y(y), 4.5, 0, 7); ctx.fill(); ctx.stroke(); });
        var sub = name.indexOf('_') >= 0 ? name.replace('_', '<sub>') + '</sub>' : name, h = '<div class="lp-tt">Tabela dla zaznaczonego ci\u0105gu</div><table><tr><th>n</th><th>' + sub + '</th>' + (L !== null ? '<th>|' + sub + ' \u2212 L|</th>' : '') + '</tr>';
        tbl.forEach(function (n) { var y = a ? a.ev(n) : null; h += '<tr><td>' + n.toLocaleString('en-US').replace(/,/g, ' ') + '</td><td>' + (y === null ? '\u2014' : fmtN(y)) + '</td>' + (L !== null ? '<td>' + (y === null ? '\u2014' : fmt(Math.abs(y - L))) + '</td>' : '') + '</tr>'; });
        tabC.innerHTML = h + '</table>';
      }
      function zoomAt(px, py, f) {
        var xm = v.x0 + px / W * (v.x1 - v.x0), ym = v.y1 - py / H * (v.y1 - v.y0);
        v.x0 = xm - (xm - v.x0) * f; v.x1 = xm + (v.x1 - xm) * f; v.y0 = ym - (ym - v.y0) * f; v.y1 = ym + (v.y1 - ym) * f; userY = true;
      }
      function resetView() { saved = { log: [-.15, Math.log10(nmax) + .1], lin: [-nmax * .03, nmax * 1.03] }; v.x0 = saved[logMode ? 'log' : 'lin'][0]; v.x1 = saved[logMode ? 'log' : 'lin'][1]; userY = false; fitY(); }
      root.querySelectorAll('button[data-a]').forEach(function (b) {
        b.onclick = function () {
          var a = b.dataset.a;
          if (a === 'in') { zoomAt(W / 2, H / 2, .7); draw(); } else if (a === 'out') { zoomAt(W / 2, H / 2, 1 / .7); draw(); }
          else if (a === 'reset') { resetView(); draw(); }
          else if (a === 'fit') { userY = false; fitY(); draw(); }
          else if (a === 'log') { saved[logMode ? 'log' : 'lin'] = [v.x0, v.x1]; logMode = !logMode; v.x0 = saved[logMode ? 'log' : 'lin'][0]; v.x1 = saved[logMode ? 'log' : 'lin'][1]; b.textContent = logMode ? 'n: log' : 'n: lin'; fitY(); userY = false; draw(); }
          else if (a === 'hide' || a === 'show') { hidden = (a === 'hide'); left.classList.toggle('hidden', hidden); rs.classList.toggle('hidden', hidden); showBtn.style.display = hidden ? 'flex' : 'none'; draw(); }
          else if (a === 'add') { var nr = newRow(''); rows.push(nr); renderRows(); rowsC.querySelectorAll('input')[rows.length - 1].focus(); }
        };
      });
      cv.addEventListener('wheel', function (e) { e.preventDefault(); var r = cv.getBoundingClientRect(), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(dy * (e.ctrlKey ? .012 : .003))); draw(); }, { passive: false });
      var gs = 1;
      cv.addEventListener('gesturestart', function (e) { e.preventDefault(); gs = 1; });
      cv.addEventListener('gesturechange', function (e) { e.preventDefault(); var r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, gs / e.scale); gs = e.scale; draw(); });
      var ptr = {}, last = null, pd = 0;
      function np() { return Object.keys(ptr).length; }
      cv.addEventListener('pointerdown', function (e) { ptr[e.pointerId] = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); last = [e.clientX, e.clientY]; if (np() === 2) { var k = Object.keys(ptr); pd = Math.hypot(ptr[k[0]][0] - ptr[k[1]][0], ptr[k[0]][1] - ptr[k[1]][1]); } });
      function up(e) { delete ptr[e.pointerId]; var k = Object.keys(ptr); last = k.length ? ptr[k[0]].slice() : null; }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect();
        if (ptr[e.pointerId]) {
          ptr[e.pointerId] = [e.clientX, e.clientY];
          if (np() === 2) { var k = Object.keys(ptr), d = Math.hypot(ptr[k[0]][0] - ptr[k[1]][0], ptr[k[0]][1] - ptr[k[1]][1]); if (pd > 0 && d > 0) { zoomAt((ptr[k[0]][0] + ptr[k[1]][0]) / 2 - r.left, (ptr[k[0]][1] + ptr[k[1]][1]) / 2 - r.top, pd / d); draw(); } pd = d; }
          else if (np() === 1 && last) { var kx = (v.x1 - v.x0) / W, ky = (v.y1 - v.y0) / H, dx = e.clientX - last[0], dy = e.clientY - last[1]; v.x0 -= dx * kx; v.x1 -= dx * kx; v.y0 += dy * ky; v.y1 += dy * ky; last = [e.clientX, e.clientY]; userY = true; draw(); }
        } else {
          var a = active(); if (!a) { hov.textContent = ''; return; }
          var n = Math.round(nOf(v.x0 + (e.clientX - r.left) / r.width * (v.x1 - v.x0)));
          if (n < 1) { hov.textContent = ''; return; } var y = a.ev(n); hov.textContent = 'n = ' + n + '   ' + name.replace('_', '') + ' = ' + (y === null ? '\u2014' : fmtN(y));
        }
      });
      cv.addEventListener('pointerleave', function () { hov.textContent = ''; });
      function dragger(el, onmove) {
        el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.setPointerCapture(e.pointerId); var sx = e.clientX, sy = e.clientY, w0 = left.getBoundingClientRect().width, h0 = H;
          function mv(ev) { onmove(ev.clientX - sx, ev.clientY - sy, w0, h0); draw(); }
          function end() { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', end); el.removeEventListener('pointercancel', end); }
          el.addEventListener('pointermove', mv); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); });
      }
      dragger(rs, function (dx, dy, w0) { var w = Math.max(150, Math.min(root.clientWidth - 220, w0 + dx)); left.style.width = w + 'px'; left.style.maxWidth = 'none'; left.style.minWidth = '150px'; });
      dragger(hs, function (dx, dy, w0, h0) { H = Math.max(260, Math.min(1400, h0 + dy)); });
      if (g.ResizeObserver) new ResizeObserver(function () { if (Math.abs((right.clientWidth || 400) - W) > 2 || (root.clientWidth < 560) !== lp.classList.contains('narrow')) draw(); }).observe(root);
      renderRows(); buildParams(); fitY(); draw();
      return { set: function (o) { Object.assign(vals, o); if (!userY) fitY(); draw(); } };
    });
  }

  /* ---------- auto-mount ---------- */
  function auto() {
    document.querySelectorAll('[data-lab]').forEach(function (d) {
      if (d.dataset.labDone) return; d.dataset.labDone = '1';
      var cfg = {}; try { if (d.dataset.config) cfg = JSON.parse(d.dataset.config); } catch (e) { }
      if (d.dataset.expr) cfg.expr = d.dataset.expr;
      try { if (d.dataset.exprs) cfg.exprs = JSON.parse(d.dataset.exprs); } catch (e) { }
      (d.dataset.lab === 'seq' ? seq : plot)(d, cfg).catch(function (e) { d.textContent = 'lab.js: ' + e.message; });
    });
  }
  g.Lab = { version: '1.4', plot: plot, seq: seq, auto: auto, norm: norm, tex: function (s) { return init().then(function () { return tex(s); }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
