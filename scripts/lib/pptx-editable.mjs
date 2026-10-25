/**
 * Editable PowerPoint export: each slide becomes
 *   1. a background picture of the slide with its text hidden (decoration,
 *      shapes, gradients, charts, canvases stay pixel-exact),
 *   2. separate pictures for <img> elements (movable / replaceable),
 *   3. real PowerPoint text boxes placed where the text was, with the same
 *      font, size, colour, weight, italics, letter spacing and line height.
 *
 * Text that can't be reproduced faithfully as a text box — rotated text,
 * gradient-filled text, text inside SVG, aria-hidden decoration — is left in
 * the background picture instead of being hidden.
 *
 * Also writes fonts/ with the Google Fonts the deck uses (TTF, installable),
 * because PowerPoint only shows the right typeface if it is installed.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { showSlide } from './browser.mjs';

const SLIDE_W_IN = 13.333;

/** In-page: measure text blocks and images of slide i, and hide the text. */
function extractInPage(i) {
  const s = DeckKit.slides[i];
  const sr = s.getBoundingClientRect();
  // The picture frame: the scaled stage for <deck-stage>, otherwise the window —
  // inline-nav templates present full-screen even when a slide box is shorter.
  const fr = DeckKit.mode === 'deck-stage' ? sr : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  const SKIP = 'aside.notes, script, style, noscript, svg, canvas, textarea, select, option, iframe, video, [aria-hidden="true"], #deck-kit';
  // A "box" gets its own text box: block-level elements, and inline elements
  // that draw a box (background, border or side padding — <kbd>, chips, tags).
  const isBox = (e) => {
    const cs = getComputedStyle(e);
    if (cs.display === 'contents') return false;
    if (cs.display !== 'inline') return true;
    const bg = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
    const bgAlpha = bg ? +(bg[1].split(/[\s,/]+/).filter(Boolean)[3] ?? 1) : 0;
    return bgAlpha > 0.05 || parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.paddingLeft) > 1 || parseFloat(cs.paddingRight) > 1;
  };
  const blockOf = (el) => {
    for (let e = el; e && e !== s.parentElement; e = e.parentElement) if (isBox(e)) return e;
    return s;
  };
  // How much CSS transforms enlarge text on screen: the stage's fit-to-window
  // scale times any scale() between the element and the slide. Returns 0 for
  // rotation, skew, uneven scaling or 3-D — that text stays in the picture.
  const stage = s.offsetWidth ? sr.width / s.offsetWidth : 1;
  const scaleOf = (el) => {
    let k = stage;
    for (let e = el; e && e !== s; e = e.parentElement) {
      const t = getComputedStyle(e).transform;
      if (!t || t === 'none') continue;
      const m = t.match(/matrix\(([^)]+)\)/);
      if (!m) return 0;
      const [a, b, c, d] = m[1].split(',').map(Number);
      if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || Math.abs(a - d) > 0.02 * Math.abs(a)) return 0;
      k *= a;
    }
    return k;
  };
  // First text-shadow layer that has an offset (stacked "3-D" shadows: the deepest one).
  const shadowOf = (cs, k) => {
    if (!cs.textShadow || cs.textShadow === 'none') return null;
    const layers = cs.textShadow.split(/,(?![^(]*\))/).map((l) => {
      const color = (l.match(/rgba?\([^)]+\)/) || [''])[0];
      const [x = 0, y = 0, blur = 0] = l.replace(color, '').trim().split(/\s+/).map(parseFloat);
      return { color: rgba(color), x: x * k, y: y * k, blur: blur * k };
    }).filter((l) => l.color && l.color.alpha > 0.05);
    if (!layers.length) return null;
    return layers.reduce((a, b) => (Math.hypot(b.x, b.y) + b.blur > Math.hypot(a.x, a.y) + a.blur ? b : a));
  };
  const visible = (el) => (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true);
  const rgba = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { hex: [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(), alpha: a };
  };
  const transformText = (t, tt) => tt === 'uppercase' ? t.toUpperCase() : tt === 'lowercase' ? t.toLowerCase()
    : tt === 'capitalize' ? t.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()) : t;

  // block element → { segs: [{ runs, nodes }] }. A block's text is split into
  // segments wherever a child box (inline-block chip, badge…) interrupts it,
  // so each segment becomes its own text box at its own position.
  const blocks = new Map();
  const textNodes = [];
  const segOf = (b) => { const blk = blocks.get(b); return blk.segs[blk.segs.length - 1]; };
  (function walk(node) {
    for (const n of Array.from(node.childNodes)) {
      if (n.nodeType === 1) {
        if (n.matches(SKIP)) continue;
        if (n.tagName === 'BR') { const b = blockOf(n.parentElement); if (blocks.has(b)) segOf(b).runs.push({ br: true }); continue; }
        if (isBox(n)) {
          const pb = blockOf(node.nodeType === 1 ? node : node.parentElement);
          if (blocks.has(pb) && segOf(pb).runs.length) blocks.get(pb).segs.push({ runs: [], nodes: [] });
        }
        walk(n);
        continue;
      }
      if (n.nodeType !== 3) continue;
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      const pre = /pre/.test(cs.whiteSpace);
      let text = pre ? n.textContent : n.textContent.replace(/\s+/g, ' ');
      const b = blockOf(el);
      if (!text.trim() && !(blocks.has(b) && text)) continue;
      const k = visible(el) ? scaleOf(el) : 0;
      if (!k) continue;
      if (/text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '') || cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') continue;
      const color = rgba(cs.color);
      if (!color || color.alpha < 0.05) continue;
      if (!blocks.has(b)) blocks.set(b, { segs: [{ runs: [], nodes: [] }] });
      const blk = segOf(b);
      text = transformText(text, cs.textTransform);
      const deco = cs.textDecorationLine || '';
      // vertical-align: sub/super can sit on the text's parent or one level up.
      const va = cs.verticalAlign !== 'baseline' ? cs.verticalAlign : getComputedStyle(el.parentElement || el).verticalAlign;
      const run = {
        font: cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''),
        // PowerPoint shrinks sub/superscript itself, so give it the surrounding size.
        size: k * parseFloat((va === 'sub' || va === 'super') ? getComputedStyle(el.parentElement || el).fontSize : cs.fontSize),
        weight: +cs.fontWeight || 400, italic: cs.fontStyle !== 'normal',
        sub: va === 'sub', sup: va === 'super',
        color: color.hex, alpha: color.alpha, spacing: k * (parseFloat(cs.letterSpacing) || 0), shadow: shadowOf(cs, k),
        underline: deco.includes('underline'), strike: deco.includes('line-through'),
      };
      if (pre && text.includes('\n')) {
        text.split('\n').forEach((part, k) => { if (k) blk.runs.push({ br: true }); if (part) blk.runs.push({ ...run, text: part }); });
      } else blk.runs.push({ ...run, text });
      blk.nodes.push(n);
      textNodes.push(n);
    }
  })(s);

  const out = [];
  const segs = [];
  blocks.forEach((b, el) => b.segs.forEach((seg) => segs.push([seg, el])));
  segs.forEach(([blk, el]) => {
    // Trim whitespace at the edges of the block.
    while (blk.runs.length && (blk.runs[0].br || !blk.runs[0].text.trim())) blk.runs.shift();
    while (blk.runs.length && (blk.runs[blk.runs.length - 1].br || !blk.runs[blk.runs.length - 1].text.trim())) blk.runs.pop();
    if (!blk.runs.length) return;
    blk.runs[0].text = blk.runs[0].text.replace(/^\s+/, '');
    const lastRun = blk.runs[blk.runs.length - 1];
    lastRun.text = lastRun.text.replace(/\s+$/, '');
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const tops = new Set();
    let firstH = 0;
    blk.nodes.forEach((n) => {
      const r = document.createRange();
      r.selectNodeContents(n);
      Array.from(r.getClientRects()).forEach((q) => {
        if (!q.width || !q.height) return;
        if (!firstH) firstH = q.height;
        x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom);
        tops.add(Math.round(q.top / 4));
      });
    });
    if (!isFinite(x0)) return;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const padL = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), padR = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth);
    const lh = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight) * (scaleOf(el) || stage);
    out.push({
      runs: blk.runs,
      x: x0 - fr.left, y: y0 - fr.top, w: x1 - x0, h: y1 - y0,
      contentX: box.left + padL - fr.left, contentW: box.width - padL - padR,
      lines: tops.size, lineHeight: lh, glyphH: firstH,
      align: { start: 'left', left: 'left', center: 'center', right: 'right', end: 'right', justify: 'justify', '-webkit-center': 'center' }[cs.textAlign] || 'left',
    });
  });

  const images = Array.from(s.querySelectorAll('img')).filter((im) => visible(im) && !im.closest(SKIP)).map((im) => {
    const r = im.getBoundingClientRect();
    return { x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height, vx: r.left, vy: r.top, alt: im.alt || '' };
  }).filter((r) => r.w >= 24 && r.h >= 24);

  // Hide the measured text (wrapping keeps layout and pseudo-element decoration).
  const st = document.createElement('style');
  st.id = 'dk-pptx-hide';
  st.textContent = '.dk-px { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; } .dk-px-img { visibility: hidden !important; }';
  document.head.appendChild(st);
  window.__dkWrapped = textNodes.map((n) => { const sp = document.createElement('span'); sp.className = 'dk-px'; n.replaceWith(sp); sp.appendChild(n); return sp; });
  // Screenshot clips are in page coordinates, so add the scroll offset.
  const sx = window.scrollX, sy = window.scrollY;
  images.forEach((im) => { im.vx += sx; im.vy += sy; });
  return { slide: { x: fr.left + sx, y: fr.top + sy, w: fr.width, h: fr.height }, blocks: out, images };
}

function restoreInPage() {
  (window.__dkWrapped || []).forEach((sp) => { if (sp.firstChild) sp.replaceWith(sp.firstChild); else sp.remove(); });
  window.__dkWrapped = [];
  document.querySelectorAll('.dk-px-img').forEach((e) => e.classList.remove('dk-px-img'));
  const st = document.getElementById('dk-pptx-hide');
  if (st) st.remove();
}

/** Family / subfamily names from a TrueType file's name table (IDs 1 and 2). */
function ttfNames(buf) {
  try {
    const n = buf.readUInt16BE(4);
    let off = -1;
    for (let t = 0; t < n; t++) if (buf.toString('latin1', 12 + t * 16, 16 + t * 16) === 'name') off = buf.readUInt32BE(12 + t * 16 + 8);
    if (off < 0) return null;
    const count = buf.readUInt16BE(off + 2), strings = off + buf.readUInt16BE(off + 4);
    const found = {};
    for (let r = 0; r < count; r++) {
      const at = off + 6 + r * 12;
      const [plat, , langId, id, len, o] = [0, 2, 4, 6, 8, 10].map((d) => buf.readUInt16BE(at + d));
      if (id !== 1 && id !== 2) continue;
      const raw = buf.subarray(strings + o, strings + o + len);
      if (plat === 3 && (langId === 0x409 || !found[id])) {
        let str = '';
        for (let c = 0; c + 1 < raw.length; c += 2) str += String.fromCharCode(raw.readUInt16BE(c));
        found[id] = str;
      } else if (plat === 1 && !found[id]) found[id] = raw.toString('latin1');
    }
    return found[1] ? { family: found[1], style: found[2] || 'Regular' } : null;
  } catch { return null; }
}

const GENERIC = { serif: 'Georgia', 'sans-serif': 'Arial', monospace: 'Courier New', 'system-ui': 'Arial', '-apple-system': 'Arial', cursive: 'Comic Sans MS', 'ui-monospace': 'Courier New' };

/** Download installable TTFs for the Google Fonts a deck uses. */
async function fetchFonts(families, dir, lang) {
  mkdirSync(dir, { recursive: true });
  const got = [], missing = [], faceMap = [];
  for (const fam of families) {
    if (GENERIC[fam]) continue;
    try {
      const url = `https://fonts.googleapis.com/css?family=${encodeURIComponent(fam).replace(/%20/g, '+')}:300,400,500,600,700,800,300italic,400italic,700italic`;
      const res = await fetch(url); // no browser UA → Google serves TrueType
      if (!res.ok) throw new Error(res.status);
      const css = await res.text();
      const faces = [...css.matchAll(/font-style:\s*(\w+);\s*font-weight:\s*(\d+);[\s\S]*?url\((https:[^)]+\.ttf)\)/g)];
      if (!faces.length) throw new Error('no ttf');
      for (const [, style, weight, src] of faces) {
        const buf = Buffer.from(await (await fetch(src)).arrayBuffer());
        writeFileSync(join(dir, `${fam.replace(/\s+/g, '')}-${weight}${style === 'italic' ? 'Italic' : ''}.ttf`), buf);
        const names = ttfNames(buf);
        if (names) faceMap.push({ fam, weight: +weight, italic: style === 'italic', ...names });
      }
      got.push(fam);
    } catch { missing.push(fam); }
  }
  const vi = lang.startsWith('vi');
  const readme = vi
    ? `Font dùng trong slides-editable.pptx\n\nCài các file .ttf trong thư mục này trước khi mở file PowerPoint, nếu không PowerPoint sẽ thay bằng font khác và chữ có thể xuống dòng lệch.\n- Windows: chọn hết file .ttf → chuột phải → Install (Cài đặt cho mọi người).\n- macOS: mở bằng Font Book → Install.\n- Linux: chép vào ~/.local/share/fonts rồi chạy fc-cache -f.\n\nĐã tải: ${got.join(', ') || '(không có)'}\n${missing.length ? `Không tải được (cài thủ công): ${missing.join(', ')}\n` : ''}`
    : `Fonts used by slides-editable.pptx\n\nInstall the .ttf files in this folder before opening the PowerPoint file; otherwise PowerPoint substitutes another font and lines may wrap differently.\n- Windows: select all .ttf files → right-click → Install (for all users).\n- macOS: open with Font Book → Install.\n- Linux: copy to ~/.local/share/fonts and run fc-cache -f.\n\nDownloaded: ${got.join(', ') || '(none)'}\n${missing.length ? `Not available (install manually): ${missing.join(', ')}\n` : ''}`;
  writeFileSync(join(dir, vi ? 'DOC-TRUOC.txt' : 'README.txt'), readme);
  return { got, missing, faceMap };
}

/** PowerPoint picks a face by the family name stored in the font file, and
 *  static TTFs name each weight separately ("Work Sans Medium"). Map a CSS
 *  family + weight + style to that name and the bold/italic flags it needs. */
function faceFor(fonts, fam, weight, italic) {
  const faces = fonts.faceMap.filter((f) => f.fam === fam);
  if (!faces.length) return { fontFace: GENERIC[fam] || fam, bold: weight >= 600, italic };
  const pick = faces
    .map((f) => ({ f, d: Math.abs(f.weight - weight) + (f.italic === italic ? 0 : 1000) }))
    .sort((a, b) => a.d - b.d)[0].f;
  return { fontFace: pick.family, bold: /bold/i.test(pick.style), italic: /italic/i.test(pick.style) || (italic && !pick.italic) };
}

export async function buildEditablePptx({ page, n, W, H, settle, meta, title, out, lang }) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  const slideH = +(SLIDE_W_IN * H / W).toFixed(3);
  pptx.defineLayout({ name: 'DECK', width: SLIDE_W_IN, height: slideH });
  pptx.layout = 'DECK';
  pptx.title = title;
  const families = new Set();
  const stats = { boxes: 0, images: 0 };

  // Pass 1: measure and capture every slide.
  const captured = [];
  for (let i = 0; i < n; i++) {
    await showSlide(page, i, settle);
    const data = await page.evaluate(extractInPage, i);
    // Separate pictures for <img>, captured with the text already hidden.
    data.pics = [];
    for (const im of data.images) {
      data.pics.push({ ...im, buf: Buffer.from(await page.screenshot({ type: 'png', clip: { x: im.vx, y: im.vy, width: im.w, height: im.h }, captureBeyondViewport: false })) });
    }
    if (data.images.length) await page.evaluate(() => DeckKit.slides[DeckKit.index].querySelectorAll('img').forEach((im) => im.classList.add('dk-px-img')));
    data.bg = Buffer.from(await page.screenshot({ type: 'jpeg', quality: 92, clip: { x: data.slide.x, y: data.slide.y, width: data.slide.w, height: data.slide.h }, captureBeyondViewport: false }));
    await page.evaluate(restoreInPage);
    data.blocks.forEach((b) => b.runs.forEach((r) => { if (!r.br) families.add(r.font); }));
    captured.push(data);
  }

  // Fonts first: the text boxes need the face names inside the font files.
  const fonts = await fetchFonts([...families], join(out, 'fonts'), lang);

  // Pass 2: build the slides.
  captured.forEach((data, i) => {
    const k = SLIDE_W_IN / data.slide.w;        // inches per CSS px
    const pt = k * 72;                          // points per CSS px
    const sl = pptx.addSlide();
    sl.addImage({ data: `image/jpeg;base64,${data.bg.toString('base64')}`, x: 0, y: 0, w: SLIDE_W_IN, h: slideH });
    data.pics.forEach((im) => sl.addImage({ data: `image/png;base64,${im.buf.toString('base64')}`, x: im.x * k, y: im.y * k, w: im.w * k, h: im.h * k, altText: im.alt }));
    stats.images += data.pics.length;

    for (const b of data.blocks) {
      const runs = [];
      b.runs.forEach((r) => {
        if (r.br) { if (runs.length) runs[runs.length - 1].options.breakLine = true; return; }
        const o = { ...faceFor(fonts, r.font, r.weight, r.italic), fontSize: Math.max(1, Math.round(r.size * pt * 2) / 2), color: r.color };
        if (r.alpha < 1) o.transparency = Math.round((1 - r.alpha) * 100);
        if (r.spacing) o.charSpacing = +(r.spacing * pt).toFixed(1);
        if (r.underline) o.underline = { style: 'sng' };
        if (r.strike) o.strike = 'sngStrike';
        if (r.sub) o.subscript = true;
        if (r.sup) o.superscript = true;
        runs.push({ text: r.text, options: o });
      });
      if (!runs.length) continue;
      const fs = b.runs.find((r) => !r.br).size;
      const lh = b.lineHeight || fs * 1.2;
      // Single lines keep their width (no wrap, a little slack for font metrics);
      // paragraphs wrap inside the element's content box.
      const single = b.lines <= 1;
      let x = single ? b.x : Math.min(b.x, b.contentX);
      const w = single ? b.w * 1.06 + 4 : Math.max(b.w, b.contentW) + 2;
      if (single && b.align === 'center') x = b.x + b.w / 2 - w / 2;
      if (single && b.align === 'right') x = b.x + b.w - w;
      // One line: natural font metrics put the glyphs where the browser did.
      // Paragraphs: exact line spacing, shifted by the half-leading difference.
      const lead = single ? 0 : (lh - (b.glyphH || fs)) / 2;
      const opts = {
        x: x * k, y: (b.y - lead) * k, w: w * k, h: Math.max(b.h + 2 * lead, b.h) * k,
        margin: 0, valign: 'top', align: b.align, wrap: !single, fit: 'none', paraSpaceBefore: 0, paraSpaceAfter: 0,
      };
      if (!single) opts.lineSpacing = +(lh * pt).toFixed(1);
      // pptxgenjs only takes a shadow on the shape; with no fill PowerPoint draws it on the text.
      const sh = (b.runs.find((r) => !r.br && r.shadow) || {}).shadow;
      if (sh) {
        opts.shadow = { type: 'outer', color: sh.color.hex, opacity: +sh.color.alpha.toFixed(2), blur: Math.max(0.01, +(sh.blur * pt).toFixed(1)), // 0 would mean pptxgenjs' default 8 pt
          offset: +(Math.hypot(sh.x, sh.y) * pt).toFixed(1), angle: Math.round(((Math.atan2(sh.y, sh.x) * 180 / Math.PI) + 360) % 360) };
      }
      sl.addText(runs, opts);
      stats.boxes++;
    }
    const m = meta[i];
    const notes = [m.title, [m.sec, m.min && `${m.min} min`].filter(Boolean).join(' · '), m.notesText].filter(Boolean).join('\n\n');
    if (notes) sl.addNotes(notes);
  });

  // One paragraph per notes line (see the image-only export).
  const zip = await (await import('jszip')).default.loadAsync(await pptx.write({ outputType: 'nodebuffer' }));
  for (const name of Object.keys(zip.files).filter((f) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(f))) {
    const xml = await zip.file(name).async('string');
    zip.file(name, xml.replace(/(<a:p><a:r>(<a:rPr[^>]*\/>)<a:t>)([^<]*)(<\/a:t><\/a:r>)/g, (mm, open, rpr, text, close) =>
      open + text.split('\n').join(`</a:t></a:r></a:p><a:p><a:r>${rpr}<a:t>`) + close));
  }
  writeFileSync(join(out, 'slides-editable.pptx'), await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return { ...stats, fonts };
}
