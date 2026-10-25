#!/usr/bin/env node
/**
 * pptx-to-deck.mjs — turn an existing PowerPoint into a deck in one of the
 * templates: text, bullets (with levels), tables, pictures and speaker notes
 * come across; the look comes from the chosen template.
 *
 *   node scripts/pptx-to-deck.mjs talk.pptx --theme=vellum [--out=DIR] [--lang=vi] [--include-hidden]
 *
 * Writes DIR/source/talk.md (+ source/media/) — the extracted outline, which
 * you or an agent can edit and re-run through md-to-deck.mjs — and builds
 * DIR/index.html from it with md-to-deck's layouts in the theme's fonts and
 * palette. For the template's own layouts, have the agent move the content
 * into templates/<theme>/ next (the outline already has titles, notes and order).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join, basename, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, ...v] = a.slice(2).split('=');
  return [k, v.length ? v.join('=') : true];
}));
const input = args.find((a) => !a.startsWith('--'));
if (!input || !opt.theme) {
  console.error('Usage: node scripts/pptx-to-deck.mjs <talk.pptx> --theme=<template-slug> [--out=DIR] [--lang=vi] [--include-hidden]');
  process.exit(1);
}
const pptxPath = resolve(input);
const out = resolve(opt.out || join(dirname(pptxPath), basename(pptxPath, extname(pptxPath)) + '-deck'));
const srcDir = join(out, 'source');
mkdirSync(join(srcDir, 'media'), { recursive: true });

let JSZip;
try { JSZip = (await import('jszip')).default; } catch {
  console.error('jszip is missing. Run `npm install` in the repo root first.');
  process.exit(1);
}
const zip = await JSZip.loadAsync(readFileSync(pptxPath));
const read = async (p) => { const f = zip.file(p); return f ? f.async('string') : null; };

// ── Tiny XML helpers (OOXML is regular enough for this) ───────────────────
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&');
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? decode(m[1]) : null; };
const blocks = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'g'))].map((m) => ({ xml: m[0], at: m.index }));
async function rels(partPath) {
  const dir = posix.dirname(partPath), name = posix.basename(partPath);
  const xml = await read(`${dir}/_rels/${name}.rels`);
  const map = {};
  if (xml) for (const m of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(m[0], 'Id'), target = attr(m[0], 'Target'), type = attr(m[0], 'Type') || '';
    map[id] = { target: target.startsWith('/') ? target.slice(1) : posix.normalize(posix.join(dir, target)), type };
  }
  return map;
}

/** Paragraphs of a text body: [{ text (markdown inline), level, bullet, size }] */
function paragraphs(txBody, defaultBullets) {
  return blocks(txBody, 'a:p').map(({ xml }) => {
    const pPr = (xml.match(/<a:pPr\b[^>]*\/?>/) || [''])[0];
    const level = +(attr(pPr, 'lvl') || 0);
    const noBullet = /<a:buNone\/>/.test(xml);
    const hasBullet = /<a:bu(Char|AutoNum)\b/.test(xml);
    let size = 0;
    const text = [...xml.matchAll(/<a:r>([\s\S]*?)<\/a:r>|<a:br\/>/g)].map((m) => {
      if (!m[1]) return '  \n';
      const rPr = (m[1].match(/<a:rPr\b[^>]*\/?>/) || [''])[0];
      const t = decode((m[1].match(/<a:t>([\s\S]*?)<\/a:t>/) || ['', ''])[1]);
      size = Math.max(size, +(attr(rPr, 'sz') || 0) / 100);
      if (!t.trim()) return t;
      const b = attr(rPr, 'b') === '1', i = attr(rPr, 'i') === '1';
      const lead = t.match(/^\s*/)[0], trail = t.match(/\s*$/)[0], core = t.trim();
      return lead + (b ? `**${core}**` : i ? `*${core}*` : core) + trail;
    }).join('').replace(/\*\*\s*\*\*/g, '');
    return { text: text.trim(), level, bullet: hasBullet || (defaultBullets && !noBullet), size };
  }).filter((p) => p.text);
}

function position(xml) {
  const off = xml.match(/<a:off x="(-?\d+)" y="(-?\d+)"\/>/), ext = xml.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  return { x: off ? +off[1] : 0, y: off ? +off[2] : 0, w: ext ? +ext[1] : 0, h: ext ? +ext[2] : 0 };
}

// ── Slides in presentation order ──────────────────────────────────────────
const presXml = await read('ppt/presentation.xml');
const presRels = await rels('ppt/presentation.xml');
const slideW = +(presXml.match(/<p:sldSz cx="(\d+)"/) || [0, 12192000])[1];
const slideH = +(presXml.match(/<p:sldSz[^>]*cy="(\d+)"/) || [0, 6858000])[1];
const order = [...presXml.matchAll(/<p:sldId\b[^>]*>/g)].map((m) => presRels[attr(m[0], 'r:id')]?.target).filter(Boolean);
const core = (await read('docProps/core.xml')) || '';
const docTitle = decode((core.match(/<dc:title>([\s\S]*?)<\/dc:title>/) || ['', ''])[1]).trim();

let mediaCount = 0;
const skippedKinds = { chart: 0, smartart: 0, media: 0 };
const skippedSlides = new Set();
const outSlides = [];
for (const [n, part] of order.entries()) {
  const xml = await read(part);
  if (!xml) continue;
  if (/<p:sld\b[^>]*\sshow="0"/.test(xml) && !opt['include-hidden']) continue;
  const r = await rels(part);
  // Placeholders often inherit their position from the slide layout.
  const layoutRel = Object.values(r).find((x) => /slideLayout$/.test(x.type));
  const layoutXml = layoutRel ? (await read(layoutRel.target)) || '' : '';
  const layoutPos = (ph) => {
    const idx = attr(ph, 'idx'), type = attr(ph, 'type');
    const hit = blocks(layoutXml, 'p:sp').find(({ xml: lsp }) => {
      const lph = (lsp.match(/<p:ph\b[^>]*\/?>/) || [''])[0];
      return lph && ((idx && attr(lph, 'idx') === idx) || (!idx && type && attr(lph, 'type') === type));
    });
    return hit ? position(hit.xml) : null;
  };
  const items = [];
  for (const { xml: sp } of blocks(xml, 'p:sp')) {
    const ph = (sp.match(/<p:ph\b[^>]*\/?>/) || [''])[0];
    const type = ph ? (attr(ph, 'type') || 'body') : null;
    if (/^(dt|ftr|sldNum|hdr)$/.test(type || '')) continue;   // date, footer, slide number
    const tx = (sp.match(/<p:txBody>[\s\S]*<\/p:txBody>/) || [''])[0];
    if (!tx) continue;
    const paras = paragraphs(tx, type === 'body' || type === 'obj');
    const pos = /<a:off /.test(sp) ? position(sp) : (ph && layoutPos(ph)) || position(sp);
    if (paras.length) items.push({ kind: 'text', type, paras, ...pos });
  }
  for (const { xml: pic } of blocks(xml, 'p:pic')) {
    const id = (pic.match(/r:embed="([^"]+)"/) || [])[1];
    const target = id && r[id] && r[id].target;
    const file = target && zip.file(target);
    if (!file) continue;
    const pos = position(pic);
    if (pos.w * pos.h >= slideW * slideH * 0.9) continue;   // full-slide background, not content
    const name = `${String(++mediaCount).padStart(2, '0')}-${posix.basename(target)}`;
    writeFileSync(join(srcDir, 'media', name), await file.async('nodebuffer'));
    const alt = attr((pic.match(/<p:cNvPr\b[^>]*>/) || [''])[0], 'descr') || '';
    items.push({ kind: 'image', src: `media/${name}`, alt, ...pos });
  }
  for (const { xml: gf } of blocks(xml, 'p:graphicFrame')) {
    const tbl = (gf.match(/<a:tbl>[\s\S]*<\/a:tbl>/) || [''])[0];
    if (!tbl) continue;
    const rows = blocks(tbl, 'a:tr').map(({ xml: tr }) => blocks(tr, 'a:tc').map(({ xml: tc }) => paragraphs(tc, false).map((p) => p.text).join(' ').replace(/\|/g, '\\|')));
    if (rows.length) items.push({ kind: 'table', rows, ...position(gf) });
  }
  // Things that don't come across: charts, SmartArt diagrams, video / audio.
  const gfs = blocks(xml, 'p:graphicFrame').map((g) => g.xml);
  skippedKinds.chart += gfs.filter((g) => /drawingml\/2006\/chart/.test(g)).length;
  skippedKinds.smartart += gfs.filter((g) => /drawingml\/2006\/diagram/.test(g)).length;
  skippedKinds.media += (xml.match(/<a:(videoFile|audioFile)\b/g) || []).length;
  if (gfs.some((g) => /drawingml\/2006\/(chart|diagram)/.test(g)) || /<a:(videoFile|audioFile)\b/.test(xml)) skippedSlides.add(outSlides.length + 1);
  // Reading order: top to bottom, then left to right.
  items.sort((a, b) => (Math.abs(a.y - b.y) > slideH * 0.04 ? a.y - b.y : a.x - b.x));

  // Title: the title placeholder, else the largest text near the top.
  let title = items.find((it) => it.kind === 'text' && /^(title|ctrTitle)$/.test(it.type));
  if (!title) {
    const top = items.filter((it) => it.kind === 'text' && it.y < slideH * 0.4 && it.paras.length <= 2);
    title = top.sort((a, b) => Math.max(...b.paras.map((p) => p.size)) - Math.max(...a.paras.map((p) => p.size)))[0] || null;
  }
  const subtitle = items.find((it) => it.kind === 'text' && it.type === 'subTitle');
  const body = items.filter((it) => it !== title && it !== subtitle);

  // Notes
  let notes = '';
  const notesRel = Object.values(r).find((x) => /notesSlide$/.test(x.type));
  if (notesRel) {
    const nx = (await read(notesRel.target)) || '';
    notes = blocks(nx, 'p:sp').filter(({ xml: sp }) => /<p:ph\b[^>]*type="body"/.test(sp))
      .flatMap(({ xml: sp }) => paragraphs(sp, false).map((p) => p.text)).join('\n\n');
  }

  outSlides.push({ n, title: title ? title.paras.map((p) => p.text).join(' ') : '', ctr: !!(title && title.type === 'ctrTitle'), subtitle, body, notes });
}

// ── Markdown ──────────────────────────────────────────────────────────────
const textBlock = (it) => {
  const lines = [];
  it.paras.forEach((p) => lines.push(p.bullet ? `${'  '.repeat(Math.min(p.level, 1))}- ${p.text}` : p.text));
  return lines.join('\n').replace(/\n(?!\s*- )/g, '\n\n');
};
const itemMd = (it) => it.kind === 'text' ? textBlock(it)
  : it.kind === 'image' ? `![${it.alt}](${it.src})`
  : [`| ${it.rows[0].join(' | ')} |`, `|${it.rows[0].map(() => '---').join('|')}|`, ...it.rows.slice(1).map((row) => `| ${row.join(' | ')} |`)].join('\n');

const md = [];
md.push('---', `title: ${docTitle || outSlides[0]?.title || basename(pptxPath, extname(pptxPath))}`, `lang: ${opt.lang || 'en'}`, `theme: ${opt.theme}`, '---');
outSlides.forEach((s, k) => {
  const parts = [];
  if (k > 0) parts.push('---');   // slide break (joined with blank lines below)
  const bodyMd = [];
  // Two side-by-side text blocks of similar height → columns.
  const texts = s.body.filter((it) => it.kind !== 'table');
  const twoCols = texts.length === 2 && Math.abs(texts[0].y - texts[1].y) < slideH * 0.1 && texts[1].x > texts[0].x + texts[0].w * 0.6;
  if (twoCols) bodyMd.push(itemMd(texts[0]), '|||', itemMd(texts[1]), ...s.body.filter((it) => !texts.includes(it)).map(itemMd));
  else s.body.forEach((it) => bodyMd.push(itemMd(it)));
  const sub = s.subtitle ? s.subtitle.paras.map((p) => p.text).join('\n\n') : '';
  if (k === 0 || s.ctr) parts.push(`# ${s.title || 'Untitled'}`, sub, ...bodyMd);
  else if (s.title && !s.body.length) parts.push(`# ${s.title}`, sub);      // section divider
  else parts.push(s.title ? `## ${s.title}` : '', sub, ...bodyMd);
  if (s.notes) parts.push(`Note: ${s.notes}`);
  md.push(parts.filter((x) => x !== '').join('\n\n'));
});
const mdPath = join(srcDir, 'talk.md');
// Front matter, then slides separated by a blank line, ---, blank line.
writeFileSync(mdPath, md.slice(0, 5).join('\n') + '\n' + md.slice(5).join('\n\n') + '\n');

// ── Build the deck ────────────────────────────────────────────────────────
const res = execFileSync(process.execPath, [resolve(root, 'scripts/md-to-deck.mjs'), mdPath, `--theme=${opt.theme}`, `--out=${out}`, ...(opt.lang ? [`--lang=${opt.lang}`] : [])], { encoding: 'utf8', env: { ...process.env, DECK_SOURCE: basename(pptxPath) } });
const withNotes = outSlides.filter((s) => s.notes).length;
console.log(`Imported ${outSlides.length} slides from ${basename(pptxPath)} (${mediaCount} pictures, ${withNotes} with notes).`);
console.log(`Outline: ${mdPath}`);
const skippedList = [skippedKinds.chart && `${skippedKinds.chart} chart(s)`, skippedKinds.smartart && `${skippedKinds.smartart} SmartArt diagram(s)`, skippedKinds.media && `${skippedKinds.media} video/audio clip(s)`].filter(Boolean);
if (skippedList.length) console.log(`Not imported: ${skippedList.join(', ')} on slide(s) ${[...skippedSlides].join(', ')} — rebuild them (charts: DeckKit.plot or an image).`);
console.log(res.trim());
