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
 *   --compact        slides-compact.pdf — one JPEG per page: small enough to
 *                    e-mail (a few MB), but text is not selectable
 *   --pptx           slides.pptx — one full-slide image per slide, speaker
 *                    notes in PowerPoint's notes pane (opens in PowerPoint,
 *                    Keynote, Google Slides; text is not editable)
 *   --pptx-editable  slides-editable.pptx — real PowerPoint text boxes over a
 *                    picture of each slide's design, plus fonts/ to install
 *                    (experimental: needs the deck's fonts on the viewer's machine)
 *   --size=1920x1080 render size for images (default 1920x1080)
 *   --quality=85     JPEG quality for --compact / --pptx
 *   --settle=400     minimum ms on each slide; it then waits until the slide
 *                    stops changing (count-ups, growing bars), up to 3 s
 *
 * With no format flag, --pdf --png --handout are produced. Every slide is
 * visited before printing, so content a template draws on entry (charts,
 * counters) is filled in — unlike a plain browser print.
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { launch, openDeck, showSlide, sleep } from './lib/browser.mjs';
import { buildEditablePptx } from './lib/pptx-editable.mjs';

const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? true];
}));
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Usage: node scripts/export.mjs <deck.html> [--pdf] [--png] [--handout] [--compact] [--pptx] [--pptx-editable] [--out=DIR] [--size=1920x1080] [--quality=85] [--settle=400]');
  process.exit(1);
}
const deck = resolve(file);
const want = { pdf: !!opt.pdf, png: !!opt.png, handout: !!opt.handout, compact: !!opt.compact, pptx: !!opt.pptx, editable: !!opt['pptx-editable'] };
if (!Object.values(want).some(Boolean)) want.pdf = want.png = want.handout = true;
const quality = Math.max(30, Math.min(100, +(opt.quality || 85)));
const [W, H] = String(opt.size || '1920x1080').split('x').map(Number);
const settle = +(opt.settle || 400);
const out = resolve(opt.out || join(dirname(deck), basename(deck).replace(/\.html?$/i, '') + '-export'));
mkdirSync(out, { recursive: true });

const browser = await launch();
const page = await openDeck(browser, deck, { width: W, height: H });
const n = await page.evaluate(() => DeckKit.length);
const lang = await page.evaluate(() => document.documentElement.lang || 'en');
const title = await page.evaluate(() => document.title || '');
const done = [];

// Slide titles and notes (HTML for the handout, plain text for PowerPoint).
const meta = await page.evaluate(() => DeckKit.slides.map((s, i) => {
  const d = document.createElement('div');
  d.innerHTML = DeckKit.notesOf(i).replace(/<br\s*\/?>|<\/(p|li|div)>/gi, '\n$&');
  return {
    title: DeckKit.titleOf(i), notes: DeckKit.notesOf(i), notesText: d.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
    sec: s.getAttribute('data-sec') || '', min: s.getAttribute('data-min') || '',
  };
}));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── Screenshots (PNG files, handout, compact PDF, PPTX) ────────────────────
const shots = [];   // PNG per slide
const jpegs = [];   // JPEG per slide
const needPng = want.png || want.handout, needJpeg = want.compact || want.pptx;
let editable = null;
if (needPng || needJpeg || want.editable) {
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
  for (let i = 0; i < (needPng || needJpeg ? n : 0); i++) {
    await showSlide(page, i, settle);
    if (needPng) {
      const buf = Buffer.from(await page.screenshot({ type: 'png' }));
      shots.push(buf);
      if (want.png) writeFileSync(join(out, `slide-${String(i + 1).padStart(2, '0')}.png`), buf);
    }
    if (needJpeg) jpegs.push(Buffer.from(await page.screenshot({ type: 'jpeg', quality })));
  }
  if (want.png) done.push(`${n} PNG files`);
  if (want.editable) {
    editable = await buildEditablePptx({ page, n, W, H, settle, meta, title, out, lang });
    done.push(`slides-editable.pptx (${editable.boxes} text boxes, ${editable.images} pictures; fonts/: ${editable.fonts.got.length} downloaded${editable.fonts.missing.length ? `, missing ${editable.fonts.missing.join(', ')}` : ''})`);
  }
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


// ── Compact PDF: one JPEG per page ─────────────────────────────────────────
if (want.compact) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page { size: ${W}px ${H}px; margin: 0; }
    html, body { margin: 0; }
    img { display: block; width: ${W}px; height: ${H}px; break-after: page; }
    img:last-child { break-after: auto; }
  </style></head><body>${jpegs.map((b) => `<img src="data:image/jpeg;base64,${b.toString('base64')}">`).join('')}</body></html>`;
  const cp = await browser.newPage();
  await cp.setContent(html, { waitUntil: 'load' });
  writeFileSync(join(out, 'slides-compact.pdf'), await cp.pdf({ preferCSSPageSize: true, printBackground: true }));
  await cp.close();
  done.push('slides-compact.pdf');
}

// ── PowerPoint: full-slide images + speaker notes ─────────────────────────
if (want.pptx) {
  let PptxGenJS;
  try { PptxGenJS = (await import('pptxgenjs')).default; } catch {
    throw new Error('pptxgenjs is missing. Run `npm install` in the repo root first.');
  }
  const pptx = new PptxGenJS();
  const w = 13.333, h = +(w * H / W).toFixed(3);
  pptx.defineLayout({ name: 'DECK', width: w, height: h });
  pptx.layout = 'DECK';
  pptx.title = title;
  meta.forEach((m, i) => {
    const sl = pptx.addSlide();
    sl.addImage({ data: `image/jpeg;base64,${jpegs[i].toString('base64')}`, x: 0, y: 0, w, h, altText: m.title });
    const notes = [m.title, [m.sec, m.min && `${m.min} min`].filter(Boolean).join(' · '), m.notesText].filter(Boolean).join('\n\n');
    if (notes) sl.addNotes(notes);
  });
  // addNotes() puts every line in one text run; PowerPoint wants one paragraph per line.
  const zip = await (await import('jszip')).default.loadAsync(await pptx.write({ outputType: 'nodebuffer' }));
  for (const name of Object.keys(zip.files).filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f))) {
    const xml = await zip.file(name).async('string');
    zip.file(name, xml.replace(/(<a:p><a:r>(<a:rPr[^>]*\/>)<a:t>)([^<]*)(<\/a:t><\/a:r>)/g, (m, open, rpr, text, close) =>
      open + text.split('\n').join(`</a:t></a:r></a:p><a:p><a:r>${rpr}<a:t>`) + close));
  }
  writeFileSync(join(out, 'slides.pptx'), await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  done.push('slides.pptx');
}

// ── Handout ────────────────────────────────────────────────────────────────
if (want.handout) {
  const vi = lang.startsWith('vi');
  const T = vi ? { notes: 'Ghi chú', min: 'phút', none: '—' } : { notes: 'Notes', min: 'min', none: '—' };
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
