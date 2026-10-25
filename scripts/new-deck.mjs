#!/usr/bin/env node
/**
 * new-deck.mjs — start a deck from a template in one step.
 *
 *   node scripts/new-deck.mjs <template-slug> <dest-dir> [--lang=vi] [--title="My talk"] [--force]
 *
 * Copies the template folder (without previews/), names the page index.html,
 * refreshes the runtime files from runtime/, sets <html lang> and <title>, and
 * empties the template's demo speaker notes so they can't leak into a talk.
 * Prints the next steps (fill content → check → export).
 */

import { cpSync, existsSync, readFileSync, writeFileSync, renameSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, ...v] = a.slice(2).split('=');
  return [k, v.length ? v.join('=') : true];
}));
const [slug, destArg] = args.filter((a) => !a.startsWith('--'));
const slugs = readdirSync(resolve(root, 'templates')).filter((d) => existsSync(resolve(root, 'templates', d, 'template.html')));
if (!slug || !destArg) {
  console.error('Usage: node scripts/new-deck.mjs <template-slug> <dest-dir> [--lang=vi] [--title="…"] [--force]');
  console.error('Templates: ' + slugs.join(', '));
  process.exit(1);
}
if (!slugs.includes(slug)) {
  console.error(`Unknown template "${slug}". Templates: ${slugs.join(', ')}`);
  process.exit(1);
}
const src = resolve(root, 'templates', slug);
const dest = resolve(destArg);
if (existsSync(dest) && readdirSync(dest).length && !opt.force) {
  console.error(`${dest} is not empty (use --force to copy into it anyway).`);
  process.exit(1);
}

cpSync(src, dest, { recursive: true, filter: (p) => !/[\\/](previews|\.DS_Store)$/.test(p) });
renameSync(join(dest, 'template.html'), join(dest, 'index.html'));
const meta = join(dest, 'template.json');
if (existsSync(meta)) rmSync(meta);
copyFileSync(resolve(root, 'runtime/deck-kit.js'), join(dest, 'deck-kit.js'));
if (existsSync(join(dest, 'deck-stage.js'))) {
  const rail = readFileSync(join(dest, 'deck-stage.js'), 'utf8').includes('(g) thumbnail rail');
  copyFileSync(resolve(root, rail ? 'runtime/deck-stage-rail.js' : 'runtime/deck-stage.js'), join(dest, 'deck-stage.js'));
}

let html = readFileSync(join(dest, 'index.html'), 'utf8');
if (opt.lang) html = html.replace(/<html\b([^>]*?)\s*(lang="[^"]*")?([^>]*)>/i, (m, a, _l, b) => `<html${a} lang="${opt.lang}"${b}>`);
if (opt.title) {
  const t = String(opt.title).replace(/[<&]/g, (c) => ({ '<': '&lt;', '&': '&amp;' }[c]));
  html = /<title>[\s\S]*?<\/title>/i.test(html) ? html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`) : html.replace(/<head>/i, `<head>\n<title>${t}</title>`);
}
// Demo notes describe the template, not the user's talk.
html = html.replace(/(<script[^>]*id=["']speaker-notes["'][^>]*>)[\s\S]*?(<\/script>)/i, '$1[]$2');
writeFileSync(join(dest, 'index.html'), html);

const rel = (p) => relative(process.cwd(), p) || '.';
const tool = (s) => {
  const p = resolve(root, 'scripts', s);
  return `node ${rel(p).startsWith('..') ? p : rel(p)}`;
};
console.log(`Created ${rel(dest)}/ from "${slug}".

Next:
  1. Edit ${rel(join(dest, 'index.html'))} — replace the demo content (see AGENTS.md §3),
     add data-title / data-sec / data-min and <aside class="notes"> per slide (§8).
  2. Check:   ${tool('check-deck.mjs')} ${rel(join(dest, 'index.html'))}
  3. Present: open it, press P for the presenter view.
  4. Share:   ${tool('export.mjs')} ${rel(join(dest, 'index.html'))}     (PDF, PNGs, handout)
              ${tool('bundle.mjs')} ${rel(join(dest, 'index.html'))}     (one offline .html)`);
