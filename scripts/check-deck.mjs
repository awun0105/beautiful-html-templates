#!/usr/bin/env node
/**
 * check-deck.mjs — lint a finished deck in a real browser before handing it over.
 *
 *   node scripts/check-deck.mjs path/to/deck.html [--strict]
 *
 * Errors (exit 1):   leftover template placeholders, broken images,
 *                    JavaScript errors, slides deck-kit can't reach.
 * Warnings:          text running outside the slide or clipped by its box,
 *                    slides without data-title, missing speaker notes when
 *                    other slides have them, planned time far from the total.
 * --strict           treat warnings as errors too.
 */

import { resolve } from 'node:path';
import { launch, openDeck, showSlide } from './lib/browser.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const strict = args.includes('--strict');
if (!file) { console.error('Usage: node scripts/check-deck.mjs <deck.html> [--strict]'); process.exit(1); }

// Authoring tokens the templates ship with; any left in a finished deck is a miss.
const PLACEHOLDERS = [
  /\[(Presentation|Topic|Year|Studio|Name|Company|Title|Subtitle|Date|Author|Client|Project)[^\]]*\]/i,
  /\blorem ipsum\b/i, /\bImage Placeholder\b/i, /\bplaceholder\.(jpg|png)\b/i, /\bTK\b(?=[\s.,])/,
];

const browser = await launch();
const page = await openDeck(browser, resolve(file), { width: 1920, height: 1080 });
const n = await page.evaluate(() => DeckKit.length);
const errors = [], warns = [];

for (let i = 0; i < n; i++) {
  await showSlide(page, i, 500);
  const at = await page.evaluate(() => DeckKit.index);
  if (at !== i) { errors.push(`slide ${i + 1}: navigation could not reach it (stuck at ${at + 1})`); continue; }
  const r = await page.evaluate((i, PH) => {
    const s = DeckKit.slides[i];
    const sr = s.getBoundingClientRect();
    const res = { title: s.getAttribute('data-title') || s.getAttribute('data-label'), notes: !!DeckKit.notesOf(i), outside: [], clipped: [], placeholders: [], images: [] };
    const visible = (e) => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const label = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    const slack = 4 * (sr.width / s.offsetWidth || 1);
    s.querySelectorAll('*').forEach((e) => {
      if (e.closest('aside.notes, script, style, [aria-hidden="true"], [data-check="off"]')) return;
      const ownText = [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
      if (!ownText || !visible(e)) return;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.right > sr.right + slack || r.bottom > sr.bottom + slack || r.left < sr.left - slack || r.top < sr.top - slack) res.outside.push(label(e));
      const cs = getComputedStyle(e);
      if (/(hidden|clip)/.test(cs.overflow + cs.overflowY) && e.scrollHeight > e.clientHeight + 4) res.clipped.push(label(e));
    });
    const text = s.innerText || s.textContent || '';
    PH.forEach((src) => { const m = text.match(new RegExp(src[0], src[1])); if (m) res.placeholders.push(m[0]); });
    s.querySelectorAll('img').forEach((im) => { if (im.complete && !im.naturalWidth) res.images.push(im.getAttribute('src')); });
    return res;
  }, i, PLACEHOLDERS.map((re) => [re.source, re.flags]));
  const tag = `slide ${i + 1}`;
  r.placeholders.forEach((p) => errors.push(`${tag}: placeholder left in: "${p}"`));
  r.images.forEach((p) => errors.push(`${tag}: image failed to load: ${p}`));
  [...new Set(r.outside)].slice(0, 3).forEach((t) => warns.push(`${tag}: text outside the slide: "${t}"`));
  [...new Set(r.clipped)].slice(0, 3).forEach((t) => warns.push(`${tag}: text clipped by its box: "${t}"`));
  if (!r.title) warns.push(`${tag}: no data-title (menu shows "${await page.evaluate((i) => DeckKit.titleOf(i), i)}")`);
  page._notes = (page._notes || []).concat([r.notes]);
}

const notes = page._notes || [];
if (notes.some(Boolean)) notes.forEach((has, i) => { if (!has) warns.push(`slide ${i + 1}: no speaker notes (other slides have them)`); });
const plan = await page.evaluate(() => DeckKit.plan);
if (plan.total) {
  const missing = plan.mins.map((m, i) => (m ? 0 : i + 1)).filter(Boolean);
  if (missing.length) warns.push(`data-min missing on slide${missing.length > 1 ? 's' : ''} ${missing.join(', ')} (planned total ${plan.total} min)`);
}
page._errors.forEach((e) => errors.push(`JavaScript: ${e}`));
await browser.close();

console.log(`${file}: ${n} slides${plan.total ? `, ${plan.total} min planned` : ''}`);
errors.forEach((e) => console.log('  ERROR ' + e));
warns.forEach((w) => console.log('  warn  ' + w));
if (!errors.length && !warns.length) console.log('  ✓ no problems found');
process.exit(errors.length || (strict && warns.length) ? 1 : 0);
