/**
 * deck-kit.js — presenter layer that works on top of every template.
 *
 * Drop it in after the deck's own script:
 *   <script src="deck-kit.js"></script>
 *
 * It finds the deck in one of three ways, in this order:
 *   1. <deck-stage>                — uses the element's goTo()/index API.
 *   2. window.deckAdapter          — { go(i), index(), slides?, touch? } set by
 *                                    templates that ship their own navigation.
 *   3. generic fallback            — top-level `.slide` elements, current slide
 *                                    = the one with .active / .is-active.
 *
 * Adds, without touching the template's design:
 *  (a) speaker notes panel (N) — reads <aside class="notes"> inside a slide,
 *      a data-notes attribute, or the #speaker-notes JSON array.
 *  (b) slide menu (M) grouped by data-sec, with planned start minute when
 *      slides carry data-min. Click a row to jump.
 *  (c) talk timer (T, Shift+T resets, click to pause) — elapsed time against
 *      the data-min plan, coloured ahead / on time / behind. Starts on the
 *      first move away from slide 1.
 *  (d) thin progress bar driven by planned time (only when data-min is set).
 *  (e) fullscreen (F), shortcut help (?), Esc closes overlays.
 *  (f) #N deep links for templates that don't keep the hash themselves.
 *  (g) swipe left/right on touch screens, and a "rotate to landscape" hint.
 *  (h) arrow keys on sliders / inputs adjust the control instead of
 *      changing slide.
 *  (i) interactive widgets — DeckKit.widget(slide, {enter, leave, tick, draw,
 *      print}). Only the visible slide ticks; draw() reruns on resize.
 *      DeckKit.canvas(el) sizes a <canvas> for crisp drawing in CSS pixels.
 *  (j) [data-reveal="id"] buttons toggle a hidden answer;
 *      [data-countdown="5:00"] elements are click-to-start countdowns.
 *  (k) print — Print → Save as PDF gives one slide per page for every
 *      template, and <canvas> drawings are kept (snapshotted to images,
 *      including slides never visited).
 *
 * Slide metadata (all optional):
 *   data-title="..."  menu / notes title (falls back to data-label or heading)
 *   data-sec="..."    section name for the menu
 *   data-min="3"      planned minutes for the slide
 *
 * UI strings follow <html lang>: Vietnamese for "vi", English otherwise.
 */

(() => {
  if (window.DeckKit) return;

  const STR = {
    en: {
      notes: 'Speaker notes', noNotes: 'No notes for this slide.', next: 'Next',
      menu: 'Slides', min: 'min', planned: 'planned {m} min', startsAt: 'starts at min {s}',
      elapsed: 'Elapsed', ahead: 'ahead', behind: 'behind', onTime: 'on time', paused: 'paused',
      rotate: 'Rotate your phone to landscape for the best view', close: 'Close',
      reveal: 'Show answer', hide: 'Hide answer',
      help: 'Shortcuts', helpHint: 'Press ? for presenter shortcuts',
      keys: [['← →', 'Previous / next slide'], ['N', 'Speaker notes'], ['M', 'Slide menu'],
        ['T', 'Talk timer (Shift+T reset)'], ['F', 'Fullscreen'], ['Esc', 'Close panels'], ['?', 'This help']],
    },
    vi: {
      notes: 'Ghi chú người nói', noNotes: 'Slide này không có ghi chú.', next: 'Tiếp theo',
      menu: 'Các slide', min: 'phút', planned: 'dự kiến {m} phút', startsAt: 'bắt đầu ở phút {s}',
      elapsed: 'Đã nói', ahead: 'nhanh hơn', behind: 'chậm hơn', onTime: 'đúng giờ', paused: 'tạm dừng',
      rotate: 'Xoay ngang điện thoại để xem rõ hơn', close: 'Đóng',
      reveal: 'Xem đáp án', hide: 'Ẩn đáp án',
      help: 'Phím tắt', helpHint: 'Bấm ? để xem phím tắt trình chiếu',
      keys: [['← →', 'Slide trước / sau'], ['N', 'Ghi chú người nói'], ['M', 'Menu các slide'],
        ['T', 'Đồng hồ (Shift+T đặt lại)'], ['F', 'Toàn màn hình'], ['Esc', 'Đóng bảng'], ['?', 'Bảng này']],
    },
  };
  const L = STR[(document.documentElement.lang || '').slice(0, 2).toLowerCase()] || STR.en;
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const mmss = (sec) => {
    const s = Math.max(0, Math.round(sec));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Page-level rules: hide authored notes, print helpers, countdown look.
  const css = `
    aside.notes { display: none !important; }
    .dk-print-img { display: none; }
    [data-countdown] { cursor: pointer; font-variant-numeric: tabular-nums; }
    [data-countdown].dk-done { opacity: .55; }
    @media print {
      #deck-kit { display: none !important; }
      .dk-print-src { display: none !important; }
      .dk-print-img { display: block !important; }
    }
  `;

  // Presenter UI lives in a shadow root so template CSS (button, h2…) can't restyle it.
  const uiCss = `
    :host { all: initial; font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #fff; }
    * { box-sizing: border-box; }
    .dk-progress { position: fixed; left: 0; top: 0; height: 3px; width: 0; z-index: 2147483100;
      background: #3B82F6; transition: width 300ms ease; pointer-events: none; }
    .dk-panel { position: fixed; z-index: 2147483200; background: rgba(15, 23, 42, .96); color: #fff;
      box-shadow: 0 12px 40px rgba(0,0,0,.35); display: none; }
    .dk-panel.dk-show { display: block; }
    .dk-notes { left: 0; right: 0; bottom: 0; max-height: 38vh; overflow: auto; padding: 14px 28px 18px; }
    .dk-notes .dk-hd { display: flex; gap: 16px; align-items: baseline; flex-wrap: wrap;
      color: #93C5FD; font-weight: 600; margin-bottom: 6px; }
    .dk-notes .dk-hd small { color: #94A3B8; font-weight: 400; }
    .dk-notes .dk-tx { font-size: 18px; line-height: 1.5; max-width: 1100px; }
    .dk-notes .dk-tx p + p { margin-top: .6em; }
    .dk-notes .dk-next { margin-top: 10px; color: #94A3B8; font-size: 14px; }
    .dk-menu { inset: 0; overflow: auto; padding: 32px 40px; background: rgba(15, 23, 42, .97); }
    .dk-menu h2 { font-size: 22px; margin: 0 0 14px; }
    .dk-menu .dk-items { columns: 2 340px; column-gap: 36px; }
    .dk-menu .dk-sec { color: #93C5FD; font-weight: 700; margin: 12px 0 2px; break-after: avoid; }
    .dk-menu button { display: flex; gap: 12px; width: 100%; text-align: left; font: inherit; color: #E2E8F0;
      background: none; border: 0; border-bottom: 1px solid rgba(148,163,184,.2); padding: 6px 4px; cursor: pointer; break-inside: avoid; }
    .dk-menu button:hover, .dk-menu button:focus-visible { background: rgba(59,130,246,.18); outline: none; }
    .dk-menu button.dk-cur { color: #fff; background: rgba(59,130,246,.32); }
    .dk-menu button span:first-child { width: 64px; flex: none; color: #94A3B8; font-variant-numeric: tabular-nums; }
    .dk-timer { top: 12px; right: 12px; border-radius: 10px; padding: 6px 12px; cursor: pointer; user-select: none;
      font-variant-numeric: tabular-nums; display: none; }
    .dk-timer.dk-show { display: flex; gap: 10px; align-items: baseline; }
    .dk-timer b { font-size: 22px; }
    .dk-timer .dk-ahead { color: #4ADE80; } .dk-timer .dk-behind { color: #F87171; }
    .dk-timer .dk-ontime { color: #93C5FD; } .dk-timer .dk-paused { color: #FBBF24; }
    .dk-help { left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 14px; padding: 20px 26px; min-width: 320px; }
    .dk-help h3 { margin: 0 0 10px; font-size: 18px; }
    .dk-help table { border-collapse: collapse; }
    .dk-help td { padding: 3px 14px 3px 0; }
    .dk-help kbd { font: 600 13px ui-monospace, Menlo, Consolas, monospace; background: rgba(255,255,255,.14);
      border-radius: 5px; padding: 2px 7px; }
    .dk-toast { left: 50%; top: 16px; transform: translateX(-50%); border-radius: 999px; padding: 7px 16px;
      font-size: 14px; pointer-events: none; }
    .dk-rotate { left: 8px; right: 8px; top: 8px; border-radius: 10px; padding: 10px 14px; font-weight: 600; }
    .dk-rotate button { margin-left: 10px; font: inherit; border: 0; border-radius: 6px; padding: 2px 10px; }
  `;

  // Generic print: lay every slide out as its own page. Only used when the
  // deck isn't a <deck-stage> (which already prints one slide per page).
  const genericPrintCss = `
    @page { size: 1920px 1080px; margin: 0; }
    @media print {
      html, body { width: auto !important; height: auto !important; overflow: visible !important;
        margin: 0 !important; padding: 0 !important; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact;
        animation-duration: 0s !important; animation-delay: 0s !important; transition: none !important; }
      .dk-print-flow { position: static !important; transform: none !important; width: auto !important;
        height: auto !important; overflow: visible !important; display: block !important; translate: none !important; }
      .dk-print-slide { position: relative !important; inset: auto !important; left: auto !important; top: auto !important;
        transform: none !important; translate: none !important; width: 100vw !important; height: 100vh !important;
        min-height: 0 !important; opacity: 1 !important; visibility: visible !important; overflow: hidden !important;
        flex: none !important; break-after: page; page-break-after: always; break-inside: avoid; }
      .dk-print-slide:last-of-type { break-after: auto; page-break-after: auto; }
      .dk-print-hide { display: none !important; }
    }
  `;

  // ── State ────────────────────────────────────────────────────────────────
  let adapter = null;
  let slides = [];
  let cur = -1;
  let ui = null;
  const widgets = [];         // { target, hooks, slide }
  const plan = { start: [], mins: [], total: 0, has: false };
  const timer = { started: null, pausedAt: null, offset: 0 };
  let swipe = false;
  let pending = null;         // { i, until, next } — retried jump (templates lock nav while animating)

  // ── Deck discovery ───────────────────────────────────────────────────────
  const topLevelSlides = () =>
    Array.from(document.querySelectorAll('.slide')).filter((s) => !s.parentElement.closest('.slide'));
  const isActive = (s) =>
    s.classList.contains('active') || s.classList.contains('is-active') || s.hasAttribute('data-deck-active');

  function findAdapter() {
    const ds = document.querySelector('deck-stage');
    if (ds) {
      return {
        mode: 'deck-stage',
        slides: () => Array.from(ds.children).filter((e) => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName)),
        index: () => ds.index,
        go: (i) => ds.goTo(i),
        ownsHash: true,
      };
    }
    const a = window.deckAdapter;
    if (a && typeof a.go === 'function' && typeof a.index === 'function') {
      return {
        mode: 'adapter',
        slides: a.slides ? () => Array.from(typeof a.slides === 'function' ? a.slides() : a.slides) : topLevelSlides,
        index: () => a.index(),
        go: (i) => a.go(i),
        ownsHash: !!a.ownsHash,
        touch: a.touch !== false,
      };
    }
    // Last resort: step with synthetic arrow keys, which every template handles.
    let guess = 0;
    return {
      mode: 'generic',
      slides: topLevelSlides,
      index: () => {
        const k = slides.findIndex(isActive);
        return k < 0 ? guess : k;
      },
      go: (i) => {
        const from = adapter.index();
        const key = i > from ? 'ArrowRight' : 'ArrowLeft';
        for (let n = Math.abs(i - from); n > 0; n--) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        }
        guess = i;
      },
      touch: true,
    };
  }

  /** Jump to slide i. Some templates ignore input during their transition,
   *  so the loop retries until the deck lands there (or 1.5 s pass). */
  function goto(i) {
    if (!slides.length) return;
    i = Math.max(0, Math.min(slides.length - 1, i));
    const now = performance.now();
    pending = { i, until: now + 1500, next: now + 150 };
    adapter.go(i);
  }

  // ── Slide metadata ───────────────────────────────────────────────────────
  function titleOf(s, i) {
    const t = s.getAttribute('data-title') || s.getAttribute('data-label');
    if (t) return t;
    const h = s.querySelector('h1, h2, h3, h4, [class*="title"], [class*="headline"], blockquote, p');
    let txt = '';
    if (h) {
      // <br> has no text; turn it into a space so "two<br>lines" reads right.
      const c = h.cloneNode(true);
      c.querySelectorAll('br').forEach((b) => b.replaceWith(' '));
      txt = c.textContent.replace(/\s+/g, ' ').trim();
    }
    return txt ? txt.slice(0, 70) : 'Slide ' + (i + 1);
  }
  const secOf = (s) => s.getAttribute('data-sec') || s.getAttribute('data-section') || '';

  let jsonNotes = null;
  function notesOf(s, i) {
    const aside = s.querySelector('aside.notes');
    if (aside) return aside.innerHTML.trim();
    if (s.hasAttribute('data-notes')) return esc(s.getAttribute('data-notes'));
    if (jsonNotes === null) {
      jsonNotes = [];
      const tag = document.getElementById('speaker-notes');
      if (tag) try { const p = JSON.parse(tag.textContent || '[]'); if (Array.isArray(p)) jsonNotes = p; } catch (e) {}
    }
    return jsonNotes[i] ? esc(jsonNotes[i]) : '';
  }

  function buildPlan() {
    let acc = 0;
    plan.start = []; plan.mins = [];
    slides.forEach((s, i) => {
      const m = parseFloat(s.getAttribute('data-min') || s.getAttribute('data-minutes'));
      plan.mins[i] = isFinite(m) && m > 0 ? m : 0;
      plan.start[i] = acc;
      acc += plan.mins[i];
    });
    plan.total = acc;
    plan.has = acc > 0;
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  function buildUI() {
    const style = el('style');
    style.id = 'deck-kit-style';
    style.textContent = css + (adapter.mode === 'deck-stage' ? '' : genericPrintCss);
    document.head.appendChild(style);

    const host = el('div');
    host.id = 'deck-kit';
    host.setAttribute('data-noncommentable', '');
    host.classList.add('export-hidden');
    const root = host.attachShadow({ mode: 'open' });
    root.appendChild(el('style', '', uiCss));
    const progress = el('div', 'dk-progress');
    const notes = el('div', 'dk-panel dk-notes', '<div class="dk-hd"></div><div class="dk-tx"></div><div class="dk-next"></div>');
    const menu = el('div', 'dk-panel dk-menu', `<h2>${esc(L.menu)}</h2><div class="dk-items"></div>`);
    const tmr = el('div', 'dk-panel dk-timer');
    const help = el('div', 'dk-panel dk-help',
      `<h3>${esc(L.help)}</h3><table>${L.keys.map(([k, d]) => `<tr><td><kbd>${esc(k)}</kbd></td><td>${esc(d)}</td></tr>`).join('')}</table>`);
    const toast = el('div', 'dk-panel dk-toast');
    if (plan.has) root.appendChild(progress);
    root.append(notes, menu, tmr, help, toast);
    document.body.appendChild(host);

    tmr.addEventListener('click', toggleTimerPause);
    // Keep clicks, wheel and touches on our panels away from the template's
    // own handlers (several decks navigate on any click or wheel).
    ['click', 'mousedown', 'pointerdown', 'touchstart', 'touchend', 'wheel'].forEach((t) =>
      host.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
    ui = { root, progress, notes, menu, tmr, help, toast };
    buildMenu();
  }

  function buildMenu() {
    const box = ui.menu.querySelector('.dk-items');
    box.textContent = '';
    let last = null;
    slides.forEach((s, i) => {
      const sec = secOf(s);
      if (sec && sec !== last) { box.appendChild(el('div', 'dk-sec', esc(sec))); last = sec; }
      const lead = plan.has ? `${L.min} ${Math.round(plan.start[i])}` : String(i + 1).padStart(2, '0');
      const b = el('button', '', `<span>${esc(lead)}</span><span>${plan.has ? (i + 1) + '. ' : ''}${esc(titleOf(s, i))}</span>`);
      b.type = 'button';
      b.addEventListener('click', () => { show('menu', false); goto(i); });
      box.appendChild(b);
    });
  }

  function show(name, on) {
    const p = ui[name];
    const want = on === undefined ? !p.classList.contains('dk-show') : on;
    p.classList.toggle('dk-show', want);
    if (name === 'menu' && want) {
      const b = ui.menu.querySelectorAll('button')[cur];
      if (b) b.focus({ preventScroll: false });
    }
  }

  let toastTimer = null;
  function flash(msg, ms = 2600) {
    ui.toast.textContent = msg;
    show('toast', true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => show('toast', false), ms);
  }

  function renderNotes() {
    const s = slides[cur];
    if (!s) return;
    const meta = [];
    if (plan.has) meta.push(fmt(L.planned, { m: plan.mins[cur] }), fmt(L.startsAt, { s: Math.round(plan.start[cur]) }));
    ui.notes.querySelector('.dk-hd').innerHTML =
      `<span>${cur + 1}/${slides.length} · ${esc(titleOf(s, cur))}</span>${meta.length ? `<small>${esc(meta.join(' · '))}</small>` : ''}` +
      `<small class="dk-el"></small>`;
    const n = notesOf(s, cur);
    ui.notes.querySelector('.dk-tx').innerHTML = n || `<em>${esc(L.noNotes)}</em>`;
    const nx = slides[cur + 1];
    ui.notes.querySelector('.dk-next').textContent = nx ? `${L.next}: ${titleOf(nx, cur + 1)}` : '';
  }

  // ── Timer ────────────────────────────────────────────────────────────────
  const elapsed = () => {
    if (!timer.started) return 0;
    const now = timer.pausedAt || Date.now();
    return (now - timer.started - timer.offset) / 1000;
  };
  function startTimer() { if (!timer.started) timer.started = Date.now(); }
  function resetTimer() { timer.started = null; timer.pausedAt = null; timer.offset = 0; renderTimer(); }
  function toggleTimerPause() {
    if (!timer.started) { startTimer(); return; }
    if (timer.pausedAt) { timer.offset += Date.now() - timer.pausedAt; timer.pausedAt = null; }
    else timer.pausedAt = Date.now();
    renderTimer();
  }
  let lastTimerText = '';
  function renderTimer() {
    const e = elapsed();
    let status = '';
    if (timer.pausedAt) status = `<span class="dk-paused">${esc(L.paused)}</span>`;
    else if (plan.has && timer.started && cur >= 0) {
      const lo = plan.start[cur] * 60, hi = (plan.start[cur] + plan.mins[cur]) * 60;
      if (e < lo) status = `<span class="dk-ahead">${esc(L.ahead)} ${mmss(lo - e)}</span>`;
      else if (e > hi) status = `<span class="dk-behind">${esc(L.behind)} ${mmss(e - hi)}</span>`;
      else status = `<span class="dk-ontime">${esc(L.onTime)}</span>`;
    }
    const total = plan.has ? ` / ${mmss(plan.total * 60)}` : '';
    const html = `<b>${mmss(e)}</b><span>${total}</span>${status}`;
    if (html !== lastTimerText) { ui.tmr.innerHTML = html; lastTimerText = html; }
    const tag = ui.notes.querySelector('.dk-el');
    if (tag) tag.textContent = timer.started ? `${L.elapsed} ${mmss(e)}${total}` : '';
  }

  // ── Widgets ──────────────────────────────────────────────────────────────
  function resolveSlide(target) {
    let node = target;
    if (typeof target === 'string') node = document.getElementById(target.replace(/^#/, ''));
    if (!node) return null;
    return slides.find((s) => s === node || s.contains(node)) || null;
  }
  const ctxFor = (w) => ({ slide: w.slide, index: slides.indexOf(w.slide), kit: api });
  function call(w, hook, ...args) {
    const f = w.hooks[hook];
    if (!f) return;
    try { f(...args, ctxFor(w)); } catch (e) { console.error('[deck-kit] widget ' + hook + ' failed:', e); }
  }
  const widgetsOn = (s) => widgets.filter((w) => w.slide === s);

  /** Size a canvas for its current CSS box (and the stage scale) and return
   *  a 2D context whose units are CSS pixels. */
  function fitCanvas(cv) {
    const w = cv.offsetWidth, h = cv.offsetHeight;
    const r = cv.getBoundingClientRect();
    const scale = w ? r.width / w : 1;
    const k = Math.min(4, Math.max(1, (window.devicePixelRatio || 1) * (scale || 1)));
    const bw = Math.max(1, Math.round(w * k)), bh = Math.max(1, Math.round(h * k));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    return { ctx, w, h };
  }

  // ── Countdown & reveal ───────────────────────────────────────────────────
  const parseDur = (v) => {
    const m = String(v || '').trim().match(/^(\d+):(\d{1,2})$/);
    return m ? +m[1] * 60 + +m[2] : (parseFloat(v) || 0);
  };
  function cdState(e) {
    if (!e._dk) e._dk = { left: parseDur(e.getAttribute('data-countdown')), running: false };
    return e._dk;
  }
  function cdRender(e) { e.textContent = mmss(cdState(e).left); e.classList.toggle('dk-done', cdState(e).left <= 0); }
  function cdTick(dt) {
    document.querySelectorAll('[data-countdown]').forEach((e) => {
      const st = cdState(e);
      if (!st.running) return;
      st.left = Math.max(0, st.left - dt);
      if (st.left <= 0) st.running = false;
      cdRender(e);
    });
  }

  // ── Navigation hook ──────────────────────────────────────────────────────
  function onChange(i, prev) {
    if (prev >= 0 && slides[prev]) widgetsOn(slides[prev]).forEach((w) => call(w, 'leave'));
    cur = i;
    const s = slides[i];
    widgetsOn(s).forEach((w) => { call(w, 'enter'); call(w, 'draw'); });
    s.querySelectorAll('[data-countdown][data-autostart]').forEach((e) => { cdState(e).running = cdState(e).left > 0; });
    if (plan.has) ui.progress.style.width = ((plan.start[i] + plan.mins[i]) / plan.total * 100) + '%';
    ui.menu.querySelectorAll('button').forEach((b, k) => b.classList.toggle('dk-cur', k === i));
    if (i > 0) startTimer();
    if (!adapter.ownsHash) { try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {} }
    renderNotes();
    renderTimer();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const i = adapter.index();
    if (pending) {
      if (i === pending.i || now > pending.until) pending = null;
      else if (now >= pending.next) { pending.next = now + 150; adapter.go(pending.i); }
    }
    if (i !== cur && i >= 0 && i < slides.length) onChange(i, cur);
    if (cur >= 0) widgetsOn(slides[cur]).forEach((w) => call(w, 'tick', dt));
    cdTick(dt);
    if (timer.started) renderTimer();
    requestAnimationFrame(loop);
  }

  let resizeQueued = false;
  function onResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      if (cur >= 0) widgetsOn(slides[cur]).forEach((w) => call(w, 'draw'));
    });
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  const NAV_KEYS = /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End| |Spacebar)$/;
  function onKey(e) {
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) ||
      (t.tagName === 'INPUT' && !/^(range|checkbox|radio|button|submit|reset|color)$/.test(t.type)));
    const onControl = t && t.tagName === 'INPUT' && /^(range|checkbox|radio)$/.test(t.type);
    // Let sliders and inputs keep their keys: stop the deck from seeing them.
    if ((typing || onControl) && NAV_KEYS.test(e.key)) { e.stopImmediatePropagation(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

    let handled = true;
    switch (e.key) {
      case 'n': case 'N': show('notes'); break;
      case 'm': case 'M': show('menu'); break;
      case 't': show('tmr'); renderTimer(); break;
      case 'T': resetTimer(); flash(L.elapsed + ' 0:00'); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case '?': show('help'); break;
      case 'Escape': ['menu', 'help', 'notes'].forEach((p) => show(p, false)); break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    // While the menu is open, arrow keys move between rows instead of slides.
    if (ui.menu.classList.contains('dk-show') && /^(ArrowUp|ArrowDown)$/.test(e.key)) {
      const bs = Array.from(ui.menu.querySelectorAll('button'));
      const k = bs.indexOf(ui.root.activeElement);
      const nb = bs[Math.max(0, Math.min(bs.length - 1, k + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (nb) nb.focus();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) {
        const r = document.documentElement.requestFullscreen();
        if (r && r.catch) r.catch(() => {});
      }
    } catch (e) {}
  }

  // ── Touch ────────────────────────────────────────────────────────────────
  function setupTouch() {
    let x0 = null, y0 = null;
    const skip = 'input, button, select, textarea, a, canvas, [data-noswipe], #deck-kit';
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest && e.target.closest(skip)) { x0 = null; return; }
      const t = e.changedTouches[0];
      x0 = t.clientX; y0 = t.clientY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      x0 = null;
      if (swipe && Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) goto(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });

    if (matchMedia('(orientation: portrait) and (max-width: 700px)').matches) {
      const r = el('div', 'dk-panel dk-rotate dk-show', `${esc(L.rotate)}<button type="button">${esc(L.close)}</button>`);
      r.querySelector('button').addEventListener('click', () => r.remove());
      ui.root.appendChild(r);
    }
  }

  // ── Print ────────────────────────────────────────────────────────────────
  let printUndo = null;
  function preparePrint() {
    if (printUndo) return;
    const undo = [];
    if (adapter.mode !== 'deck-stage') {
      // Show every slide, flatten the containers that stack or slide them.
      const activeCls = slides.some((s) => s.classList.contains('is-active')) ? 'is-active' : 'active';
      const usesCls = slides.some((s) => s.classList.contains(activeCls));
      const flow = new Set();
      slides.forEach((s) => {
        const before = s.className;
        s.classList.add('dk-print-slide');
        if (usesCls) { s.classList.add(activeCls); s.classList.remove('prev', 'next', 'is-prev', 'is-next'); }
        undo.push(() => { s.className = before; });
        for (let p = s.parentElement; p && p !== document.body; p = p.parentElement) flow.add(p);
      });
      flow.forEach((p) => { p.classList.add('dk-print-flow'); undo.push(() => p.classList.remove('dk-print-flow')); });
      // Fixed chrome (dots, counters, arrows) would repeat on every page.
      Array.from(document.body.querySelectorAll('*')).forEach((n) => {
        if (n.closest('.dk-print-slide') || flow.has(n) || n.closest('#deck-kit')) return;
        if (getComputedStyle(n).position === 'fixed') { n.classList.add('dk-print-hide'); undo.push(() => n.classList.remove('dk-print-hide')); }
      });
    }
    // Redraw every widget (not just the current slide), then freeze canvases
    // into images so they survive the print pipeline.
    widgets.forEach((w) => { if (w.slide) { call(w, 'enter'); call(w, w.hooks.print ? 'print' : 'draw'); } });
    slides.forEach((s) => s.querySelectorAll('canvas').forEach((cv) => {
      if (!cv.width || !cv.offsetWidth) return;
      let src;
      try { src = cv.toDataURL('image/png'); } catch (e) { return; }
      const img = new Image();
      img.src = src;
      img.className = 'dk-print-img';
      img.alt = '';
      img.style.width = cv.offsetWidth + 'px';
      img.style.height = cv.offsetHeight + 'px';
      cv.after(img);
      cv.classList.add('dk-print-src');
      undo.push(() => { img.remove(); cv.classList.remove('dk-print-src'); });
    }));
    widgets.forEach((w) => { if (w.slide && w.slide !== slides[cur]) call(w, 'leave'); });
    printUndo = undo;
  }
  function cleanupPrint() {
    if (!printUndo) return;
    printUndo.reverse().forEach((f) => f());
    printUndo = null;
    if (cur >= 0) widgetsOn(slides[cur]).forEach((w) => call(w, 'draw'));
  }

  // ── Public API ───────────────────────────────────────────────────────────
  const api = {
    version: '1.0.0',
    get index() { return cur; },
    get length() { return slides.length; },
    get mode() { return adapter ? adapter.mode : null; },
    get slides() { return slides.slice(); },
    goTo: (i) => adapter && goto(i),
    next: () => adapter && goto(cur + 1),
    prev: () => adapter && goto(cur - 1),
    /** Register an interactive widget for a slide (element, id, or any node inside it). */
    widget(target, hooks) {
      const w = { target, hooks: hooks || {}, slide: null };
      widgets.push(w);
      if (adapter) {
        w.slide = resolveSlide(target);
        if (!w.slide) console.warn('[deck-kit] widget target not inside a slide:', target);
        else if (w.slide === slides[cur]) { call(w, 'enter'); call(w, 'draw'); }
      }
      return w;
    },
    canvas: fitCanvas,
    toggle: (name, on) => ui && show({ notes: 'notes', menu: 'menu', timer: 'tmr', help: 'help' }[name], on),
    timer: { start: startTimer, reset: resetTimer, pause: toggleTimerPause, get elapsed() { return elapsed(); } },
    preparePrint,
    cleanupPrint,
    print() { preparePrint(); window.print(); },
  };
  window.DeckKit = api;

  // ── Boot ─────────────────────────────────────────────────────────────────
  function init() {
    adapter = findAdapter();
    slides = adapter.slides();
    if (!slides.length) { console.warn('[deck-kit] no slides found'); return; }
    buildPlan();
    buildUI();
    widgets.forEach((w) => { w.slide = resolveSlide(w.target); });
    // Templates with their own swipe handling keep it; others get ours.
    swipe = adapter.mode === 'deck-stage' || adapter.touch === false;
    setupTouch();

    document.querySelectorAll('[data-countdown]').forEach(cdRender);
    document.addEventListener('click', (e) => {
      const cd = e.target.closest && e.target.closest('[data-countdown]');
      if (cd) {
        const st = cdState(cd);
        if (e.detail === 2) { st.left = parseDur(cd.getAttribute('data-countdown')); st.running = false; }
        else if (st.left > 0) st.running = !st.running;
        cdRender(cd);
      }
      const rv = e.target.closest && e.target.closest('[data-reveal]');
      if (rv) {
        const a = document.getElementById(rv.getAttribute('data-reveal'));
        if (a) {
          a.hidden = !a.hidden;
          rv.setAttribute('aria-expanded', String(!a.hidden));
          const showT = rv.getAttribute('data-reveal-text') || L.reveal;
          const hideT = rv.getAttribute('data-hide-text') || L.hide;
          const txt = rv.textContent.trim();
          if (txt === showT || txt === hideT || !txt) rv.textContent = a.hidden ? showT : hideT;
        }
      }
    });

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('beforeprint', preparePrint);
    window.addEventListener('afterprint', cleanupPrint);
    if (window.matchMedia) {
      const mq = matchMedia('print');
      const h = (m) => (m.matches ? preparePrint() : cleanupPrint());
      if (mq.addEventListener) mq.addEventListener('change', h); else if (mq.addListener) mq.addListener(h);
    }

    // Deep link (#N) for decks that don't restore it themselves.
    if (!adapter.ownsHash) {
      const m = (location.hash || '').match(/^#(\d+)$/);
      if (m) { const n = parseInt(m[1], 10) - 1; if (n > 0 && n < slides.length) goto(n); }
    }

    try {
      if (!localStorage.getItem('deck-kit-hint')) { flash(L.helpHint, 3500); localStorage.setItem('deck-kit-hint', '1'); }
    } catch (e) {}

    requestAnimationFrame(loop);
    document.dispatchEvent(new CustomEvent('deckkit:ready', { detail: api }));
  }

  function boot() {
    // <deck-stage> collects its slides on slotchange; wait for the upgrade
    // and one more task so index/children are settled.
    if (document.querySelector('deck-stage') && window.customElements) {
      customElements.whenDefined('deck-stage').then(() => setTimeout(init, 0));
    } else {
      setTimeout(init, 0);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
