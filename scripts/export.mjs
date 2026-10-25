#!/usr/bin/env node
/**
 * export.mjs — render a deck with headless Chrome into files you can share.
 *
 *   node scripts/export.mjs path/to/deck.html [options]
 *
 *   --out=DIR        output folder (default: <deck>-export/ next to the deck)
 *   --pdf            slides.pdf — one slide per page
 *   --png            slide-01.png … — one image per slide
 *   --handout        handout.pdf — A4, each slide with its speaker notes
 *   --size=1920x1080 render size for PNG / handout images (default 1920x1080)
 *   --settle=600     ms to wait on each slide for charts / entry animations
 *
 * With none of --pdf/--png/--handout, all three are produced. Every slide is
 * visited before printing, so content a template draws on entry (charts,
 * counters) is filled in — unlike a plain browser print.
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { launch, openDeck, showSlide, sleep } from './lib/browser.mjs';

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? true];
}));
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Usage: node scripts/export.mjs <deck.html> [--pdf] [--png] [--handout] [--out=DIR] [--size=1920x1080] [--settle=600]');
  process.exit(1);
}
const deck = resolve(file);
const want = { pdf: !!opt.pdf, png: !!opt.png, handout: !!opt.handout };
if (!want.pdf && !want.png && !want.handout) want.pdf = want.png = want.handout = true;
const [W, H] = String(opt.size || '1920x1080').split('x').map(Number);
const settle = +(opt.settle || 600);
const out = resolve(opt.out || join(dirname(deck), basename(deck).replace(/\.html?$/i, '') + '-export'));
mkdirSync(out, { recursive: true });

const browser = await launch();
const page = await openDeck(browser, deck, { width: W, height: H });
const n = await page.evaluate(() => DeckKit.length);
const lang = await page.evaluate(() => document.documentElement.lang || 'en');
const title = await page.evaluate(() => document.title || '');
const done = [];

// ── PNG (also feeds the handout) ───────────────────────────────────────────
const shots = [];
if (want.png || want.handout) {
  // Hide presenter chrome and the template's fixed controls (dots, counters,
  // deck-stage's pill) so images show only the slide.
  await page.evaluate(() => {
    const st = document.createElement('style');
    st.id = 'export-hide';
    st.textContent = '#deck-kit { display: none !important; } .dk-export-hide { visibility: hidden !important; }';
    document.head.appendChild(st);
    const ds = document.querySelector('deck-stage');
    if (ds && ds.shadowRoot) ds.shadowRoot.querySelectorAll('.overlay, .rail, .rail-resize').forEach((e) => (e.style.display = 'none'));
    const slides = DeckKit.slides;
    document.body.querySelectorAll('*').forEach((e) => {
      if (slides.some((s) => s.contains(e) || e.contains(s))) return;
      if (getComputedStyle(e).position === 'fixed') e.classList.add('dk-export-hide');
    });
  });
  for (let i = 0; i < n; i++) {
    await showSlide(page, i, settle);
    const buf = Buffer.from(await page.screenshot({ type: 'png' }));
    shots.push(buf);
    if (want.png) writeFileSync(join(out, `slide-${String(i + 1).padStart(2, '0')}.png`), buf);
  }
  if (want.png) done.push(`${n} PNG files`);
  await page.evaluate(() => {
    document.getElementById('export-hide').remove();
    document.querySelectorAll('.dk-export-hide').forEach((e) => e.classList.remove('dk-export-hide'));
    const ds = document.querySelector('deck-stage');
    if (ds && ds.shadowRoot) ds.shadowRoot.querySelectorAll('.overlay, .rail, .rail-resize').forEach((e) => (e.style.display = ''));
  });
}

// ── PDF ────────────────────────────────────────────────────────────────────
if (want.pdf) {
  await page.evaluate((s) => DeckKit.visitAll({ settle: s }), want.png ? 80 : settle);
  await page.evaluate(() => DeckKit.preparePrint());
  await page.emulateMediaType('print');
  writeFileSync(join(out, 'slides.pdf'), await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  await page.emulateMediaType('screen');
  await page.evaluate(() => DeckKit.cleanupPrint());
  done.push('slides.pdf');
}

// ── Handout ────────────────────────────────────────────────────────────────
if (want.handout) {
  const meta = await page.evaluate(() => DeckKit.slides.map((s, i) => ({
    title: DeckKit.titleOf(i), notes: DeckKit.notesOf(i), sec: s.getAttribute('data-sec') || '', min: s.getAttribute('data-min') || '',
  })));
  const vi = lang.startsWith('vi');
  const T = vi ? { notes: 'Ghi chú', min: 'phút', none: '—' } : { notes: 'Notes', min: 'min', none: '—' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pages = meta.map((m, i) => `
    <section>
      <header><b>${i + 1}. ${esc(m.title)}</b><span>${esc([m.sec, m.min && `${m.min} ${T.min}`].filter(Boolean).join(' · '))}</span></header>
      <img src="data:image/png;base64,${shots[i].toString('base64')}">
      <div class="notes"><div class="lbl">${T.notes}</div>${m.notes || T.none}</div>
    </section>`).join('');
  const html = `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page { size: A4; margin: 14mm 14mm 16mm; }
    body { font: 11pt/1.5 -apple-system, "Segoe UI", system-ui, sans-serif; color: #111; margin: 0; }
    section { break-after: page; display: flex; flex-direction: column; gap: 5mm; }
    section:last-child { break-after: auto; }
    header { display: flex; justify-content: space-between; gap: 6mm; border-bottom: 1px solid #ccc; padding-bottom: 2mm; }
    header span { color: #666; }
    img { width: 100%; border: 1px solid #ddd; border-radius: 2mm; }
    .notes { font-size: 11.5pt; }
    .notes .lbl { font-size: 9pt; text-transform: uppercase; letter-spacing: .08em; color: #888; margin-bottom: 1mm; }
    .notes p + p { margin-top: .5em; }
  </style></head><body>${pages}</body></html>`;
  const hp = await browser.newPage();
  await hp.setContent(html, { waitUntil: 'load' });
  writeFileSync(join(out, 'handout.pdf'), await hp.pdf({ format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8pt;color:#888;width:100%;text-align:center"><span>${esc(title)}</span> · <span class="pageNumber"></span>/<span class="totalPages"></span></div>` }));
  await hp.close();
  done.push('handout.pdf');
}

if (page._errors.length) console.warn('Page errors:\n  ' + page._errors.join('\n  '));
await browser.close();
console.log(`Exported ${n} slides to ${out}: ${done.join(', ')}`);
