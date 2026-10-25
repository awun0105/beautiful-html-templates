#!/usr/bin/env node
/**
 * bundle.mjs — turn a finished deck into ONE self-contained HTML file that
 * works offline: local <script src>, <link rel=stylesheet>, images and CSS
 * url()s are inlined, and Google Fonts are downloaded and embedded as woff2.
 *
 * Usage:
 *   node scripts/bundle.mjs <deck.html> [out.html] [--subsets=latin,latin-ext,vietnamese | --all-subsets]
 *
 * Default output: <deck>.bundle.html next to the input. Only the font subsets
 * listed are embedded (Google splits each font into latin, cyrillic, greek…);
 * the default covers English and Vietnamese and keeps the file small.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v ?? true];
}));
const [input, output] = args.filter((a) => !a.startsWith('--'));
if (!input) {
  console.error('Usage: node scripts/bundle.mjs <deck.html> [out.html] [--subsets=latin,vietnamese | --all-subsets]');
  process.exit(1);
}
const inPath = resolve(input);
const baseDir = dirname(inPath);
const outPath = resolve(output || inPath.replace(/\.html?$/i, '') + '.bundle.html');
const subsets = flags['all-subsets'] ? null : String(flags.subsets || 'latin,latin-ext,vietnamese').split(',');

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm',
};
// Google serves woff2 + per-subset blocks only to modern browsers.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const isRemote = (u) => /^(https?:)?\/\//i.test(u);
const isInlineable = (u) => u && !isRemote(u) && !/^(data:|#|blob:|javascript:)/i.test(u);
const stats = { scripts: 0, styles: 0, assets: 0, fonts: 0, skipped: 0, missing: [] };

function dataUri(file) {
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  return `data:${type};base64,${readFileSync(file).toString('base64')}`;
}

function localFile(ref, from) {
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  const file = resolve(from, clean);
  if (existsSync(file)) return file;
  stats.missing.push(ref);
  return null;
}

/** Inline relative url(...) references inside CSS text. */
function inlineCssUrls(css, from) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    if (!isInlineable(ref)) return m;
    const f = localFile(ref, from);
    if (!f) return m;
    stats.assets++;
    return `url("${dataUri(f)}")`;
  });
}

async function fetchBuf(url) {
  const res = await fetch(url.startsWith('//') ? 'https:' + url : url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

/** Download a Google Fonts stylesheet and embed its font files. */
async function inlineGoogleFonts(href) {
  const css = await (await fetchBuf(href)).text();
  // Most @font-face rules carry a subset label (/* latin */, /* vietnamese */);
  // the ~100 slices of a CJK font carry none, so unlabeled counts as "other".
  const faces = [...css.matchAll(/(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*\{[^}]*\}/g)];
  const kept = [];
  for (const [block, sub] of faces) {
    if (subsets && !subsets.includes(sub)) { stats.skipped++; continue; }
    let out = block;
    for (const [, url] of block.matchAll(/url\((https:[^)]+)\)/g)) {
      const buf = Buffer.from(await (await fetchBuf(url)).arrayBuffer());
      out = out.replace(url, `data:font/woff2;base64,${buf.toString('base64')}`);
      stats.fonts++;
    }
    kept.push(out);
  }
  return kept.join('');
}

let html = readFileSync(inPath, 'utf8');

// Preconnect hints are pointless once nothing is fetched.
html = html.replace(/<link\b[^>]*rel=["']preconnect["'][^>]*>\s*/gi, '');

// Stylesheets: Google Fonts → embedded fonts; local files → inline <style>.
const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)].map((m) => m[0]);
for (const tag of links) {
  const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
  if (!href) continue;
  try {
    if (/fonts\.googleapis\.com/.test(href)) {
      html = html.replace(tag, `<style data-bundled="google-fonts">\n${await inlineGoogleFonts(href.replace(/&amp;/g, '&'))}</style>`);
      stats.styles++;
    } else if (isInlineable(href)) {
      const f = localFile(href, baseDir);
      if (!f) continue;
      html = html.replace(tag, `<style data-bundled="${basename(f)}">\n${inlineCssUrls(readFileSync(f, 'utf8'), dirname(f))}\n</style>`);
      stats.styles++;
    }
  } catch (e) {
    console.warn(`warning: could not inline ${href}: ${e.message}`);
  }
}

// Local scripts → inline. "</script" inside the code would end the tag early.
html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (m, pre, src, post) => {
  if (!isInlineable(src)) return m;
  const f = localFile(src, baseDir);
  if (!f) return m;
  stats.scripts++;
  const code = readFileSync(f, 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script${pre}${post} data-bundled="${basename(f)}">\n${code}\n</script>`;
});

// Images, video posters and sources.
html = html.replace(/(<(?:img|source|video|audio)\b[^>]*?\b(?:src|poster)=)(["'])([^"']+)\2/gi, (m, pre, q, src) => {
  if (!isInlineable(src)) return m;
  const f = localFile(src, baseDir);
  if (!f) return m;
  stats.assets++;
  return `${pre}${q}${dataUri(f)}${q}`;
});

// url(...) inside inline <style> blocks and style="" attributes.
html = html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, b) => a + inlineCssUrls(css, baseDir) + b);
html = html.replace(/style=(["'])([^"']*url\([^"']*)\1/gi, (m, q, css) => `style=${q}${inlineCssUrls(css, baseDir)}${q}`);

writeFileSync(outPath, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Wrote ${outPath} (${kb} KB): ${stats.scripts} scripts, ${stats.styles} stylesheets, ${stats.fonts} font files, ${stats.assets} assets inlined.`);
const remote = [...new Set([...html.matchAll(/\b(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]))];
if (stats.skipped) console.log(`Skipped ${stats.skipped} font blocks outside --subsets=${subsets.join(',')} (use --all-subsets for CJK etc.).`);
if (remote.length) console.log('Still remote (needs internet):\n  ' + remote.join('\n  '));
if (stats.missing.length) console.log('Not found, left as-is:\n  ' + [...new Set(stats.missing)].join('\n  '));
