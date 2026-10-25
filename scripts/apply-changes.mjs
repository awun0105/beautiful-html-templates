#!/usr/bin/env node
/**
 * apply-changes.mjs — merge changes saved from the browser into the deck file,
 * for browsers that can't write files directly (Firefox, Safari).
 *
 *   node scripts/apply-changes.mjs path/to/deck.html changes.json [--out=other.html]
 *
 * changes.json is what the deck downloads:
 *   notes.json  from the presenter view's "Save" (speaker notes)
 *   edits.json  from edit mode (E) — moved / resized / retyped / hidden elements
 * Only the affected tags change; the rest of the file keeps every byte.
 * Uses the same routines as the browser (DeckKit.patchNotes / patchEdits).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const [deckArg, jsonArg] = args.filter((a) => !a.startsWith('--'));
const outArg = (args.find((a) => a.startsWith('--out=')) || '').slice(6);
if (!deckArg || !jsonArg) {
  console.error('Usage: node scripts/apply-changes.mjs <deck.html> <notes.json|edits.json> [--out=file.html]');
  process.exit(1);
}
const deck = resolve(deckArg);
const data = JSON.parse(readFileSync(resolve(jsonArg), 'utf8'));
// Older notes.json files were a bare {index: html} map.
const notes = data.notes || (!data.edits && !data.deck ? data : null);
const edits = data.edits || null;
const src = readFileSync(deck, 'utf8');

const browser = await launch();
const page = await browser.newPage();
await page.goto('about:blank');
await page.addScriptTag({ path: resolve(root, 'runtime/deck-kit.js') });
let out;
try {
  out = await page.evaluate((src, notes, edits, count) => {
    if (count == null) {
      const doc = new DOMParser().parseFromString(src, 'text/html');
      const ds = doc.querySelector('deck-stage');
      count = ds ? Array.from(ds.children).filter((e) => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName)).length
        : Array.from(doc.querySelectorAll('.slide')).filter((s) => !s.parentElement.closest('.slide')).length;
    }
    let text = src;
    if (edits && edits.length) text = window.DeckKit.patchEdits(text, edits, count);
    if (notes && Object.keys(notes).length) text = window.DeckKit.patchNotes(text, new Map(Object.entries(notes).map(([k, v]) => [+k, v])), count);
    return text;
  }, src, notes, edits, data.slides ?? null);
} catch (e) {
  console.error('Could not apply changes: ' + e.message.split('\n')[0]);
  await browser.close();
  process.exit(1);
}
await browser.close();
const target = outArg ? resolve(outArg) : deck;
writeFileSync(target, out);
const parts = [];
if (edits && edits.length) parts.push(`${edits.length} edit(s)`);
if (notes && Object.keys(notes).length) parts.push(`notes for ${Object.keys(notes).length} slide(s)`);
console.log(`Applied ${parts.join(' and ') || 'nothing'} → ${target}`);
