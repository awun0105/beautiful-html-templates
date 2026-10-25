#!/usr/bin/env node
/**
 * apply-notes.mjs — merge speaker notes edited in the presenter view back
 * into the deck file (for browsers that can't save directly: Firefox, Safari).
 *
 *   node scripts/apply-notes.mjs path/to/deck.html notes.json [--out=other.html]
 *
 * notes.json comes from the presenter view's "Save" button. Only the edited
 * slides' <aside class="notes"> change; the rest of the file keeps its content.
 * Uses the same patch routine as the browser (DeckKit.patchNotes).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const [deckArg, notesArg] = args.filter((a) => !a.startsWith('--'));
const outArg = (args.find((a) => a.startsWith('--out=')) || '').slice(6);
if (!deckArg || !notesArg) {
  console.error('Usage: node scripts/apply-notes.mjs <deck.html> <notes.json> [--out=file.html]');
  process.exit(1);
}
const deck = resolve(deckArg);
const data = JSON.parse(readFileSync(resolve(notesArg), 'utf8'));
const notes = data.notes || data;
const src = readFileSync(deck, 'utf8');

const browser = await launch();
const page = await browser.newPage();
await page.goto('about:blank');
await page.addScriptTag({ path: resolve(root, 'runtime/deck-kit.js') });
let out;
try {
  out = await page.evaluate((src, notes, count) => {
    const edits = new Map(Object.entries(notes).map(([k, v]) => [+k, v]));
    if (count == null) {
      // No slide count recorded: trust the file's own count.
      const doc = new DOMParser().parseFromString(src, 'text/html');
      const ds = doc.querySelector('deck-stage');
      count = ds ? Array.from(ds.children).filter((e) => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName)).length
        : Array.from(doc.querySelectorAll('.slide')).filter((s) => !s.parentElement.closest('.slide')).length;
    }
    return window.DeckKit.patchNotes(src, edits, count);
  }, src, notes, data.slides ?? null);
} catch (e) {
  console.error('Could not apply notes: ' + e.message.split('\n')[0]);
  await browser.close();
  process.exit(1);
}
await browser.close();
const target = outArg ? resolve(outArg) : deck;
writeFileSync(target, out);
console.log(`Applied notes for ${Object.keys(notes).length} slide(s) → ${target}`);
