#!/usr/bin/env node
/**
 * test-templates.mjs — headless regression test for every template and the
 * deck-kit demo: boot, navigation, panels, print, presenter view, widgets.
 *
 *   node scripts/test-templates.mjs                 # everything
 *   node scripts/test-templates.mjs vellum,coral    # some templates (skips the demo)
 *   node scripts/test-templates.mjs demo            # only the demo / presenter checks
 *   node scripts/test-templates.mjs --keep=out/     # keep PDFs / screenshots
 *
 * Exit code 1 when anything fails.
 */

import { readdirSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { launch, openDeck, sleep } from './lib/browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const keep = (args.find((a) => a.startsWith('--keep=')) || '').slice(7);
const only = args.find((a) => !a.startsWith('--'));
const out = keep ? resolve(keep) : mkdtempSync(join(tmpdir(), 'deck-test-'));
mkdirSync(out, { recursive: true });

// Page count via poppler's pdfinfo when available (Chrome compresses its page tree).
const pdfPages = (file) => {
  try { return +execSync(`pdfinfo "${file}"`).toString().match(/Pages:\s+(\d+)/)[1]; } catch { return 0; }
};
const kit = (fn) => `(() => { const k = document.querySelector('#deck-kit').shadowRoot; return (${fn})(k); })()`;

let failed = 0;
const browser = await launch();

// ── Templates ──────────────────────────────────────────────────────────────
for (const slug of readdirSync(resolve(root, 'templates')).sort()) {
  if (only && !only.split(',').includes(slug)) continue;
  const problems = [];
  let info = {};
  let page;
  try {
    page = await openDeck(browser, resolve(root, 'templates', slug, 'template.html'), { width: 1600, height: 900 });
    await sleep(1000); // some templates lock navigation during their intro animation
    info = await page.evaluate(() => ({ mode: DeckKit.mode, n: DeckKit.length, i: DeckKit.index }));
    if (info.i !== 0) problems.push(`starts at ${info.i}`);

    // Three quick presses: deck-kit queues them even if the template is animating.
    for (let k = 0; k < 3; k++) await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => DeckKit.index === 3, { timeout: 6000 }).catch(() => {});
    let i = await page.evaluate(() => DeckKit.index);
    if (i !== 3) problems.push(`3× ArrowRight → ${i}`);

    await page.keyboard.press('Home');
    await page.waitForFunction(() => DeckKit.index === 0, { timeout: 4000 }).catch(() => {});
    await page.keyboard.press('2');
    await page.waitForFunction(() => DeckKit.index === 1, { timeout: 4000 }).catch(() => {});
    i = await page.evaluate(() => DeckKit.index);
    if (i !== 1) problems.push(`key "2" → ${i}`);

    const target = Math.min(info.n - 1, 4);
    await page.evaluate((t) => DeckKit.goTo(t), target);
    await page.waitForFunction((t) => DeckKit.index === t, { timeout: 4000 }, target).catch(() => {});
    if ((await page.evaluate(() => location.hash)) !== '#' + (target + 1)) problems.push('hash not updated');

    await page.keyboard.press('n');
    if (!(await page.evaluate(kit((k) => k.querySelector('.dk-notes').classList.contains('dk-show'))))) problems.push('N: no notes');
    await page.keyboard.press('m');
    const rows = await page.evaluate(kit((k) => k.querySelector('.dk-menu.dk-show') ? k.querySelectorAll('.dk-menu button').length : -1));
    if (rows !== info.n) problems.push(`menu rows ${rows}`);
    await page.evaluate(kit((k) => k.querySelectorAll('.dk-menu button')[2].click()));
    await page.waitForFunction(() => DeckKit.index === 2, { timeout: 4000 }).catch(() => {});
    if ((await page.evaluate(() => DeckKit.index)) !== 2) problems.push('menu click');
    await page.keyboard.press('Escape');

    await page.keyboard.press('b');
    if (!(await page.evaluate(kit((k) => k.querySelector('.dk-blank').classList.contains('dk-show'))))) problems.push('B: no blank');
    await page.keyboard.press('b');

    await page.evaluate(() => DeckKit.visitAll({ settle: 60 }));
    await page.evaluate(() => DeckKit.preparePrint());
    await page.emulateMediaType('print');
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    writeFileSync(join(out, `${slug}.pdf`), pdf);
    const pages = pdfPages(join(out, `${slug}.pdf`));
    if (pages && pages !== info.n) problems.push(`pdf pages ${pages}/${info.n}`);
    await page.emulateMediaType('screen');
    await page.evaluate(() => DeckKit.cleanupPrint());
    problems.push(...page._errors.slice(0, 3));
  } catch (e) {
    problems.push('EXC ' + e.message.split('\n')[0]);
  }
  if (page) await page.close();
  if (problems.length) failed++;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${slug.padEnd(20)} ${String(info.mode).padEnd(10)} ${info.n || '?'} slides  ${problems.join(' | ')}`);
}

// ── Demo: widgets, helpers, presenter view ─────────────────────────────────
if (!only || only === "demo") {
  const demo = resolve(root, 'examples/deck-kit-demo/index.html');
  const checks = [];
  const ok = (name, cond, extra = '') => { checks.push(!!cond); if (!cond) failed++; console.log(`${cond ? 'ok  ' : 'FAIL'} demo: ${name} ${extra}`); };
  const page = await openDeck(browser, demo, { width: 1600, height: 900 });
  await sleep(500);
  ok('boots', await page.evaluate(() => DeckKit.mode === 'deck-stage' && DeckKit.length >= 6));
  // An animated widget (tick) changes its canvas while its slide is shown.
  await page.evaluate(() => DeckKit.goTo(2)); await sleep(400);
  const snap = () => page.evaluate(() => document.querySelector('[data-deck-active] canvas').toDataURL().slice(-300));
  const a = await snap(); await sleep(250);
  ok('widget ticks on its slide', a !== (await snap()));
  await page.evaluate(() => DeckKit.goTo(1)); await sleep(400);
  const slider = await page.$('input[type=range]');
  await slider.focus();
  const before = await page.evaluate((e) => +e.value, slider);
  await page.keyboard.press('ArrowRight');
  ok('arrow on slider moves the slider', (await page.evaluate((e) => +e.value, slider)) > before && (await page.evaluate(() => DeckKit.index)) === 1);
  await page.evaluate(() => document.activeElement.blur());
  ok('bind updates <output>', await page.evaluate(() => [...document.querySelectorAll('output')].some((o) => o.textContent.trim() !== '')));
  ok('palette reads template colours', await page.evaluate(() => DeckKit.palette(document.querySelector('canvas')).accents.length >= 3));

  // Presenter view: popup with notes; navigation flows both ways.
  const popup = browser.waitForTarget((t) => t.url().includes('dk=presenter'), { timeout: 8000 }).catch(() => null);
  await page.keyboard.press('p');
  const target = await popup;
  const pv = target && (await target.page());
  ok('P opens the presenter window', !!pv);
  if (pv) {
    await pv.waitForFunction(() => window.DeckKit && DeckKit.role === 'presenter' && document.querySelector('#deck-kit'), { timeout: 10000 });
    await sleep(1500);
    const pvNotes = () => pv.evaluate(() => document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-pnotes').textContent);
    ok('presenter shows notes of the current slide', /σ|sigma|bell|Drag/i.test(await pvNotes()));
    await pv.keyboard.press('ArrowRight');
    await page.waitForFunction(() => DeckKit.index === 2, { timeout: 4000 }).catch(() => {});
    ok('→ in presenter moves the audience deck', (await page.evaluate(() => DeckKit.index)) === 2);
    await page.evaluate(() => DeckKit.goTo(3));
    await sleep(800);
    ok('audience navigation updates presenter', /Quick check|4\./.test(await pv.evaluate(() => document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-title').textContent)));

    // Controls stay in sync both ways between the audience screen and the current preview.
    const preview = async (i) => {
      for (const f of pv.frames()) {
        if (!f.url().includes('dk=mirror')) continue;
        try { if ((await f.evaluate(() => window.DeckKit && DeckKit.index)) === i) return f; } catch {}
      }
      return null;
    };
    await page.evaluate(() => DeckKit.goTo(1));
    await sleep(1200);
    const setRange = (n, v) => { const el = DeckKit.slides[1].querySelectorAll('input')[n]; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    await page.evaluate(setRange, 0, '2.5');
    await sleep(600);
    let f = await preview(1);
    ok('slider on the audience screen moves the preview', f && (await f.evaluate(() => DeckKit.slides[1].querySelectorAll('input')[0].value)) === '2.5');
    if (f) await f.evaluate(setRange, 1, '0.4');
    await sleep(600);
    ok('slider in the preview moves the audience screen', (await page.evaluate(() => DeckKit.slides[1].querySelectorAll('input')[1].value)) === '0.4');
    const qi = await page.evaluate(() => DeckKit.slides.findIndex((s) => s.querySelector('[data-reveal]')));
    await page.evaluate((i) => DeckKit.goTo(i), qi);
    await sleep(1200);
    f = await preview(qi);
    if (f) await f.evaluate(() => document.querySelector('[data-reveal]').click());
    await sleep(600);
    ok('answer revealed in the preview shows on the audience screen', await page.evaluate(() => !document.getElementById(document.querySelector('[data-reveal]').getAttribute('data-reveal')).hidden));
    await pv.close();
  }

  // Print: canvases on never-visited slides are drawn and kept.
  const fresh = await openDeck(browser, demo, { width: 1600, height: 900 });
  await fresh.evaluate(() => DeckKit.preparePrint());
  ok('print snapshots every canvas', await fresh.evaluate(() => document.querySelectorAll('img.dk-print-img').length === document.querySelectorAll('section canvas').length));
  await fresh.evaluate(() => DeckKit.cleanupPrint());
  ok('no console errors', !page._errors.length && !fresh._errors.length, [...page._errors, ...fresh._errors].join(' | '));
  await page.close(); await fresh.close();
}

await browser.close();
console.log(failed ? `\n${failed} failure(s). Output: ${out}` : `\nAll passed. Output: ${out}`);
process.exit(failed ? 1 : 0);
