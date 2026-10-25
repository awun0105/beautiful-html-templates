#!/usr/bin/env node
/**
 * md-to-deck.mjs — write the talk in Markdown, get a working deck.
 *
 *   node scripts/md-to-deck.mjs talk.md --theme=vellum [--out=DIR] [--lang=vi]
 *
 * The deck uses a set of standard layouts (cover, section, bullets, two
 * columns, quote, stats, image, code, table) dressed in the chosen template's
 * fonts and palette, with deck-stage + deck-kit (notes, menu, timer,
 * presenter view, print). For a pixel-faithful result, an agent can then move
 * the content into the template's own layouts — the outline is already there.
 *
 * Markdown format
 *
 *   ---
 *   title: Kalman filters
 *   lang: vi
 *   theme: vellum            (optional, instead of --theme)
 *   ---
 *   # Kalman filters          ← first slide: cover (# title + subtitle lines)
 *   A two-hour introduction
 *
 *   ---                       ← slide break
 *   <!-- sec: Basics | min: 3 -->
 *   ## Why filter?
 *   - sensors are noisy
 *   - models drift
 *
 *   Note: what to say. Everything after a "Note:" (or "???") line is speaker notes.
 *
 * Layouts are picked automatically:
 *   only "# Heading" (+1 line)   → section divider
 *   a "> quote" (+ "— author")   → quote
 *   a line "|||"                 → two columns (left | right)
 *   only "## title" + one image  → full image
 *   <!-- layout: stats -->        list items "**42%** label" become stat cards
 *   ![](clip.mp4) / ![](song.mp3) video / audio player with controls (never autoplays)
 *   a YouTube link on its own line  embedded player
 *   $x^2$, $$\sum x$$            maths (KaTeX, rendered by deck-kit)
 *   ```python {1-2|4}            highlighted code; {…} steps through those lines on →
 *   ```chart  + JSON              bar / line / pie chart ({"type":"bar","labels":[…],"series":[…]})
 *   - (x) right / - ( ) wrong     multiple-choice quiz (click an option to check it)
 *   - [x] done / - [ ] to do      task list (ticked / unticked boxes)
 * Override any slide with <!-- layout: cover|section|bullets|columns|quote|stats|image -->.
 * Other per-slide keys: sec, min, title, steps (steps: true → list items appear
 * one per →). Raw HTML lines pass through untouched (data-step, data-compare,
 * data-hotspot, data-qr… and <canvas> + <script> with DeckKit.widget).
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeDeckMemory } from './lib/deck-memory.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, ...v] = a.slice(2).split('=');
  return [k, v.length ? v.join('=') : true];
}));
const input = args.find((a) => !a.startsWith('--'));
if (!input) {
  console.error('Usage: node scripts/md-to-deck.mjs <talk.md> --theme=<template-slug> [--out=DIR] [--lang=vi]');
  process.exit(1);
}
const mdPath = resolve(input);
const mdDir = dirname(mdPath);
let src = readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');

// ── Front matter ───────────────────────────────────────────────────────────
const front = {};
src = src.replace(/^---\n([\s\S]*?)\n---\n/, (m, body) => {
  body.split('\n').forEach((l) => { const k = l.match(/^(\w+):\s*(.*)$/); if (k) front[k[1]] = k[2].trim(); });
  return '';
});
const theme = opt.theme || front.theme;
const slugs = readdirSync(resolve(root, 'templates')).filter((d) => existsSync(resolve(root, 'templates', d, 'template.json')));
if (!theme || !slugs.includes(theme)) {
  console.error(`Pick a theme with --theme=<slug>. Available: ${slugs.join(', ')}`);
  process.exit(1);
}
const lang = opt.lang || front.lang || 'en';
const out = resolve(opt.out || join(mdDir, basename(mdPath, extname(mdPath)) + '-deck'));
mkdirSync(join(out, 'assets'), { recursive: true });

// ── Theme from the template ────────────────────────────────────────────────
const tj = JSON.parse(readFileSync(resolve(root, 'templates', theme, 'template.json'), 'utf8'));
const thtml = readFileSync(resolve(root, 'templates', theme, 'template.html'), 'utf8');
const fontLink = (thtml.match(/<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>/i) || [''])[0];

const hex = (c) => {
  const m = String(c).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), css: '#' + h.toUpperCase() };
};
const lum = ({ r, g, b }) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const sat = ({ r, g, b }) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };

const colors = Object.entries(tj.palette).filter(([k]) => k !== 'description').map(([k, v]) => [k, hex(v)]).filter(([, c]) => c);
const byKey = (keys) => keys.map((k) => colors.find(([n]) => n === k)).find(Boolean);
const scheme = tj.scheme || 'light';
let bg = (byKey(['bg', 'paper', 'bg_primary', 'background', 'cream', 'bone', 'bg_light', 'bg_gray', 'offwhite']) || [])[1];
if (!bg || (scheme === 'dark' && lum(bg) > 0.4)) {
  const sorted = colors.map(([, c]) => c).sort((a, b) => lum(a) - lum(b));
  bg = scheme === 'dark' ? sorted[0] : sorted[sorted.length - 1];
}
let fg = (byKey(['fg', 'ink', 'text', 'text_primary', 'black', 'dark']) || [])[1];
if (!fg || contrast(fg, bg) < 4.5) {
  fg = colors.map(([, c]) => c).sort((a, b) => contrast(b, bg) - contrast(a, bg))[0];
  if (contrast(fg, bg) < 4.5) fg = hex(lum(bg) > 0.4 ? '#141414' : '#F5F5F0');
}
const accents = colors.map(([, c]) => c)
  .filter((c) => c.css !== bg.css && c.css !== fg.css && contrast(c, bg) >= 1.4)
  .sort((a, b) => sat(b) - sat(a)).map((c) => c.css);
while (accents.length < 2) accents.push(fg.css);
// Accent for text needs real contrast; pale accents stay decorative (rules, borders, markers).
const accentText = (accents.map(hex).find((c) => c && contrast(c, bg) >= 3) || fg).css;
const ty = tj.typography || {};
const fam = (f, fb) => (f ? `"${f}", ${fb}` : fb);
const fonts = {
  display: fam(ty.display || ty.serif, 'Georgia, serif'),
  body: fam(ty.body || ty.display, 'system-ui, sans-serif'),
  mono: fam(ty.mono, 'ui-monospace, Menlo, Consolas, monospace'),
};

// ── Markdown → HTML (the subset slides need) ───────────────────────────────
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const assets = new Map();
function asset(srcRef) {
  if (/^(https?:|data:)/.test(srcRef)) return srcRef;
  const file = resolve(mdDir, srcRef);
  if (!existsSync(file)) { console.warn(`warning: image not found: ${srcRef}`); return srcRef; }
  if (!assets.has(file)) {
    const name = `${assets.size + 1}-${basename(file)}`;
    copyFileSync(file, join(out, 'assets', name));
    assets.set(file, `assets/${name}`);
  }
  return assets.get(file);
}
/** ![alt](file): picture, video or audio by extension. Players get controls; nothing autoplays. */
function media(src, alt) {
  const ext = (src.split(/[?#]/)[0].match(/\.(\w+)$/) || [])[1]?.toLowerCase();
  if (/^(mp4|webm|mov|m4v|ogv)$/.test(ext || '')) return `<video src="${esc(src)}" controls preload="metadata" playsinline title="${alt}"></video>`;
  if (/^(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/.test(ext || '')) return `<audio src="${esc(src)}" controls preload="metadata" title="${alt}"></audio>`;
  return `<img src="${esc(src)}" alt="${alt}">`;
}
/** A YouTube link on its own line → embedded player (start time kept). */
function youtube(line) {
  const m = line.trim().match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})(?:[?&#].*?(?:t|start)=(\d+))?/);
  if (!m) return null;
  return `<div class="embed"><iframe src="https://www.youtube.com/embed/${m[1]}?rel=0${m[2] ? `&start=${m[2]}` : ''}" title="YouTube video" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>`;
}
/** Maths spans in a line ($…$ by Pandoc's rule, $$…$$, \(…\), \[…\]) — kept
 *  away from emphasis so a_1 or a*b inside maths stays as written. */
const MATH_RE = /\$\$[\s\S]+?\$\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\$(?=[^\s$])(?:\\.|[^$\\])*?[^\s\\]\$(?!\d)|\$[^\s$\d]\$(?!\d)/g;
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(MATH_RE, (m) => { codes.push(esc(m)); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, u) => media(asset(u.replace(/&amp;/g, '&')), alt))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => codes[+i]);
}
/** Block-level Markdown → HTML. */
function blocks(lines) {
  const html = [];
  for (let i = 0; i < lines.length;) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^```/.test(l)) {
      // ```lang {1-2|4}: the braces step through those lines.
      const info = l.slice(3).trim();
      const lines_ = (info.match(/\{([^}]*)\}/) || [])[1];
      const langTag = info.replace(/\{[^}]*\}/, '').trim().split(/\s+/)[0] || '';
      const body = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) body.push(lines[i]);
      i++;
      if (langTag === 'chart') {
        let spec = null;
        try { spec = JSON.parse(body.join('\n')); } catch (e) { console.warn(`warning: \`\`\`chart block is not valid JSON (${e.message})`); }
        if (spec) { html.push(`<canvas class="chart" data-chart="${esc(JSON.stringify(spec))}"></canvas>`); continue; }
      }
      const cls = langTag && langTag !== 'chart' ? ` class="language-${esc(langTag)}"` : '';
      html.push(`<pre class="code"${lines_ ? ` data-lines="${esc(lines_.trim())}"` : ''}><code${cls}>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    if (youtube(l)) { html.push(youtube(l)); i++; continue; }
    if (/^\s*</.test(l)) { // raw HTML block: until a blank line
      const body = [];
      for (; i < lines.length && lines[i].trim(); i++) body.push(lines[i]);
      html.push(body.join('\n'));
      continue;
    }
    if (/^#{1,4}\s/.test(l)) {
      const n = l.match(/^#+/)[0].length;
      html.push(`<h${n}>${inline(l.replace(/^#+\s*/, ''))}</h${n}>`);
      i++; continue;
    }
    if (/^>\s?/.test(l)) {
      const body = [];
      for (; i < lines.length && /^>\s?/.test(lines[i]); i++) body.push(lines[i].replace(/^>\s?/, ''));
      html.push(`<blockquote>${inline(body.join(' '))}</blockquote>`);
      continue;
    }
    if (/^\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const row = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const head = row(l);
      const rows = [];
      for (i += 2; i < lines.length && /^\|/.test(lines[i]); i++) rows.push(row(lines[i]));
      html.push(`<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s/.test(l)) {
      const ordered = /^\s*\d/.test(l);
      const items = [];
      for (; i < lines.length && /^\s*([-*+]|\d+[.)])\s/.test(lines[i]); i++) {
        const depth = lines[i].match(/^\s*/)[0].length >= 2 ? 1 : 0;
        items.push([depth, inline(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ''))]);
      }
      const tag = ordered ? 'ol' : 'ul';
      // - (x) right / - ( ) wrong → a quiz (round, like radio buttons).
      const radio = /^\(( |x|X)\)\s/;
      if (items.length > 1 && items.every(([d, t]) => d === 0 && radio.test(t))) {
        html.push(`<${tag} class="quiz" data-quiz>${items.map(([, t]) => `<li data-option${/^\([xX]\)/.test(t) ? ' data-correct' : ''}>${t.replace(radio, '')}</li>`).join('')}</${tag}>`);
        continue;
      }
      // - [x] done / - [ ] to do → a task list.
      const box = /^\[( |x|X)\]\s/;
      items.forEach((it) => { if (box.test(it[1])) it[1] = `<span class="task${/^\[[xX]\]/.test(it[1]) ? ' done' : ''}"></span>${it[1].replace(box, '')}`; });
      let h = `<${tag}>`;
      items.forEach(([d, t], k) => {
        const next = items[k + 1];
        h += `<li>${t}`;
        if (next && next[0] > d) h += '<ul>';
        else h += '</li>';
        if (d === 1 && (!next || next[0] === 0)) h += '</ul></li>';
      });
      html.push(h + `</${tag}>`);
      continue;
    }
    const para = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|```|\s*([-*+]|\d+[.)])\s|\||\s*<)/.test(lines[i]); i++) para.push(lines[i].trim());
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    else i++;
  }
  return html.join('\n');
}

// ── Slides ─────────────────────────────────────────────────────────────────
const rawSlides = src.split(/\n-{3,}\s*\n/).map((s) => s.trim()).filter(Boolean);
const slides = rawSlides.map((raw, idx) => {
  const meta = {};
  raw = raw.replace(/<!--([\s\S]*?)-->/g, (m, body) => {
    if (!/:\s*/.test(body)) return m;
    body.split('|').forEach((part) => { const k = part.match(/^\s*(\w+)\s*:\s*(.*?)\s*$/); if (k) meta[k[1].toLowerCase()] = k[2]; });
    return '';
  });
  let notes = '';
  const nm = raw.match(/\n?(?:^|\n)(?:\?\?\?|Notes?:)\s*([\s\S]*)$/m);
  if (nm) { notes = nm[1].trim(); raw = raw.slice(0, nm.index).trim(); }
  const lines = raw.split('\n');
  const content = lines.filter((l) => l.trim());
  const h1 = content.length && /^#\s/.test(content[0]);
  const h2 = content.length && /^##\s/.test(content[0]);
  let layout = meta.layout;
  if (!layout) {
    if (idx === 0 && h1) layout = 'cover';
    else if (h1 && content.length <= 2 && !content.slice(1).some((l) => /^\s*[-*>|]/.test(l))) layout = 'section';
    else if (content.some((l) => l.trim() === '|||')) layout = 'columns';
    else if (content.length && content.every((l) => /^>|^[—–-]{1,2}\s/.test(l) || /^#{1,2}\s/.test(l)) && content.some((l) => /^>/.test(l))) layout = 'quote';
    else if (h2 && content.length === 2 && (/^!\[[^\]]*\]\([^)]+\)\s*$/.test(content[1]) || youtube(content[1]))) layout = 'image';
    else layout = 'bullets';
  }
  const titleLine = content.find((l) => /^#{1,2}\s/.test(l));
  const title = meta.title || (titleLine ? titleLine.replace(/^#+\s*/, '').replace(/[*_`]/g, '') : `Slide ${idx + 1}`);
  return { idx, layout, meta, notes, lines, title };
});

function renderSlide(s) {
  const body = s.lines.filter((l) => !/^#{1,2}\s/.test(l) || l !== s.lines.find((x) => /^#{1,2}\s/.test(x)));
  const head = s.lines.find((l) => /^#{1,2}\s/.test(l));
  const H = head ? inline(head.replace(/^#+\s*/, '')) : '';
  let inner;
  switch (s.layout) {
    case 'cover': {
      const rest = body.filter((l) => l.trim());
      inner = `<div class="cover-wrap"><h1>${H}</h1>${rest.length ? `<div class="sub">${blocks(rest)}</div>` : ''}${front.author ? `<div class="byline">${esc(front.author)}${front.date ? ' · ' + esc(front.date) : ''}</div>` : ''}</div>`;
      break;
    }
    case 'section':
      inner = `<div class="sec-wrap"><div class="rule"></div><h1>${H}</h1>${blocks(body)}</div>`;
      break;
    case 'quote': {
      const q = body.filter((l) => /^>/.test(l)).map((l) => l.replace(/^>\s?/, '')).join(' ');
      const by = (body.find((l) => /^[—–-]{1,2}\s/.test(l)) || '').replace(/^[—–-]{1,2}\s*/, '');
      inner = `${H ? `<h2>${H}</h2>` : ''}<blockquote class="big-quote">${inline(q)}</blockquote>${by ? `<div class="by">— ${inline(by)}</div>` : ''}`;
      break;
    }
    case 'columns': {
      const k = body.findIndex((l) => l.trim() === '|||');
      inner = `<h2>${H}</h2><div class="cols"><div class="col">${blocks(body.slice(0, k))}</div><div class="col">${blocks(body.slice(k + 1))}</div></div>`;
      break;
    }
    case 'stats': {
      const items = body.filter((l) => /^\s*[-*]\s/.test(l)).map((l) => {
        const t = l.replace(/^\s*[-*]\s+/, '');
        const m = t.match(/^\*\*(.+?)\*\*\s*(.*)$/);
        return m ? `<div class="stat"><div class="num">${inline(m[1])}</div><div class="lbl">${inline(m[2])}</div></div>` : `<div class="stat"><div class="lbl">${inline(t)}</div></div>`;
      });
      const rest = body.filter((l) => !/^\s*[-*]\s/.test(l));
      inner = `<h2>${H}</h2><div class="stats">${items.join('')}</div>${blocks(rest)}`;
      break;
    }
    case 'image':
      inner = `<h2>${H}</h2><div class="figure">${blocks(body)}</div>`;
      break;
    default:
      inner = `${H ? `<h2>${H}</h2>` : ''}<div class="content">${blocks(body)}</div>`;
  }
  // steps: true → every list item appears on its own → press.
  if (/^(true|yes|1|on)$/i.test(s.meta.steps || '')) inner = inner.replace(/<(ul|ol)>/g, '<$1 data-steps>');
  const attrs = [`class="slide layout-${s.layout}"`, `data-title="${esc(s.title)}"`];
  if (s.meta.sec) attrs.push(`data-sec="${esc(s.meta.sec)}"`);
  if (s.meta.min) attrs.push(`data-min="${esc(s.meta.min)}"`);
  const notes = s.notes ? `\n    <aside class="notes">${blocks(s.notes.split('\n'))}</aside>` : '';
  return `  <section ${attrs.join(' ')}>\n    ${inner}${notes}\n  </section>`;
}

// Carry section names forward so every slide in a section is grouped in the menu.
let lastSec = '';
slides.forEach((s) => { if (s.meta.sec) lastSec = s.meta.sec; else if (lastSec) s.meta.sec = lastSec; });

const deckTitle = front.title || slides[0].title;
const A = accents;
const page = `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8" />
<title>${esc(deckTitle)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="generator" content="deck-kit md-to-deck (theme: ${theme})" />
<meta name="deck-kit-tools" content="${resolve(root, 'scripts')}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fontLink}
<script src="deck-stage.js"></script>
<style>
  /* Theme: ${tj.name} — palette and fonts from templates/${theme}/template.json */
  :root {
    --bg: ${bg.css}; --fg: ${fg.css}; --accent: ${A[0]}; --accent-2: ${A[1]}; --accent-3: ${A[2] || A[0]}; --accent-text: ${accentText};
    --mute: color-mix(in srgb, var(--fg) 62%, var(--bg));
    --line: color-mix(in srgb, var(--fg) 18%, var(--bg));
    --card: color-mix(in srgb, var(--fg) 6%, var(--bg));
    --display: ${fonts.display}; --body: ${fonts.body}; --mono: ${fonts.mono};
  }
  html, body { margin: 0; background: #111; }
  deck-stage { background: #111; }
  section.slide { background: var(--bg); color: var(--fg); font-family: var(--body); padding: 100px 130px 90px;
    display: flex; flex-direction: column; gap: 34px; box-sizing: border-box; }
  h1, h2, h3 { font-family: var(--display); font-weight: 600; margin: 0; letter-spacing: -0.01em; line-height: 1.05; }
  h1 { font-size: 132px; } h2 { font-size: 78px; } h3 { font-size: 46px; color: var(--accent-text); }
  p, li, td, th { font-size: 38px; line-height: 1.38; }
  p { margin: 0; max-width: 1500px; }
  strong { color: var(--accent-text); font-weight: 700; }
  a { color: var(--accent-text); }
  code { font-family: var(--mono); font-size: .86em; background: var(--card); padding: .08em .3em; border-radius: 6px; }
  ul, ol { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: 18px; }
  ul ul { margin-top: 14px; gap: 10px; } ul ul li { font-size: 32px; color: var(--mute); }
  li::marker { color: var(--accent); }
  .content { display: flex; flex-direction: column; gap: 28px; flex: 1; min-height: 0; }
  .content img, .col img, .figure img { max-width: 100%; max-height: 640px; object-fit: contain; border-radius: 14px; }
  pre.code { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 28px 34px;
    font: 28px/1.5 var(--mono); overflow: hidden; white-space: pre-wrap; }
  pre.code code { background: none; padding: 0; font-size: inherit; }
  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; color: var(--accent-text); font-weight: 700; border-bottom: 3px solid var(--accent); padding: 12px 18px; }
  td { border-bottom: 1px solid var(--line); padding: 12px 18px; }
  .layout-cover { justify-content: center; }
  .cover-wrap { display: flex; flex-direction: column; gap: 36px; max-width: 1500px; }
  .cover-wrap h1 { font-size: 150px; }
  .cover-wrap .sub p { font-size: 46px; color: var(--mute); }
  .byline { font-size: 30px; color: var(--accent-text); letter-spacing: .04em; }
  .layout-section { justify-content: center; }
  .sec-wrap { display: flex; flex-direction: column; gap: 30px; }
  .sec-wrap .rule { width: 160px; height: 10px; background: var(--accent); border-radius: 5px; }
  .sec-wrap p { font-size: 42px; color: var(--mute); }
  .layout-quote { justify-content: center; }
  .big-quote { font-family: var(--display); font-size: 84px; line-height: 1.15; margin: 0; max-width: 1550px; position: relative; }
  .big-quote::before { content: "“"; position: absolute; left: -.55em; top: -.15em; color: var(--accent); font-size: 1.6em; }
  .by { font-size: 34px; color: var(--mute); }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; flex: 1; min-height: 0; }
  .col { display: flex; flex-direction: column; gap: 26px; min-width: 0; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; }
  .stat { background: var(--card); border-top: 8px solid var(--accent); border-radius: 18px; padding: 36px 40px; }
  .stat:nth-child(3n+2) { border-color: var(--accent-2); } .stat:nth-child(3n) { border-color: var(--accent-3); }
  .stat .num { font-family: var(--display); font-size: 108px; line-height: 1; margin-bottom: 14px; }
  .stat .lbl { font-size: 32px; color: var(--mute); }
  .figure { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
  .figure img { max-height: 760px; }
  video { max-width: 100%; max-height: 760px; border-radius: 14px; background: #000; }
  audio { width: min(900px, 100%); }
  .embed { position: relative; width: min(1400px, 100%); aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden; background: #000; }
  .embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  canvas.chart { width: 100%; height: 600px; }
  .quiz { list-style: none; padding: 0; gap: 16px; }
  .quiz li { background: var(--card); border: 2px solid var(--line); border-radius: 14px; padding: 16px 28px; }
  li:has(> .task) { list-style: none; margin-left: -1.1em; }
  .task { display: inline-block; width: .8em; height: .8em; margin-right: .45em; border: 3px solid var(--accent); border-radius: 6px; vertical-align: -.05em; position: relative; }
  .task.done { background: var(--accent); }
  .task.done::after { content: ""; position: absolute; left: .22em; top: .02em; width: .2em; height: .42em; border: solid var(--bg); border-width: 0 .1em .1em 0; transform: rotate(45deg); }
</style>
</head>
<body>
<deck-stage width="1920" height="1080">
${slides.map(renderSlide).join('\n\n')}
</deck-stage>
<script src="deck-kit.js"></script>
</body>
</html>
`;
writeFileSync(join(out, 'index.html'), page);
copyFileSync(resolve(root, 'runtime/deck-stage.js'), join(out, 'deck-stage.js'));
copyFileSync(resolve(root, 'runtime/deck-kit.js'), join(out, 'deck-kit.js'));
writeDeckMemory(out, { title: deckTitle, template: theme, lang, source: process.env.DECK_SOURCE || basename(mdPath) });
const counts = slides.reduce((m, s) => ((m[s.layout] = (m[s.layout] || 0) + 1), m), {});
console.log(`Wrote ${join(out, 'index.html')} — ${slides.length} slides (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), theme "${theme}".`);
