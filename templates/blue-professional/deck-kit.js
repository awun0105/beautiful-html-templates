/**
 * deck-kit.js — presenter layer that works on top of every template.
 *
 * Drop it in after the deck's own script:
 *   <script src="deck-kit.js"></script>
 *
 * It finds the deck in one of three ways, in this order:
 *   1. <deck-stage>          — uses the element's goTo()/index API.
 *   2. window.deckAdapter    — { go(i), index(), slides?, nativeScroll? } set by
 *                              templates that ship their own navigation.
 *   3. generic fallback      — top-level `.slide` elements, current slide = the
 *                              one with .active / .is-active; moves by
 *                              synthetic arrow keys.
 *
 * Presenting
 *   ← → Space PgUp/PgDn Home End 1–9   navigation (deck-kit owns it for
 *        adapter/generic decks, so presses during a template's transition are
 *        queued instead of dropped)
 *   P    presenter view: second window with current + next slide, notes,
 *        timer; the original window becomes the clean audience screen
 *   N    speaker notes panel (on this screen)     M  slide menu
 *   T    talk timer (Shift+T resets, click to pause)
 *   B/W  black / white screen    L  laser pointer    D  draw on the slide
 *        (C clears the slide's ink, Backspace undoes a stroke, Esc stops)
 *   F    fullscreen    ?  shortcuts    Esc  close panels
 *   #N in the URL opens slide N. Swipe on touch screens.
 *   Ctrl/Cmd+P visits every slide first (so charts drawn on entry are
 *   filled in), then prints one slide per page with canvases kept.
 *
 * Slide metadata (all optional)
 *   data-title  data-sec  data-min   and   <aside class="notes">…</aside>
 *
 * Interactive slides
 *   DeckKit.widget(target, { enter, leave, draw, tick(dt), print })
 *   DeckKit.canvas(cv) → { ctx, w, h }     crisp canvas in CSS pixels
 *   DeckKit.bind(inputs, fn)               sliders → fn(values), live <output>s
 *   DeckKit.plot(cv, { x:[a,b], y:[c,d] }) axes, functions, points, gaussians…
 *   DeckKit.palette(el)                    the template's ink / bg / accents
 *   [data-reveal="id"]  [data-countdown="5:00" data-autostart]
 *
 * UI strings follow <html lang>: Vietnamese for "vi", English otherwise.
 */

(() => {
  if (window.DeckKit) return;

  // Windows opened by the presenter view: ?dk=presenter (notes screen) and
  // ?dk=mirror (slide previews inside it).
  const ROLE = (new URLSearchParams(location.search).get('dk') || 'main').toLowerCase();

  const STR = {
    en: {
      notes: 'Speaker notes', noNotes: 'No notes for this slide.', next: 'Next', end: 'End of deck',
      menu: 'Slides', min: 'min', planned: 'planned {m} min', startsAt: 'starts at min {s}',
      elapsed: 'Elapsed', ahead: 'ahead', behind: 'behind', onTime: 'on time', paused: 'paused',
      rotate: 'Rotate your phone to landscape for the best view', close: 'Close',
      reveal: 'Show answer', hide: 'Hide answer',
      help: 'Shortcuts', helpHint: 'Press ? for presenter shortcuts',
      printing: 'Preparing print… {i}/{n}', popup: 'Allow pop-ups to open the presenter view',
      presenter: 'Presenter view', waiting: 'Waiting for the audience window…', lost: 'Audience window closed',
      current: 'Current', drawOn: 'Drawing — C clears, Esc stops', laserOn: 'Laser pointer — L to stop',
      edit: '✎ Edit', done: '✓ Done', saveFile: '💾 Save to file', unsaved: '{n} unsaved', saved: 'Notes saved to {f}',
      nothing: 'No note changes to save', restored: 'Restored {n} unsaved note edit(s) — press P, then Save',
      otherFile: 'You picked "{a}" but this deck is "{b}". Write to it anyway?',
      downloaded: 'Saved notes.json — merge it with: node scripts/apply-notes.mjs <deck.html> notes.json',
      saveFailed: 'Could not save: {e}', pickDeck: 'Pick this deck\'s own HTML file to save into',
      keys: [['← → 1–9', 'Navigate'], ['P', 'Presenter view (2nd window)'], ['N', 'Speaker notes'], ['M', 'Slide menu'],
        ['T', 'Talk timer (Shift+T reset)'], ['B / W', 'Black / white screen'], ['L', 'Laser pointer'],
        ['D', 'Draw (C clear, Backspace undo)'], ['F', 'Fullscreen'], ['Ctrl+P', 'Print every slide'], ['Esc', 'Close panels'], ['?', 'This help']],
    },
    vi: {
      notes: 'Ghi chú người nói', noNotes: 'Slide này không có ghi chú.', next: 'Tiếp theo', end: 'Hết bài',
      menu: 'Các slide', min: 'phút', planned: 'dự kiến {m} phút', startsAt: 'bắt đầu ở phút {s}',
      elapsed: 'Đã nói', ahead: 'nhanh hơn', behind: 'chậm hơn', onTime: 'đúng giờ', paused: 'tạm dừng',
      rotate: 'Xoay ngang điện thoại để xem rõ hơn', close: 'Đóng',
      reveal: 'Xem đáp án', hide: 'Ẩn đáp án',
      help: 'Phím tắt', helpHint: 'Bấm ? để xem phím tắt trình chiếu',
      printing: 'Đang chuẩn bị in… {i}/{n}', popup: 'Hãy cho phép cửa sổ bật lên (pop-up) để mở màn hình người trình bày',
      presenter: 'Màn hình người trình bày', waiting: 'Đang chờ cửa sổ trình chiếu…', lost: 'Cửa sổ trình chiếu đã đóng',
      current: 'Hiện tại', drawOn: 'Đang vẽ — C xoá, Esc thoát', laserOn: 'Con trỏ laser — bấm L để tắt',
      edit: '✎ Sửa', done: '✓ Xong', saveFile: '💾 Lưu vào file', unsaved: '{n} chưa lưu', saved: 'Đã lưu ghi chú vào {f}',
      nothing: 'Không có ghi chú nào thay đổi', restored: 'Đã khôi phục {n} ghi chú chưa lưu — bấm P rồi Lưu',
      otherFile: 'Bạn chọn "{a}" nhưng deck này là "{b}". Vẫn ghi vào file đó?',
      downloaded: 'Đã tải notes.json — ghép vào deck bằng: node scripts/apply-notes.mjs <deck.html> notes.json',
      saveFailed: 'Không lưu được: {e}', pickDeck: 'Chọn chính file HTML của deck này để lưu',
      keys: [['← → 1–9', 'Chuyển slide'], ['P', 'Màn hình người trình bày (cửa sổ 2)'], ['N', 'Ghi chú người nói'], ['M', 'Menu các slide'],
        ['T', 'Đồng hồ (Shift+T đặt lại)'], ['B / W', 'Màn hình đen / trắng'], ['L', 'Con trỏ laser'],
        ['D', 'Vẽ lên slide (C xoá, Backspace hoàn tác)'], ['F', 'Toàn màn hình'], ['Ctrl+P', 'In mọi slide'], ['Esc', 'Đóng bảng'], ['?', 'Bảng này']],
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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Page-level rules: hide authored notes, print helpers, countdown look.
  const css = `
    aside.notes { display: none !important; }
    .dk-print-img { display: none; }
    [data-countdown] { cursor: pointer; font-variant-numeric: tabular-nums; }
    [data-countdown].dk-done { opacity: .55; }
    html.dk-laser, html.dk-laser * { cursor: none !important; }
    @media print {
      * { transition: none !important; }
      #deck-kit { display: none !important; }
      .dk-print-src { display: none !important; }
      .dk-print-img { display: block !important; }
    }
  `;
  // The presenter window keeps the deck loaded (for notes) but shows only our UI.
  const presenterPageCss = `
    html, body { overflow: hidden !important; background: #0b1220 !important; }
    body > *:not(#deck-kit) { visibility: hidden !important; }
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
    .dk-hd { display: flex; gap: 16px; align-items: baseline; flex-wrap: wrap; color: #93C5FD; font-weight: 600; margin-bottom: 6px; }
    .dk-hd small { color: #94A3B8; font-weight: 400; }
    .dk-tx { font-size: 18px; line-height: 1.5; max-width: 1100px; }
    .dk-tx p + p { margin-top: .6em; }
    .dk-next { margin-top: 10px; color: #94A3B8; font-size: 14px; }
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
    .dk-ahead { color: #4ADE80; } .dk-behind { color: #F87171; } .dk-ontime { color: #93C5FD; } .dk-paused { color: #FBBF24; }
    .dk-help { left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 14px; padding: 20px 26px; min-width: 340px; }
    .dk-help h3 { margin: 0 0 10px; font-size: 18px; }
    .dk-help table { border-collapse: collapse; }
    .dk-help td { padding: 3px 14px 3px 0; }
    kbd { font: 600 13px ui-monospace, Menlo, Consolas, monospace; background: rgba(255,255,255,.14); border-radius: 5px; padding: 2px 7px; }
    .dk-toast { left: 50%; top: 16px; transform: translateX(-50%); border-radius: 999px; padding: 7px 16px; font-size: 14px; pointer-events: none; }
    .dk-rotate { left: 8px; right: 8px; top: 8px; border-radius: 10px; padding: 10px 14px; font-weight: 600; }
    .dk-rotate button { margin-left: 10px; font: inherit; border: 0; border-radius: 6px; padding: 2px 10px; }
    .dk-blank { position: fixed; inset: 0; z-index: 2147483150; display: none; cursor: none; }
    .dk-blank.dk-show { display: block; }
    .dk-ink { position: fixed; inset: 0; z-index: 2147483140; pointer-events: none; width: 100vw; height: 100vh; }
    .dk-ink.dk-drawing { pointer-events: auto; cursor: crosshair; }
    .dk-laser { position: fixed; z-index: 2147483160; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%;
      background: radial-gradient(circle, #fff 0 18%, #ff2a2a 30% 55%, rgba(255,42,42,0) 72%); pointer-events: none; display: none;
      box-shadow: 0 0 14px 6px rgba(255,42,42,.45); }
    .dk-laser.dk-show { display: block; }
    /* presenter window */
    .dk-pv { position: fixed; inset: 0; z-index: 2147483300; background: #0b1220; display: grid; gap: 18px; padding: 18px;
      grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); grid-template-rows: auto minmax(0, 1fr) auto; }
    .dk-pv .dk-lbl { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #94A3B8; margin-bottom: 6px; }
    .dk-pv .dk-top { grid-column: 1 / -1; display: flex; align-items: center; gap: 18px; }
    .dk-pv .dk-top .dk-title { font-size: 18px; font-weight: 600; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dk-pv .dk-clock { font: 600 30px ui-monospace, Menlo, Consolas, monospace; cursor: pointer; }
    .dk-pv .dk-status { font-size: 15px; }
    .dk-pv .dk-main, .dk-pv .dk-side { min-height: 0; display: flex; flex-direction: column; }
    .dk-pv .dk-side { gap: 14px; }
    .dk-pv .dk-frame { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; border-radius: 10px; overflow: hidden;
      box-shadow: 0 0 0 1px rgba(148,163,184,.25); }
    .dk-pv .dk-frame iframe { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; border: 0; transform-origin: 0 0; pointer-events: none; }
    .dk-pv .dk-cur iframe { pointer-events: auto; } /* drive sliders/buttons from the laptop */
    .dk-pv .dk-frame .dk-endcard { position: absolute; inset: 0; display: none; place-items: center; color: #94A3B8; font-size: 18px; }
    .dk-pv .dk-frame.dk-end .dk-endcard { display: grid; }
    .dk-pv .dk-frame.dk-end iframe { visibility: hidden; }
    .dk-pv .dk-pnotes { flex: 1; min-height: 0; overflow: auto; background: rgba(148,163,184,.08); border-radius: 10px; padding: 14px 18px; }
    .dk-pv .dk-pnotes .dk-tx { font-size: 22px; min-height: 2em; outline: none; }
    .dk-pv .dk-pnotes.dk-editing { box-shadow: inset 0 0 0 2px #3B82F6; background: rgba(59,130,246,.08); }
    .dk-pv .dk-nrow { display: flex; align-items: baseline; gap: 10px; }
    .dk-pv .dk-nrow .dk-lbl { margin: 0; flex: 1; }
    .dk-pv .dk-nrow button { font: 600 13px system-ui, sans-serif; color: #fff; background: rgba(148,163,184,.16); border: 0;
      border-radius: 6px; padding: 4px 10px; cursor: pointer; }
    .dk-pv .dk-nrow button:hover { background: rgba(148,163,184,.3); }
    .dk-pv .dk-nstat { font-size: 12px; color: #FBBF24; }
    .dk-pv .dk-bar { grid-column: 1 / -1; display: flex; gap: 10px; align-items: center; }
    .dk-pv .dk-bar button { font: 600 15px inherit; font-family: inherit; color: #fff; background: rgba(148,163,184,.16); border: 0;
      border-radius: 8px; padding: 8px 16px; cursor: pointer; }
    .dk-pv .dk-bar button:hover { background: rgba(148,163,184,.3); }
    .dk-pv .dk-bar .dk-pos { margin-left: auto; color: #94A3B8; font-variant-numeric: tabular-nums; }
    .dk-pv .dk-msg { color: #FBBF24; font-size: 14px; }
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
  let timer = { started: null, pausedAt: null, offset: 0 };
  let pending = null;         // { i, until, next } — retried jump (templates lock nav while animating)
  let synthetic = false;      // true while the generic adapter dispatches its own arrow keys
  let presenterWin = null;    // main window: the presenter popup
  let blank = null;           // 'black' | 'white' | null
  let pinned = null;          // mirror: the slide the presenter told us to show

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
        ownsKeys: true,
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
        nativeScroll: !!a.nativeScroll,
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
        synthetic = true;
        try {
          for (let n = Math.abs(i - from); n > 0; n--) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
          }
        } finally { synthetic = false; }
        guess = i;
      },
    };
  }

  /** Jump to slide i. Some templates ignore input during their transition,
   *  so the loop retries until the deck lands there (or 1.5 s pass). */
  function goto(i) {
    if (!slides.length) return;
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (ROLE === 'presenter') { send(window.opener, { dk: 'go', index: i }); return; }
    const now = performance.now();
    pending = { i, until: now + 1500, next: now + 150 };
    adapter.go(i);
  }
  /** Relative move that stacks while a jump is still landing. */
  const step = (d) => goto((pending ? pending.i : cur) + d);

  // ── Slide metadata ───────────────────────────────────────────────────────
  function titleOf(s, i) {
    const t = s.getAttribute('data-title') || s.getAttribute('data-label');
    if (t) return t;
    // Headings first, in rank order; then title-ish classes; then any text block.
    let h = null;
    for (const sel of ['h1', 'h2', 'h3', 'h4', '[class*="title"]', '[class*="headline"]', 'blockquote', 'p']) {
      h = Array.from(s.querySelectorAll(sel)).find((e) => !e.closest('aside.notes') && e.textContent.trim());
      if (h) break;
    }
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
    style.textContent = css + (adapter.mode === 'deck-stage' ? '' : genericPrintCss) + (ROLE === 'presenter' ? presenterPageCss : '');
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
    const blankEl = el('div', 'dk-blank');
    const ink = el('canvas', 'dk-ink');
    const laser = el('div', 'dk-laser');
    if (plan.has && ROLE === 'main') root.appendChild(progress);
    root.append(ink, notes, menu, tmr, help, toast, blankEl, laser);
    document.body.appendChild(host);

    tmr.addEventListener('click', () => timerCmd('pause'));
    // Keep clicks, wheel and touches on our panels away from the template's
    // own handlers (several decks navigate on any click or wheel).
    ['click', 'mousedown', 'pointerdown', 'touchstart', 'touchend', 'wheel'].forEach((t) =>
      host.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
    ui = { host, root, progress, notes, menu, tmr, help, toast, blankEl, ink, laser };
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

  function notesHtml(i) {
    const n = slides[i] ? notesOf(slides[i], i) : '';
    return n || `<em>${esc(L.noNotes)}</em>`;
  }
  function metaText(i) {
    return plan.has ? fmt(L.planned, { m: plan.mins[i] }) + ' · ' + fmt(L.startsAt, { s: Math.round(plan.start[i]) }) : '';
  }
  function renderNotes() {
    const s = slides[cur];
    if (!s) return;
    const meta = metaText(cur);
    ui.notes.querySelector('.dk-hd').innerHTML =
      `<span>${cur + 1}/${slides.length} · ${esc(titleOf(s, cur))}</span>${meta ? `<small>${esc(meta)}</small>` : ''}<small class="dk-el"></small>`;
    ui.notes.querySelector('.dk-tx').innerHTML = notesHtml(cur);
    const nx = slides[cur + 1];
    ui.notes.querySelector('.dk-next').textContent = nx ? `${L.next}: ${titleOf(nx, cur + 1)}` : L.end;
  }

  // ── Timer ────────────────────────────────────────────────────────────────
  const elapsed = () => {
    if (!timer.started) return 0;
    const now = timer.pausedAt || Date.now();
    return (now - timer.started - timer.offset) / 1000;
  };
  function startTimer() { if (!timer.started) timer.started = Date.now(); }
  function timerCmd(cmd) {
    if (ROLE === 'presenter') { send(window.opener, { dk: 'timer', cmd }); return; }
    if (cmd === 'reset') { timer = { started: null, pausedAt: null, offset: 0 }; }
    else if (cmd === 'pause') {
      if (!timer.started) startTimer();
      else if (timer.pausedAt) { timer.offset += Date.now() - timer.pausedAt; timer.pausedAt = null; }
      else timer.pausedAt = Date.now();
    }
    renderTimer();
    broadcast();
  }
  function timerStatus(e) {
    if (timer.pausedAt) return `<span class="dk-paused">${esc(L.paused)}</span>`;
    if (!plan.has || !timer.started || cur < 0) return '';
    const lo = plan.start[cur] * 60, hi = (plan.start[cur] + plan.mins[cur]) * 60;
    if (e < lo) return `<span class="dk-ahead">${esc(L.ahead)} ${mmss(lo - e)}</span>`;
    if (e > hi) return `<span class="dk-behind">${esc(L.behind)} ${mmss(e - hi)}</span>`;
    return `<span class="dk-ontime">${esc(L.onTime)}</span>`;
  }
  let lastTimerText = '';
  function renderTimer() {
    const e = elapsed();
    const total = plan.has ? ` / ${mmss(plan.total * 60)}` : '';
    const html = `<b>${mmss(e)}</b><span>${total}</span>${timerStatus(e)}`;
    if (html !== lastTimerText) {
      lastTimerText = html;
      ui.tmr.innerHTML = html;
      const tag = ui.notes.querySelector('.dk-el');
      if (tag) tag.textContent = timer.started ? `${L.elapsed} ${mmss(e)}${total}` : '';
      if (pv) { pv.clock.textContent = mmss(e) + total; pv.status.innerHTML = timerStatus(e); }
    }
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

  // ── Widget helpers: palette, bind, plot ──────────────────────────────────
  const FALLBACK = ['#2563EB', '#E8770E', '#0F9D6B', '#C2255C', '#7C3AED', '#0891B2'];
  let probe = null;
  /** Normalise any CSS colour to rgb(a) via the browser; null if not a colour. */
  function toRgb(v) {
    if (!v || /^(transparent|inherit|initial|unset|none)$/i.test(v.trim())) return null;
    if (!CSS.supports('color', v.trim())) return null;
    if (!probe) { probe = el('span'); probe.style.display = 'none'; document.body.appendChild(probe); }
    probe.style.color = ''; probe.style.color = v.trim();
    const c = getComputedStyle(probe).color;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return a < 0.5 ? null : { r, g, b, css: `rgb(${r}, ${g}, ${b})` };
  }
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const dist = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

  /** The template's colours as seen from `node`: { ink, bg, mute, accents[] }.
   *  Accents come from the page's colour custom properties, in declaration
   *  order, keeping only ones that stand out from the background. */
  function palette(node) {
    const start = typeof node === 'string' ? document.getElementById(node) : node;
    const at = start || slides[cur] || document.body;
    let bg = null;
    for (let n = at; n && n.nodeType === 1 && !bg; n = n.parentElement) bg = toRgb(getComputedStyle(n).backgroundColor);
    bg = bg || { r: 255, g: 255, b: 255, css: 'rgb(255, 255, 255)' };
    const ink = toRgb(getComputedStyle(at).color) || { r: 17, g: 17, b: 17, css: 'rgb(17, 17, 17)' };
    const seen = [bg, ink];
    const accents = [];
    const scopes = [document.documentElement, slides[cur], at].filter(Boolean);
    for (const sc of scopes) {
      const cs = getComputedStyle(sc);
      for (let k = 0; k < cs.length; k++) {
        const name = cs[k];
        if (!name.startsWith('--')) continue;
        const c = toRgb(cs.getPropertyValue(name));
        if (!c || contrast(c, bg) < 1.6 || seen.some((s) => dist(s, c) < 40)) continue;
        seen.push(c);
        accents.push(c.css);
      }
    }
    FALLBACK.forEach((f) => { if (accents.length < 4) { const c = toRgb(f); if (contrast(c, bg) >= 1.6) accents.push(c.css); } });
    const mute = `rgba(${ink.r}, ${ink.g}, ${ink.b}, .45)`;
    return { ink: ink.css, bg: bg.css, mute, grid: `rgba(${ink.r}, ${ink.g}, ${ink.b}, .12)`, accents, dark: lum(bg) < 0.25 };
  }

  /** Wire inputs to a callback. `inputs`: ids, elements, a selector or a
   *  container. Calls fn(values) now and on every change; values are keyed by
   *  id (or name) and numeric for range/number inputs. Matching <output for=id>
   *  or an <output> in the same label shows the live value. */
  function bind(inputs, fn) {
    let list = [];
    const add = (x) => {
      if (!x) return;
      if (typeof x === 'string') {
        const byId = document.getElementById(x.replace(/^#/, ''));
        if (byId) return add(byId);
        return document.querySelectorAll(x).forEach(add);
      }
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(x.tagName)) list.push(x);
      else x.querySelectorAll('input, select, textarea').forEach((e) => list.push(e));
    };
    (Array.isArray(inputs) ? inputs : [inputs]).forEach(add);
    list = [...new Set(list)];
    const outFor = (inp) => (inp.id && document.querySelector(`output[for~="${inp.id}"]`)) ||
      (inp.closest('label') && inp.closest('label').querySelector('output'));
    const decimals = (inp) => inp.dataset.d !== undefined ? +inp.dataset.d : ((inp.step || '1').split('.')[1] || '').length;
    const values = () => {
      const v = {};
      list.forEach((inp) => {
        const key = inp.id || inp.name;
        v[key] = inp.type === 'checkbox' ? inp.checked : /^(range|number)$/.test(inp.type) ? +inp.value : inp.value;
        const o = outFor(inp);
        if (o && /^(range|number)$/.test(inp.type)) o.textContent = (+inp.value).toFixed(decimals(inp));
      });
      return v;
    };
    const run = () => fn(values());
    list.forEach((inp) => inp.addEventListener('input', run));
    run();
    return values;
  }

  /** Chart helper on a canvas, in data coordinates.
   *    const p = DeckKit.plot(cv, { x: [-5, 5], y: [0, 0.6] });
   *    p.clear().axes({ xlabel: 'x' }).fn(x => …, { fill: true }).points(pts)
   *  Every call to clear() refits the canvas, so it is safe in draw()/tick(). */
  function plot(cv, opts = {}) {
    const o = Object.assign({ x: [0, 1], y: [0, 1], pad: [18, 18, 42, 54] }, opts);
    const pad = Array.isArray(o.pad) ? o.pad : [o.pad, o.pad, o.pad, o.pad]; // top right bottom left
    let ctx, W, H, pal;
    const p = {
      get ctx() { return ctx; }, get w() { return W; }, get h() { return H; }, get palette() { return pal; },
      X: (x) => pad[3] + (x - o.x[0]) / (o.x[1] - o.x[0]) * (W - pad[1] - pad[3]),
      Y: (y) => H - pad[2] - (y - o.y[0]) / (o.y[1] - o.y[0]) * (H - pad[0] - pad[2]),
      range(x, y) { if (x) o.x = x; if (y) o.y = y; return p; },
      color(i) { return typeof i === 'string' ? i : pal.accents[(i || 0) % pal.accents.length]; },
      clear() {
        ({ ctx, w: W, h: H } = fitCanvas(cv));
        pal = palette(cv);
        ctx.clearRect(0, 0, W, H);
        const font = getComputedStyle(cv).fontFamily || 'sans-serif';
        ctx.font = `${o.fontSize || 16}px ${font}`;
        return p;
      },
      axes({ xlabel = '', ylabel = '', ticks = 5, grid = true } = {}) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.fillStyle = pal.mute;
        ctx.textBaseline = 'top';
        const nice = (a, b) => { const s = 10 ** Math.floor(Math.log10((b - a) / ticks)); const m = (b - a) / ticks / s; return (m > 5 ? 10 : m > 2 ? 5 : m > 1 ? 2 : 1) * s; };
        const fmtN = (v, s) => (Math.abs(v) < 1e-9 ? '0' : v.toFixed(Math.max(0, -Math.floor(Math.log10(s)))));
        const sx = nice(o.x[0], o.x[1]), sy = nice(o.y[0], o.y[1]);
        ctx.textAlign = 'center';
        for (let v = Math.ceil(o.x[0] / sx) * sx; v <= o.x[1] + 1e-9; v += sx) {
          if (grid) { ctx.strokeStyle = pal.grid; ctx.beginPath(); ctx.moveTo(p.X(v), pad[0]); ctx.lineTo(p.X(v), H - pad[2]); ctx.stroke(); }
          ctx.fillText(fmtN(v, sx), p.X(v), H - pad[2] + 6);
        }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (let v = Math.ceil(o.y[0] / sy) * sy; v <= o.y[1] + 1e-9; v += sy) {
          if (grid) { ctx.strokeStyle = pal.grid; ctx.beginPath(); ctx.moveTo(pad[3], p.Y(v)); ctx.lineTo(W - pad[1], p.Y(v)); ctx.stroke(); }
          ctx.fillText(fmtN(v, sy), pad[3] - 8, p.Y(v));
        }
        ctx.strokeStyle = pal.mute; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad[3], pad[0]); ctx.lineTo(pad[3], H - pad[2]); ctx.lineTo(W - pad[1], H - pad[2]); ctx.stroke();
        if (xlabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(xlabel, W - pad[1], H - pad[2] - 6); }
        if (ylabel) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(ylabel, pad[3] + 8, pad[0]); }
        ctx.restore();
        return p;
      },
      /** y = f(x) across the x range. { color, width, dash, fill } */
      fn(f, s = {}) {
        const pts = [];
        const n = s.samples || Math.max(60, Math.round(W / 3));
        for (let k = 0; k <= n; k++) { const x = o.x[0] + (o.x[1] - o.x[0]) * k / n; pts.push([x, f(x)]); }
        return p.line(pts, s);
      },
      /** Polyline through [[x, y], …]. */
      line(pts, s = {}) {
        const col = p.color(s.color);
        ctx.save();
        ctx.beginPath();
        pts.forEach(([x, y], k) => (k ? ctx.lineTo(p.X(x), p.Y(y)) : ctx.moveTo(p.X(x), p.Y(y))));
        if (s.fill) {
          ctx.save();
          ctx.lineTo(p.X(pts[pts.length - 1][0]), p.Y(Math.max(o.y[0], 0)));
          ctx.lineTo(p.X(pts[0][0]), p.Y(Math.max(o.y[0], 0)));
          ctx.closePath();
          ctx.globalAlpha = typeof s.fill === 'number' ? s.fill : 0.22;
          ctx.fillStyle = col; ctx.fill();
          ctx.restore();
          ctx.beginPath();
          pts.forEach(([x, y], k) => (k ? ctx.lineTo(p.X(x), p.Y(y)) : ctx.moveTo(p.X(x), p.Y(y))));
        }
        ctx.strokeStyle = col; ctx.lineWidth = s.width || 3; ctx.lineJoin = 'round';
        if (s.dash) ctx.setLineDash(Array.isArray(s.dash) ? s.dash : [8, 6]);
        ctx.globalAlpha = s.alpha || 1;
        ctx.stroke();
        ctx.restore();
        return p;
      },
      /** Dots at [[x, y], …]. { color, r, shape: 'circle' | 'square' | 'x' } */
      points(pts, s = {}) {
        const col = p.color(s.color), r = s.r || 5;
        ctx.save();
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.globalAlpha = s.alpha || 1;
        pts.forEach(([x, y]) => {
          const X = p.X(x), Y = p.Y(y);
          ctx.beginPath();
          if (s.shape === 'square') ctx.rect(X - r, Y - r, 2 * r, 2 * r);
          else if (s.shape === 'x') { ctx.moveTo(X - r, Y - r); ctx.lineTo(X + r, Y + r); ctx.moveTo(X + r, Y - r); ctx.lineTo(X - r, Y + r); ctx.stroke(); return; }
          else ctx.arc(X, Y, r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
        return p;
      },
      /** Normal density N(mu, sigma²) as a curve. */
      gauss(mu, sigma, s = {}) {
        return p.fn((x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)), s);
      },
      vline(x, s = {}) { return p.line([[x, o.y[0]], [x, o.y[1]]], Object.assign({ width: 1.5, dash: true, color: pal.mute }, s)); },
      hline(y, s = {}) { return p.line([[o.x[0], y], [o.x[1], y]], Object.assign({ width: 1.5, dash: true, color: pal.mute }, s)); },
      /** 2×2 covariance ellipse at k standard deviations. */
      ellipse(cx, cy, cov, s = {}) {
        const [[a, b], [, d]] = cov, k = s.k || 2;
        const tr = a + d, det = a * d - b * b, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
        const ang = Math.abs(b) < 1e-12 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
        const pts = [];
        for (let t = 0; t <= 64; t++) {
          const u = t / 64 * Math.PI * 2, ex = k * Math.sqrt(l1) * Math.cos(u), ey = k * Math.sqrt(Math.max(0, l2)) * Math.sin(u);
          pts.push([cx + ex * Math.cos(ang) - ey * Math.sin(ang), cy + ex * Math.sin(ang) + ey * Math.cos(ang)]);
        }
        return p.line(pts, s);
      },
      text(x, y, str, s = {}) {
        ctx.save();
        ctx.fillStyle = s.color ? p.color(s.color) : pal.ink;
        ctx.textAlign = s.align || 'left'; ctx.textBaseline = s.baseline || 'middle';
        if (s.size) ctx.font = `${s.weight || 400} ${s.size}px ${getComputedStyle(cv).fontFamily}`;
        ctx.fillText(str, p.X(x) + (s.dx || 0), p.Y(y) + (s.dy || 0));
        ctx.restore();
        return p;
      },
      /** Coloured legend in the top-right corner: [['label', colorOrIndex], …] */
      legend(items) {
        ctx.save();
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        items.forEach(([label, c], k) => {
          const y = pad[0] + 12 + k * 24;
          ctx.fillStyle = pal.ink; ctx.fillText(label, W - pad[1] - 24, y);
          ctx.fillStyle = p.color(c); ctx.fillRect(W - pad[1] - 16, y - 6, 16, 12);
        });
        ctx.restore();
        return p;
      },
    };
    return p;
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
  function onDocClick(e) {
    const cd = e.target.closest && e.target.closest('[data-countdown]');
    if (cd) {
      const st = cdState(cd);
      if (e.detail === 2) { st.left = parseDur(cd.getAttribute('data-countdown')); st.running = false; }
      else if (st.left > 0) st.running = !st.running;
      cdRender(cd);
    }
    const rv = e.target.closest && e.target.closest('[data-reveal]');
    if (rv) {
      const id = rv.getAttribute('data-reveal');
      const a = document.getElementById(id);
      if (a) { setReveal(rv, !a.hidden); route({ dk: 'reveal', id, hidden: a.hidden }); }
    }
  }
  function setReveal(rv, hidden) {
    const a = document.getElementById(rv.getAttribute('data-reveal'));
    if (!a) return;
    a.hidden = hidden;
    rv.setAttribute('aria-expanded', String(!hidden));
    const showT = rv.getAttribute('data-reveal-text') || L.reveal;
    const hideT = rv.getAttribute('data-hide-text') || L.hide;
    const txt = rv.textContent.trim();
    if (txt === showT || txt === hideT || !txt) rv.textContent = hidden ? showT : hideT;
  }

  // ── Sync: audience screen ⇄ presenter previews ───────────────────────────
  // Slider / input values and revealed answers travel both ways, so moving a
  // slider on either screen moves it on the other. Controls are addressed by
  // slide index + position among that slide's inputs.
  const controlsOf = (s) => Array.from(s.querySelectorAll('input, select, textarea'));
  let applyingRemote = false;   // true while applying a value that came from the other window
  function route(msg) {
    if (applyingRemote) return;
    if (ROLE === 'main') send(presenterWin, msg);
    else if (ROLE === 'mirror') send(window.parent, msg);
  }
  function onControl(e) {
    if (applyingRemote) return;
    const el = e.target;
    const s = slides.find((x) => x.contains(el));
    if (!s) return;
    const n = controlsOf(s).indexOf(el);
    if (n >= 0) route({ dk: 'control', slide: slides.indexOf(s), n, value: el.value, checked: el.checked });
  }
  function applyControl(m) {
    const s = slides[m.slide];
    const el = s && controlsOf(s)[m.n];
    if (!el) return;
    const check = /^(checkbox|radio)$/.test(el.type);
    if (check ? el.checked === m.checked : el.value === m.value) return;
    applyingRemote = true;
    try {
      if (check) el.checked = m.checked; else el.value = m.value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } finally { applyingRemote = false; }
  }
  function applyReveal(m) {
    const btn = document.querySelector(`[data-reveal="${CSS.escape(m.id)}"]`);
    const a = document.getElementById(m.id);
    if (btn && a && a.hidden !== m.hidden) setReveal(btn, m.hidden);
  }
  function slideState(i) {
    const s = slides[i];
    if (!s) return null;
    const reveals = Array.from(s.querySelectorAll('[data-reveal]')).map((b) => {
      const a = document.getElementById(b.getAttribute('data-reveal'));
      return a ? { id: b.getAttribute('data-reveal'), hidden: a.hidden } : null;
    }).filter(Boolean);
    return { dk: 'sync', slide: i, controls: controlsOf(s).map((el) => ({ value: el.value, checked: el.checked })), reveals };
  }
  function applySync(m) {
    m.controls.forEach((c, n) => applyControl({ slide: m.slide, n, value: c.value, checked: c.checked }));
    m.reveals.forEach(applyReveal);
  }
  /** Main window: send the current and next slide's control state to the presenter. */
  function sendSync() {
    if (ROLE !== 'main' || !presenterWin || presenterWin.closed) return;
    [cur, cur + 1].forEach((i) => { const st = slideState(i); if (st) send(presenterWin, st); });
  }

  // ── Classroom tools: blank screen, laser, ink ────────────────────────────
  function setBlank(kind) {
    blank = blank === kind ? null : kind;
    ui.blankEl.style.background = blank === 'white' ? '#fff' : '#000';
    show('blankEl', !!blank);
  }

  let laserOn = false;
  function setLaser(on) {
    laserOn = on === undefined ? !laserOn : on;
    document.documentElement.classList.toggle('dk-laser', laserOn);
    if (!laserOn) show('laser', false);
    else flash(L.laserOn, 1800);
  }
  function onPointerMove(e) {
    if (!laserOn) return;
    ui.laser.style.left = e.clientX + 'px';
    ui.laser.style.top = e.clientY + 'px';
    show('laser', true);
  }

  // Strokes are stored per slide in viewport fractions so they survive resizes.
  const ink = { on: false, strokes: {}, live: null };
  function setDraw(on) {
    ink.on = on === undefined ? !ink.on : on;
    ui.ink.classList.toggle('dk-drawing', ink.on);
    if (ink.on) flash(L.drawOn, 2200);
    drawInk();
  }
  function drawInk() {
    const { ctx, w, h } = fitCanvas(ui.ink);
    ctx.clearRect(0, 0, w, h);
    const list = (ink.strokes[cur] || []).concat(ink.live ? [ink.live] : []);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    list.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width;
      ctx.beginPath();
      s.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
      if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] * w + 0.1, s.pts[0][1] * h);
      ctx.stroke();
    });
  }
  function setupInk() {
    const c = ui.ink;
    const pt = (e) => [e.clientX / innerWidth, e.clientY / innerHeight];
    c.addEventListener('pointerdown', (e) => {
      if (!ink.on) return;
      c.setPointerCapture(e.pointerId);
      ink.live = { color: '#ff2a55', width: Math.max(3, innerWidth / 320), pts: [pt(e)] };
      drawInk();
    });
    c.addEventListener('pointermove', (e) => { if (ink.live) { ink.live.pts.push(pt(e)); drawInk(); } });
    const end = () => {
      if (!ink.live) return;
      (ink.strokes[cur] = ink.strokes[cur] || []).push(ink.live);
      ink.live = null;
      drawInk();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  // ── Presenter view ───────────────────────────────────────────────────────
  const baseUrl = () => location.href.replace(/[?#].*$/, '');
  function send(win, msg) { try { if (win && !win.closed) win.postMessage(msg, '*'); } catch (e) {} }
  function stateMsg() { return { dk: 'state', index: cur, total: slides.length, timer, blank }; }
  function broadcast() { if (ROLE === 'main' && presenterWin && !presenterWin.closed) send(presenterWin, stateMsg()); }

  function openPresenter() {
    if (presenterWin && !presenterWin.closed) { presenterWin.focus(); return; }
    presenterWin = window.open(`${baseUrl()}?dk=presenter#${cur + 1}`, 'deck-kit-presenter', 'width=1280,height=800');
    if (!presenterWin) { flash(L.popup, 4000); return; }
    show('notes', false);
  }

  let pv = null;
  function buildPresenter() {
    const root = ui.root;
    const box = el('div', 'dk-pv', `
      <div class="dk-top"><div class="dk-title"></div><span class="dk-msg"></span><span class="dk-status"></span><span class="dk-clock" title="pause"></span></div>
      <div class="dk-main"><div class="dk-lbl">${esc(L.current)}</div><div class="dk-frame dk-cur"><iframe title="current"></iframe></div></div>
      <div class="dk-side">
        <div><div class="dk-lbl">${esc(L.next)}</div><div class="dk-frame dk-nx"><iframe title="next"></iframe><div class="dk-endcard">${esc(L.end)}</div></div></div>
        <div class="dk-nrow"><div class="dk-lbl">${esc(L.notes)} <span class="dk-meta"></span></div>
          <span class="dk-nstat"></span><button data-n="edit">${esc(L.edit)}</button><button data-n="save">${esc(L.saveFile)}</button></div>
        <div class="dk-pnotes"><div class="dk-tx"></div></div>
      </div>
      <div class="dk-bar"><button data-a="prev">◀</button><button data-a="next">▶</button><button data-a="black">B</button>
        <button data-a="reset">⟲ 0:00</button><span class="dk-pos"></span></div>`);
    root.appendChild(box);
    const [fc, fn] = box.querySelectorAll('iframe');
    const url = (i) => `${baseUrl()}?dk=mirror#${i + 1}`;
    fc.src = url(cur);
    fn.src = url(Math.min(slides.length - 1, cur + 1));
    pv = {
      box, fc, fn,
      title: box.querySelector('.dk-title'), clock: box.querySelector('.dk-clock'), status: box.querySelector('.dk-status'),
      msg: box.querySelector('.dk-msg'), notes: box.querySelector('.dk-pnotes .dk-tx'), meta: box.querySelector('.dk-meta'),
      pos: box.querySelector('.dk-pos'), nxFrame: box.querySelector('.dk-nx'),
      notesBox: box.querySelector('.dk-pnotes'), nstat: box.querySelector('.dk-nstat'), editBtn: box.querySelector('[data-n="edit"]'),
    };
    pv.clock.addEventListener('click', () => timerCmd('pause'));
    pv.editBtn.addEventListener('click', () => setEditing(!editing));
    box.querySelector('[data-n="save"]').addEventListener('click', saveNotesToFile);
    let typingTimer = null;
    pv.notes.addEventListener('input', () => {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        const html = pv.notes.textContent.trim() ? pv.notes.innerHTML.trim() : '';
        editNotes(cur, html);
        send(window.opener, { dk: 'notes', slide: cur, html });
      }, 250);
    });
    renderNoteStatus();
    box.querySelector('.dk-bar').addEventListener('click', (e) => {
      const a = e.target.closest('button') && e.target.closest('button').dataset.a;
      if (a === 'prev') step(-1);
      if (a === 'next') step(1);
      if (a === 'black') send(window.opener, { dk: 'key', key: 'b' });
      if (a === 'reset') timerCmd('reset');
    });
    const fit = () => box.querySelectorAll('.dk-frame').forEach((f) => {
      f.querySelector('iframe').style.transform = `scale(${f.clientWidth / 1600})`;
    });
    new ResizeObserver(fit).observe(box);
    fit();
    // Previews load asynchronously; re-send their slide once they're ready.
    const reloaded = () => setTimeout(() => { renderPresenter(); send(window.opener, { dk: 'want-sync' }); }, 300);
    fc.addEventListener('load', reloaded);
    fn.addEventListener('load', reloaded);
    pv.msg.textContent = window.opener ? L.waiting : L.lost;
    // Say hello until the audience window answers; notice if it goes away.
    let heard = false;
    pv.heard = () => { heard = true; };
    const ping = () => {
      if (!window.opener || window.opener.closed) { pv.msg.textContent = L.lost; return; }
      if (!heard) send(window.opener, { dk: 'hello' });
    };
    ping();
    setInterval(ping, 1500);
    renderPresenter();
  }
  function renderPresenter() {
    if (!pv || cur < 0) return;
    const s = slides[cur];
    pv.title.textContent = `${cur + 1}. ${titleOf(s, cur)}`;
    pv.notes.innerHTML = editing ? (slides[cur] ? notesOf(slides[cur], cur) : '') : notesHtml(cur);
    pv.meta.textContent = metaText(cur) ? '· ' + metaText(cur) : '';
    pv.pos.textContent = `${cur + 1} / ${slides.length}`;
    send(pv.fc.contentWindow, { dk: 'go', index: cur });
    const end = cur + 1 >= slides.length;
    pv.nxFrame.classList.toggle('dk-end', end);
    if (!end) send(pv.fn.contentWindow, { dk: 'go', index: cur + 1 });
    lastTimerText = '';
    renderTimer();
  }

  function onMessage(e) {
    const m = e.data;
    if (!m || typeof m !== 'object' || !m.dk) return;
    if (ROLE === 'main') {
      // A reloaded audience window re-adopts the presenter that says hello.
      if (m.dk === 'hello' && (!presenterWin || presenterWin.closed)) presenterWin = e.source;
      if (e.source !== presenterWin) return;
      if (m.dk === 'hello') { broadcast(); sendSync(); }
      if (m.dk === 'want-sync') sendSync();
      if (m.dk === 'go') goto(m.index);
      if (m.dk === 'timer') timerCmd(m.cmd);
      if (m.dk === 'key') handleKey(m.key, m.shift);
      if (m.dk === 'control') applyControl(m);
      if (m.dk === 'reveal') applyReveal(m);
      if (m.dk === 'notes') { editNotes(m.slide, m.html); if (m.slide === cur) renderNotes(); }
      if (m.dk === 'notes-saved') { notesEdits.clear(); clearDraft(); }
    } else if (ROLE === 'presenter') {
      const fromPreview = pv && (e.source === pv.fc.contentWindow || e.source === pv.fn.contentWindow);
      if (fromPreview) {
        // Interaction inside a preview: forward to the audience screen.
        if (m.dk === 'control' || m.dk === 'reveal') send(window.opener, m);
        if (m.dk === 'key' && !handleKey(m.key, m.shift)) navKey(m.key, m.shift);
        return;
      }
      if (e.source !== window.opener) return;
      if (m.dk === 'state') {
        pv.msg.textContent = '';
        pv.heard();
        timer = m.timer;
        if (m.index !== cur) { cur = m.index; renderPresenter(); }
        lastTimerText = '';
        renderTimer();
      }
      if (m.dk === 'sync' || m.dk === 'control' || m.dk === 'reveal') {
        const target = m.slide === cur ? pv.fc : m.slide === cur + 1 ? pv.fn : m.dk === 'reveal' ? pv.fc : null;
        if (target) send(target.contentWindow, m);
      }
    } else if (ROLE === 'mirror') {
      if (e.source !== window.parent) return;
      if (m.dk === 'go') { pinned = m.index; goto(m.index); }
      if (m.dk === 'sync') applySync(m);
      if (m.dk === 'control') applyControl(m);
      if (m.dk === 'reveal') applyReveal(m);
    }
  }

  // ── Editing speaker notes (presenter view) ───────────────────────────────
  // Edits apply to the live deck at once and are kept as a draft in
  // localStorage. "Save" writes them into the deck's own HTML file through
  // the File System Access API (Chrome/Edge): the original source is read and
  // only the edited <aside class="notes"> are replaced, so nothing from the
  // running presentation leaks into the file. Elsewhere it downloads
  // notes.json for scripts/apply-notes.mjs.
  const notesEdits = new Map();      // slide index → notes HTML ('' = remove)
  const DRAFT = 'deck-kit-notes:' + location.pathname;
  let editing = false;
  let fileHandle = null;

  function setNotesDom(root, list, i, html) {
    const s = list[i];
    if (!s) return;
    let a = s.querySelector('aside.notes');
    if (!html) { if (a) a.remove(); return; }
    if (!a) {
      a = root.createElement('aside');
      a.className = 'notes';
      s.append(root.createTextNode('\n  '), a, root.createTextNode('\n'));
    }
    a.innerHTML = html;
  }
  function editNotes(i, html) {
    notesEdits.set(i, html);
    setNotesDom(document, slides, i, html);
    try { localStorage.setItem(DRAFT, JSON.stringify(Object.fromEntries(notesEdits))); } catch (e) {}
    renderNoteStatus();
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT); } catch (e) {} renderNoteStatus(); }
  function loadDraft() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (e) {}
    if (!d) return 0;
    Object.entries(d).forEach(([i, html]) => { notesEdits.set(+i, html); setNotesDom(document, slides, +i, html); });
    return notesEdits.size;
  }
  function renderNoteStatus(msg) {
    if (!pv) return;
    pv.nstat.textContent = msg || (notesEdits.size ? fmt(L.unsaved, { n: notesEdits.size }) : '');
  }
  function setEditing(on) {
    editing = on;
    pv.notes.contentEditable = on ? 'true' : 'false';
    pv.notesBox.classList.toggle('dk-editing', on);
    pv.editBtn.textContent = on ? L.done : L.edit;
    renderPresenter();
    if (on) pv.notes.focus();
  }

  /** Find each slide's [start, end) in the HTML source text: the offset of
   *  its opening tag and of its closing tag. Mirrors findAdapter(): children
   *  of <deck-stage>, else top-level `.slide` elements. Comments and the raw
   *  text of script/style/textarea are skipped; unclosed tags are tolerated. */
  function slideRanges(src) {
    const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
    const tagRe = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
    const hasDeckStage = /<deck-stage[\s>]/i.test(src.replace(/<!--[\s\S]*?-->/g, ''));
    const stack = [], ranges = [];
    let m;
    while ((m = tagRe.exec(src))) {
      if (!m[2]) continue;
      const name = m[2].toLowerCase();
      if (m[1]) { // closing tag: pop to the matching opener
        for (let k = stack.length - 1; k >= 0; k--) {
          if (stack[k].name !== name) continue;
          const [open] = stack.splice(k);
          if (open.slide) ranges.push([open.start, m.index]);
          break;
        }
        continue;
      }
      const cls = (m[3].match(/\sclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i) || [])[1] || '';
      const parent = stack[stack.length - 1];
      const slide = hasDeckStage
        ? !!parent && parent.name === 'deck-stage' && !/^(script|style|template)$/.test(name)
        : /(^|\s|["'])slide(\s|["']|$)/.test(cls) && !stack.some((x) => x.slide);
      if (VOID.test(name) || m[4]) { if (slide) ranges.push([m.index, m.index + m[0].length, true]); continue; }
      stack.push({ name, start: m.index, slide });
      if (/^(script|style|textarea|title)$/.test(name)) {
        const close = src.toLowerCase().indexOf('</' + name, tagRe.lastIndex);
        tagRe.lastIndex = close < 0 ? src.length : close;
      }
    }
    return ranges.sort((x, y) => x[0] - y[0]);
  }

  /** Replace only the edited <aside class="notes"> in the source text; every
   *  other byte stays as it was. Returns null if the slides can't be matched. */
  function patchNotesText(src, edits, count) {
    const ranges = slideRanges(src);
    if (ranges.length !== count || ranges.some((r) => r[2])) return null;
    const asideRe = /<aside\b[^>]*\sclass\s*=\s*(?:"[^"]*\bnotes\b[^"]*"|'[^']*\bnotes\b[^']*'|notes\b)[^>]*>/i;
    let out = src;
    // Work from the last slide back so earlier offsets stay valid.
    [...edits.entries()].sort((x, y) => y[0] - x[0]).forEach(([i, html]) => {
      const [start, end] = ranges[i];
      const body = out.slice(start, end);
      const am = body.match(asideRe);
      if (am) {
        const open = start + am.index;
        const close = out.indexOf('</aside>', open);
        if (close < 0 || close > end) return;
        if (html) out = out.slice(0, open + am[0].length) + html + out.slice(close);
        else {
          // Drop the aside together with the whitespace line it sat on.
          const lineStart = out.lastIndexOf('\n', open - 1);
          const from = /^\s*$/.test(out.slice(lineStart + 1, open)) ? lineStart : open;
          out = out.slice(0, from) + out.slice(close + '</aside>'.length);
        }
      } else if (html) {
        const lineStart = out.lastIndexOf('\n', end - 1);
        const indent = (out.slice(lineStart + 1, end).match(/^[ \t]*$/) || [''])[0];
        const inner = indent + (indent.includes('\t') ? '\t' : '  ');
        const atLineStart = /^[ \t]*$/.test(out.slice(lineStart + 1, end));
        out = atLineStart
          ? out.slice(0, lineStart + 1) + `${inner}<aside class="notes">${html}</aside>\n` + out.slice(lineStart + 1)
          : out.slice(0, end) + `<aside class="notes">${html}</aside>` + out.slice(end);
      }
    });
    return out;
  }

  /** Put the edited notes into an HTML source string: a minimal text edit when
   *  the slides can be located in the source, otherwise a parse-and-serialise
   *  (which doesn't run scripts, but normalises formatting). */
  function patchNotes(src, edits, count) {
    const exact = patchNotesText(src, edits, count);
    if (exact != null) return exact;
    const doc = new DOMParser().parseFromString(src, 'text/html');
    const ds = doc.querySelector('deck-stage');
    const list = ds
      ? Array.from(ds.children).filter((e) => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName))
      : Array.from(doc.querySelectorAll('.slide')).filter((s) => !s.parentElement.closest('.slide'));
    if (list.length !== count) throw new Error(`the file has ${list.length} slides, the deck shows ${count}`);
    edits.forEach((html, i) => setNotesDom(doc, list, i, html));
    const dt = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '<!doctype html>';
    return dt + '\n' + doc.documentElement.outerHTML + '\n';
  }

  async function saveNotesToFile() {
    if (!notesEdits.size) { renderNoteStatus(L.nothing); return; }
    const deckName = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    if (window.showOpenFilePicker) {
      try {
        if (!fileHandle) {
          renderNoteStatus(L.pickDeck);
          [fileHandle] = await window.showOpenFilePicker({ types: [{ description: 'HTML', accept: { 'text/html': ['.html', '.htm'] } }] });
          if (fileHandle.name !== deckName && !confirm(fmt(L.otherFile, { a: fileHandle.name, b: deckName }))) { fileHandle = null; renderNoteStatus(); return; }
        }
        let perm = await fileHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') perm = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') throw new Error('permission denied');
        const out = patchNotes(await (await fileHandle.getFile()).text(), notesEdits, slides.length);
        const w = await fileHandle.createWritable();
        await w.write(out);
        await w.close();
        notesEdits.clear();
        clearDraft();
        send(window.opener, { dk: 'notes-saved' });
        renderNoteStatus(fmt(L.saved, { f: fileHandle.name }));
        return;
      } catch (e) {
        if (e.name === 'AbortError') { renderNoteStatus(); return; }
        renderNoteStatus(fmt(L.saveFailed, { e: e.message }));
        if (!/slides/.test(e.message)) return;
      }
    }
    // No File System Access (Firefox, Safari): hand over a notes.json to merge.
    const blob = new Blob([JSON.stringify({ deck: deckName, slides: slides.length, notes: Object.fromEntries(notesEdits) }, null, 2)], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notes.json';
    document.body.appendChild(a); a.click(); a.remove();
    renderNoteStatus(L.downloaded);
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
    if (i > 0 && ROLE === 'main') startTimer();
    if (!adapter.ownsHash && ROLE === 'main') { try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {} }
    renderNotes();
    renderTimer();
    if (ink.on || ink.strokes[i] || ink.strokes[prev]) drawInk();
    broadcast();
    sendSync();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (ROLE !== 'presenter') {
      const i = adapter.index();
      if (pending) {
        if (i === pending.i || now > pending.until) pending = null;
        else if (now >= pending.next) { pending.next = now + 150; adapter.go(pending.i); }
      }
      if (i !== cur && i >= 0 && i < slides.length) onChange(i, cur);
      // A preview follows the audience screen only; undo moves the template made on its own.
      if (ROLE === 'mirror' && pinned != null && !pending && i !== pinned) goto(pinned);
      if (cur >= 0) widgetsOn(slides[cur]).forEach((w) => call(w, 'tick', dt));
      cdTick(dt);
    }
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
      drawInk();
    });
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  const NAV_KEYS = /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|PageUp|PageDown| |Spacebar)$/;
  /** Shortcuts shared by the main and presenter windows. Returns true if used. */
  function handleKey(key, shift) {
    if (ROLE === 'presenter' && /^[bBwWlLdDcC.]$|^Backspace$/.test(key)) { send(window.opener, { dk: 'key', key, shift }); return true; }
    switch (key) {
      case 'n': case 'N': if (ROLE === 'main') show('notes'); break;
      case 'm': case 'M': show('menu'); break;
      case 'p': case 'P': if (ROLE === 'main') openPresenter(); break;
      case 't': if (ROLE === 'main') { show('tmr'); renderTimer(); } break;
      case 'T': timerCmd('reset'); flash(L.elapsed + ' 0:00'); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'b': case 'B': case '.': setBlank('black'); broadcast(); break;
      case 'w': case 'W': setBlank('white'); broadcast(); break;
      case 'l': case 'L': setLaser(); break;
      case 'd': case 'D': setDraw(); break;
      case 'c': case 'C': if (ink.strokes[cur]) { delete ink.strokes[cur]; drawInk(); } else return false; break;
      case 'Backspace': if (ink.on && ink.strokes[cur] && ink.strokes[cur].length) { ink.strokes[cur].pop(); drawInk(); } else return false; break;
      case '?': show('help'); break;
      case 'Escape':
        ['menu', 'help', 'notes'].forEach((p) => show(p, false));
        if (ink.on) setDraw(false);
        if (laserOn) setLaser(false);
        if (blank) setBlank(blank);
        break;
      default: return false;
    }
    return true;
  }

  function onKey(e) {
    if (synthetic) return;
    // Events from our shadow UI are retargeted to the host; look at the real target.
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (editing && e.key === 'Escape') { setEditing(false); e.preventDefault(); return; }
    const typing = t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) ||
      (t.tagName === 'INPUT' && !/^(range|checkbox|radio|button|submit|reset|color)$/.test(t.type)));
    const onControl = t && t.tagName === 'INPUT' && /^(range|checkbox|radio)$/.test(t.type);
    // Let sliders and inputs keep their keys: stop the deck from seeing them.
    if ((typing || onControl) && NAV_KEYS.test(e.key)) { e.stopImmediatePropagation(); return; }
    if (typing) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P') && ROLE === 'main') {
      e.preventDefault(); e.stopImmediatePropagation();
      api.print();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // While the menu is open, arrow keys move between rows instead of slides.
    if (ui.menu.classList.contains('dk-show') && /^(ArrowUp|ArrowDown)$/.test(e.key)) {
      const bs = Array.from(ui.menu.querySelectorAll('button'));
      const k = bs.indexOf(ui.root.activeElement);
      const nb = bs[Math.max(0, Math.min(bs.length - 1, k + (e.key === 'ArrowDown' ? 1 : -1)))];
      if (nb) nb.focus();
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    if (handleKey(e.key, e.shiftKey)) { e.preventDefault(); e.stopImmediatePropagation(); return; }

    // Navigation: <deck-stage> keeps its own handler in the main window;
    // everywhere else deck-kit drives it so presses queue instead of dropping.
    if (adapter.ownsKeys && ROLE === 'main') return;
    if (navKey(e.key, e.shiftKey)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }

  /** Navigation keys. Returns true if the key moved (or tried to move) the deck. */
  function navKey(key, shift) {
    let d = null, abs = null;
    if (/^(ArrowRight|ArrowDown|PageDown| |Spacebar)$/.test(key)) d = 1;
    else if (/^(ArrowLeft|ArrowUp|PageUp)$/.test(key)) d = -1;
    else if (key === 'Home') abs = 0;
    else if (key === 'End') abs = slides.length - 1;
    else if (/^[0-9]$/.test(key)) abs = key === '0' ? 9 : +key - 1;
    else if ((key === 'r' || key === 'R') && !shift) abs = 0;
    if (d === null && abs === null) return false;
    if (d !== null) step(d); else if (abs < slides.length) goto(abs);
    return true;
  }

  /** Inside a presenter preview: keys belong to the presenter window. */
  function onMirrorKey(e) {
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) ||
      (t.tagName === 'INPUT' && !/^(range|checkbox|radio|button|submit|reset|color)$/.test(t.type)));
    const onControl = t && t.tagName === 'INPUT' && /^(range|checkbox|radio)$/.test(t.type);
    if ((typing || onControl) && NAV_KEYS.test(e.key)) { e.stopImmediatePropagation(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    send(window.parent, { dk: 'key', key: e.key, shift: e.shiftKey });
    e.preventDefault(); e.stopImmediatePropagation();
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
    // deck-stage has its own tap zones; scroll-based decks keep native scrolling.
    if (adapter.nativeScroll) return;
    let x0 = null, y0 = null;
    const skip = 'input, button, select, textarea, a, canvas, label, [data-noswipe], #deck-kit';
    // Capture phase + stopPropagation: the template's own swipe code would
    // otherwise move a second time.
    const own = adapter.mode !== 'deck-stage';
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest && e.target.closest(skip)) { x0 = null; return; }
      const t = e.changedTouches[0];
      x0 = t.clientX; y0 = t.clientY;
      if (own) e.stopPropagation();
    }, { passive: true, capture: true });
    window.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      x0 = null;
      if (own) e.stopPropagation();
      if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (own && Math.abs(dy) > 60 && Math.abs(dy) > 1.5 * Math.abs(dx)) step(dy < 0 ? 1 : -1);
    }, { passive: true, capture: true });

    if (matchMedia('(orientation: portrait) and (max-width: 700px)').matches) {
      const r = el('div', 'dk-panel dk-rotate dk-show', `${esc(L.rotate)}<button type="button">${esc(L.close)}</button>`);
      r.querySelector('button').addEventListener('click', () => r.remove());
      ui.root.appendChild(r);
    }
  }

  // ── Print ────────────────────────────────────────────────────────────────
  // What each slide looked like while it was on screen during visitAll().
  // Templates often reset charts and counters when a slide is left; printing
  // re-applies these snapshots (inline styles, leaf text, canvas pixels).
  const visitSnaps = new Map();
  const isWidgetCanvas = (cv) => widgets.some((w) => w.target === cv || (w.target && w.target.contains && w.target.contains(cv)) || w.target === cv.id);
  function snapSlide(s) {
    const recs = [];
    s.querySelectorAll('*').forEach((e) => {
      if (e.closest('aside.notes')) return;
      const r = { el: e, style: e.getAttribute('style') };
      if (!e.firstElementChild && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(e.tagName)) r.text = e.textContent;
      if (e.tagName === 'CANVAS' && e.width && !isWidgetCanvas(e)) { try { r.img = e.toDataURL('image/png'); } catch (x) {} }
      recs.push(r);
    });
    visitSnaps.set(s, recs);
  }

  /** Resolve once slide i stops changing: its text and inline styles are the
   *  same on two checks in a row (count-up numbers, growing bars done).
   *  Finite CSS animations must finish; canvas pixels and infinite keyframe
   *  loops are ignored, so live widgets and ambient motion don't hold it up. */
  async function settleSlide(i, { min = 150, max = 3000 } = {}) {
    const s = slides[i];
    if (!s) return;
    // Position too, so scroll-snap decks count as settled only once scrolling stops.
    const sig = () => Math.round(s.getBoundingClientRect().top) + '|' + s.textContent + '|' + Array.from(s.querySelectorAll('[style]'), (e) => e.getAttribute('style')).join(';');
    const t0 = performance.now();
    await sleep(min);
    let prev = sig(), same = 0;
    // Finite CSS animations / transitions on the slide (entrances) must end too;
    // infinite loops (ambient motion) are ignored.
    const running = () => (document.getAnimations ? document.getAnimations() : []).some((an) => {
      const target = an.effect && an.effect.target;
      if (!target || !(s === target || s.contains(target)) || an.playState !== 'running') return false;
      return isFinite(an.effect.getComputedTiming().endTime);
    });
    while ((same < 2 || running()) && performance.now() - t0 < max) {
      await sleep(150);
      const now = sig();
      same = now === prev ? same + 1 : 0;
      prev = now;
    }
  }

  /** Visit every slide once so templates that render on entry (charts,
   *  counters) fill in their content, ending on the slide we started from. */
  async function visitAll({ settle, progress } = {}) {
    const wait = settle != null ? settle : adapter.mode === 'deck-stage' ? 150 : 450;
    const home = cur;
    const order = slides.map((_, i) => i).filter((i) => i !== home).concat([home]);
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      goto(i);
      const until = performance.now() + 2500;
      while (adapter.index() !== i && performance.now() < until) await sleep(50);
      const extra = parseFloat(slides[i].getAttribute('data-print-delay'));
      await settleSlide(i, { min: isFinite(extra) ? extra : wait });
      snapSlide(slides[i]);
      if (progress) progress(k + 1, order.length);
    }
  }

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
    // Bring back what visitAll() saw on slides the template has since reset.
    const snapImg = new Map();
    visitSnaps.forEach((recs, s) => {
      if (s === slides[cur]) return;
      recs.forEach((r) => {
        if (!r.el.isConnected) return;
        const st = r.el.getAttribute('style');
        if (st !== r.style) {
          if (r.style == null) r.el.removeAttribute('style'); else r.el.setAttribute('style', r.style);
          undo.push(() => { if (st == null) r.el.removeAttribute('style'); else r.el.setAttribute('style', st); });
        }
        if (r.text != null && !r.el.firstElementChild && r.el.textContent !== r.text) {
          const tx = r.el.textContent;
          r.el.textContent = r.text;
          undo.push(() => { r.el.textContent = tx; });
        }
        if (r.img) snapImg.set(r.el, r.img);
      });
    });
    // Redraw every widget (not just the current slide), then freeze canvases
    // into images so they survive the print pipeline.
    widgets.forEach((w) => { if (w.slide) { call(w, 'enter'); call(w, w.hooks.print ? 'print' : 'draw'); } });
    slides.forEach((s) => s.querySelectorAll('canvas').forEach((cv) => {
      if (!cv.width || !cv.offsetWidth) return;
      let src = snapImg.get(cv);
      if (!src) { try { src = cv.toDataURL('image/png'); } catch (e) { return; } }
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
    version: '2.0.0',
    role: ROLE,
    get index() { return cur; },
    get length() { return slides.length; },
    get mode() { return adapter ? adapter.mode : null; },
    get slides() { return slides.slice(); },
    goTo: (i) => adapter && goto(i),
    next: () => adapter && step(1),
    prev: () => adapter && step(-1),
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
    bind,
    plot,
    palette,
    titleOf: (i) => slides[i] ? titleOf(slides[i], i) : '',
    notesOf: (i) => slides[i] ? notesOf(slides[i], i) : '',
    get plan() { return { start: plan.start.slice(), mins: plan.mins.slice(), total: plan.total }; },
    toggle: (name, on) => ui && show({ notes: 'notes', menu: 'menu', timer: 'tmr', help: 'help' }[name], on),
    presenter: () => openPresenter(),
    timer: {
      start: startTimer, reset: () => timerCmd('reset'), pause: () => timerCmd('pause'),
      get elapsed() { return elapsed(); },
    },
    visitAll,
    settle: settleSlide,
    preparePrint,
    cleanupPrint,
    patchNotes,
    /** Visit every slide (so on-entry content renders), then open the print dialog. */
    async print() {
      if (document.body.getAttribute('data-print-visit') !== 'off') {
        await visitAll({ progress: (i, n) => flash(fmt(L.printing, { i, n }), 1500) });
      }
      show('toast', false);
      preparePrint();
      window.print();
    },
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
    window.addEventListener('message', onMessage);

    if (ROLE === 'presenter') {
      const m = (location.hash || '').match(/^#(\d+)$/);
      cur = m ? Math.max(0, Math.min(slides.length - 1, +m[1] - 1)) : 0;
      loadDraft();
      buildPresenter();
      window.addEventListener('keydown', onKey, true);
      requestAnimationFrame(loop);
      return;
    }

    if (ROLE === 'mirror') {
      // Preview inside the presenter window: slides only, no chrome, no input.
      ui.host.style.display = 'none';
      const m = (location.hash || '').match(/^#(\d+)$/);
      pinned = m ? Math.max(0, Math.min(slides.length - 1, +m[1] - 1)) : 0;
      if (!adapter.ownsHash && pinned > 0) goto(pinned);
      document.addEventListener('input', onControl, true);
      document.addEventListener('change', onControl, true);
      document.addEventListener('click', onDocClick);
      window.addEventListener('keydown', onMirrorKey, true);
      requestAnimationFrame(loop);
      return;
    }

    setupTouch();
    setupInk();
    document.querySelectorAll('[data-countdown]').forEach(cdRender);
    document.addEventListener('click', onDocClick);
    document.addEventListener('input', onControl, true);
    document.addEventListener('change', onControl, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('beforeprint', preparePrint);
    window.addEventListener('afterprint', cleanupPrint);
    window.addEventListener('beforeunload', () => { if (presenterWin && !presenterWin.closed) presenterWin.close(); });
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
      const restored = loadDraft();
      if (restored) { renderNotes(); flash(fmt(L.restored, { n: restored }), 5000); }
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
