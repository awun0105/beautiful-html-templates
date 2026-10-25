#!/usr/bin/env node
/**
 * test-templates.mjs — headless regression test for every template and the
 * deck-kit demo: boot, navigation, panels, print, presenter view, widgets.
 *
 *   node scripts/test-templates.mjs                 # everything
 *   node scripts/test-templates.mjs vellum,coral    # some templates (skips the demo)
 *   node scripts/test-templates.mjs demo            # only the demo / presenter checks
 *   node scripts/test-templates.mjs features        # only steps, maths, code, quiz, charts…
 *   node scripts/test-templates.mjs --keep=out/     # keep PDFs / screenshots
 *
 * Exit code 1 when anything fails.
 */

import { readdirSync, mkdirSync, writeFileSync, mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { launch, openDeck, sleep, fileUrl } from './lib/browser.mjs';

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

/** Edit mode round trip: move + retype one text element, save through a
 *  stubbed file picker, and return how many source lines changed. */
async function editRoundTrip(page, file, slide) {
  const src = readFileSync(file, 'utf8');
  await page.evaluate((src) => {
    window.__written = null;
    window.showOpenFilePicker = async () => [{ name: location.pathname.split('/').pop(), queryPermission: async () => 'granted',
      getFile: async () => ({ text: async () => src }), createWritable: async () => ({ write: async (t) => { window.__written = t; }, close: async () => {} }) }];
  }, src);
  await page.evaluate((i) => DeckKit.goTo(i), slide);
  await page.waitForFunction((i) => DeckKit.index === i, { timeout: 5000 }, slide).catch(() => {});
  await page.evaluate((i) => DeckKit.settle(i, { min: 300 }), slide);   // entrance animations done
  const box = await page.evaluate((i) => {
    const s = DeckKit.slides[i];
    const e = [...s.querySelectorAll('h1, h2, h3, p, li')].find((x) => {
      const r = x.getBoundingClientRect();
      return r.width > 40 && r.height > 8 && x.textContent.trim() && x.checkVisibility() && document.elementFromPoint(r.left + 12, r.top + r.height / 2) === x;
    });
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.left + 12, y: r.top + r.height / 2 };
  }, slide);
  if (!box) return { skipped: true };
  await page.keyboard.press('e');
  await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 40, box.y + 20, { steps: 4 }); await page.mouse.up();
  await page.mouse.click(box.x + 40, box.y + 20, { clickCount: 2 });
  await page.keyboard.type(' QA');
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__written !== null, { timeout: 4000 }).catch(() => {});
  const out = await page.evaluate(() => window.__written);
  if (!out) return { error: await page.evaluate(() => document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-toast').textContent) };
  const a = new Set(src.split('\n')), added = out.split('\n').filter((l) => !a.has(l));
  // The stage may be scaled, so 40 screen px is not 40 CSS px.
  return { added: added.length, ok: /translate: \d+px \d+px/.test(out) && /QA/.test(out) };
}

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

    // Edit mode writes back only the edited tag.
    const rt = await editRoundTrip(page, resolve(root, 'templates', slug, 'template.html'), Math.min(1, info.n - 1));
    if (rt.error) problems.push('edit save: ' + rt.error);
    else if (!rt.skipped && (!rt.ok || rt.added > 3)) problems.push(`edit round trip: ${rt.added} new lines${rt.ok ? '' : ', change missing'}`);

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

  // Links between slides and #id deep links.
  {
    const lp = await openDeck(browser, demo, { width: 1600, height: 900 });
    const at = await lp.evaluate(() => { const r = document.querySelector('a[href^="#"]').getBoundingClientRect(); return { x: r.left + 8, y: r.top + r.height / 2, id: document.querySelector('a[href^="#"]').getAttribute('href') }; });
    await lp.mouse.click(at.x, at.y);
    await sleep(600);
    const want = await lp.evaluate((id) => DeckKit.slides.findIndex((s) => s.id === id.slice(1)), at.id);
    ok('<a href="#id"> jumps to its slide', want > 0 && (await lp.evaluate(() => DeckKit.index)) === want);
    await lp.close();
    const dp = await openDeck(browser, demo, { width: 1600, height: 900, hash: at.id });
    await sleep(300);
    ok('#id deep link opens that slide', (await dp.evaluate(() => DeckKit.index)) === want);
    // K: copy an element's location, without moving the deck.
    await dp.evaluate(() => DeckKit.goTo(1)); await sleep(500);
    const h = await dp.evaluate(() => { const r = DeckKit.slides[1].querySelector('h2').getBoundingClientRect(); return { x: r.left + 20, y: r.top + 15 }; });
    await dp.keyboard.press('k'); await dp.mouse.click(h.x, h.y); await sleep(600);
    const toast = await dp.evaluate(() => document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-toast').textContent);
    ok('K copies file, slide and element', /index\.html.*slide 2.*<h2>/.test(toast) && (await dp.evaluate(() => DeckKit.index)) === 1, toast.slice(0, 90));
    // X: export / deploy commands carry the deck's path.
    await dp.keyboard.press('x'); await sleep(200);
    const cmds = await dp.evaluate(() => [...document.querySelector('#deck-kit').shadowRoot.querySelectorAll('.dk-share code')].map((c) => c.textContent));
    ok('X builds export and deploy commands', /scripts\/export\.mjs" ".*deck-kit-demo\/index\.html" --pptx/.test(cmds[0]) && /deploy\.mjs" .* --to=vercel --name="deck-kit-demo"/.test(cmds[1]), cmds.join(' | ').slice(0, 120));
    await dp.keyboard.press('Escape');
    // Edit mode on the demo: one line changes; undo works.
    const rt = await editRoundTrip(dp, demo, 1);
    ok('edit mode saves only the edited tag', rt.ok && rt.added <= 2, JSON.stringify(rt));
    await dp.close();
  }

  // Media: controls added, nothing autoplays, leaving the slide stops and rewinds.
  {
    const mp = await openDeck(browser, demo, { width: 1280, height: 720 });
    const mi = await mp.evaluate(() => DeckKit.slides.findIndex((s) => s.id === 'media'));
    await mp.evaluate((i) => DeckKit.goTo(i), mi); await sleep(500);
    const before = await mp.evaluate((i) => { const s = DeckKit.slides[i]; const v = s.querySelector('video'), a = s.querySelector('audio'); return { controls: v.controls && a.controls, paused: v.paused && a.paused }; }, mi);
    ok('video/audio get controls and do not autoplay', before.controls && before.paused, JSON.stringify(before));
    await mp.evaluate((i) => DeckKit.slides[i].querySelector('video').play(), mi);
    await sleep(700);
    const playing = await mp.evaluate((i) => { const v = DeckKit.slides[i].querySelector('video'); return !v.paused && v.currentTime > 0; }, mi);
    await mp.evaluate((i) => DeckKit.goTo(i + 1), mi); await sleep(400);
    const after = await mp.evaluate((i) => { const v = DeckKit.slides[i].querySelector('video'); return { paused: v.paused, t: v.currentTime }; }, mi);
    ok('leaving the slide stops and rewinds media', playing && after.paused && after.t === 0, JSON.stringify(after));
    await mp.close();
    // A YouTube iframe gets the player API (so it can be paused) and loses autoplay.
    const ytDir = mkdtempSync(join(tmpdir(), 'yt-'));
    const ytFile = join(ytDir, 'index.html');
    writeFileSync(ytFile, `<!doctype html><html><body><div class="slide active"><h1>A</h1><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"></iframe></div><div class="slide"><h1>B</h1></div>
<script>window.deckAdapter = { go() {}, index() { return 0; } };</script><script src="${resolve(root, 'runtime/deck-kit.js')}"></script></body></html>`);
    const yp = await openDeck(browser, ytFile, { width: 1000, height: 600 });
    const src = await yp.evaluate(() => document.querySelector('iframe').getAttribute('src'));
    await yp.close();
    rmSync(ytDir, { recursive: true, force: true });
    ok('YouTube embeds get enablejsapi and lose autoplay', /\?enablejsapi=1&playsinline=1$/.test(src) && !/autoplay/.test(src), src);
  }

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

    // Speaker notes: edit in the presenter, mirrored to the audience, saved into the file.
    await page.evaluate(() => DeckKit.goTo(1));
    await sleep(800);
    await pv.evaluate(() => {
      const k = document.querySelector('#deck-kit').shadowRoot;
      k.querySelector('[data-n="edit"]').click();
      const box = k.querySelector('.dk-pnotes .dk-tx');
      box.innerHTML = 'Edited note: ask the room first.';
      box.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(800);
    ok('edited note reaches the audience deck', /Edited note/.test(await page.evaluate(() => DeckKit.notesOf(1))));
    ok('edit kept as a draft', await page.evaluate(() => /Edited note/.test(localStorage.getItem('deck-kit-notes:' + location.pathname) || '')));
    const source = readFileSync(demo, 'utf8');
    const saved = await pv.evaluate(async (src) => {
      let written = null;
      window.showOpenFilePicker = async () => [{
        name: 'index.html',
        queryPermission: async () => 'granted',
        getFile: async () => ({ text: async () => src }),
        createWritable: async () => ({ write: async (t) => { written = t; }, close: async () => {} }),
      }];
      document.querySelector('#deck-kit').shadowRoot.querySelector('[data-n="save"]').click();
      for (let k = 0; k < 40 && written === null; k++) await new Promise((r) => setTimeout(r, 50));
      return written;
    }, source);
    ok('Save writes the notes into the HTML source', saved && /Edited note: ask the room first\./.test(saved) && (saved.match(/<section/g) || []).length === (source.match(/<section/g) || []).length);
    ok('saved file has no runtime state', saved && !/deck-kit-style|dk-print|data-deck-active|data-screen-label|id="deck-kit"/.test(saved));
    ok('draft cleared after save', await page.evaluate(() => !localStorage.getItem('deck-kit-notes:' + location.pathname)));
    await pv.close();
  }

  // apply-notes.mjs merges a notes.json into a copy of the deck.
  {
    const copy = join(dirname(demo), '.notes-test.html');
    const json = join(out, 'notes.json');
    writeFileSync(copy, readFileSync(demo, 'utf8'));
    writeFileSync(json, JSON.stringify({ deck: 'index.html', notes: { 0: 'Merged from <b>notes.json</b>', 6: 'Closing words.' } }));
    let merged = '';
    try {
      execSync(`node "${resolve(root, 'scripts/apply-notes.mjs')}" "${copy}" "${json}"`, { stdio: 'pipe' });
      const chk = await openDeck(browser, copy, { width: 1200, height: 700 });
      merged = await chk.evaluate(() => DeckKit.notesOf(0) + ' | ' + DeckKit.notesOf(6) + ' | ' + DeckKit.length);
      await chk.close();
    } catch (e) { merged = 'error ' + e.message; }
    rmSync(copy, { force: true });
    ok('apply-notes.mjs merges notes.json', /Merged from <b>notes\.json<\/b> \| Closing words\. \| \d+$/.test(merged), merged);
  }

  // Print: canvases on never-visited slides are drawn and kept.
  const fresh = await openDeck(browser, demo, { width: 1600, height: 900 });
  await fresh.evaluate(() => DeckKit.preparePrint());
  ok('print snapshots every canvas', await fresh.evaluate(() => document.querySelectorAll('img.dk-print-img').length === document.querySelectorAll('section canvas').length));
  await fresh.evaluate(() => DeckKit.cleanupPrint());
  ok('no console errors', !page._errors.length && !fresh._errors.length, [...page._errors, ...fresh._errors].join(' | '));
  await page.close(); await fresh.close();
}

// ── Features: steps, maths, code, quiz, charts, stepper, compare, hotspots, QR, zoom ──
if (!only || only === 'features') {
  const deck = resolve(root, 'examples/features/index.html');
  const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log(`${cond ? 'ok  ' : 'FAIL'} features: ${name} ${extra}`); };
  const page = await openDeck(browser, deck, { width: 1600, height: 900 });
  await page.evaluate(() => DeckKit.settle(0, { min: 200 }));
  const at = (id) => page.evaluate((id) => DeckKit.slides.findIndex((s) => s.id === id), id);
  const go = async (i) => { await page.evaluate((i) => DeckKit.goTo(i), i); await page.waitForFunction((i) => DeckKit.index === i, { timeout: 5000 }, i).catch(() => {}); await page.evaluate((i) => DeckKit.settle(i, { min: 250 }), i); };
  const steps = () => page.evaluate(() => ({ i: DeckKit.index, n: DeckKit.steps.n, total: DeckKit.steps.total, off: DeckKit.slides[DeckKit.index].querySelectorAll('.dk-step-off').length }));

  // Steps: → reveals, then moves on; ← back into a slide shows every step.
  let st = await steps();
  ok('slide starts with its steps hidden', st.i === 0 && st.n === 0 && st.total === 4 && st.off === 5, JSON.stringify(st));
  await page.keyboard.press('ArrowRight'); await sleep(150);
  st = await steps();
  ok('→ reveals the first step without changing slide', st.i === 0 && st.n === 1 && st.off === 4, JSON.stringify(st));
  for (let k = 0; k < 3; k++) { await page.keyboard.press('ArrowRight'); await sleep(120); }
  st = await steps();
  ok('steps with the same number appear together', st.n === 4 && st.off === 0, JSON.stringify(st));
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => DeckKit.index === 1, { timeout: 4000 }).catch(() => {});
  ok('→ after the last step goes to the next slide', (await steps()).i === 1);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => DeckKit.index === 0, { timeout: 4000 }).catch(() => {});
  await sleep(200);
  st = await steps();
  ok('← into a slide shows all its steps', st.i === 0 && st.n === 4 && st.off === 0, JSON.stringify(st));
  await page.keyboard.press('ArrowLeft'); await sleep(150);
  ok('← hides the last step', (await steps()).n === 3);

  // Maths: rendered, prices left alone, source kept for saving.
  const mi = await at('maths');
  await go(mi);
  const math = await page.evaluate((i) => {
    const s = DeckKit.slides[i];
    const ps = s.querySelectorAll('p');
    return { katex: s.querySelectorAll('.katex').length, display: s.querySelectorAll('.katex-display').length, prices: ps[1].querySelectorAll('.dk-math').length, src: DeckKit.sourceHtml(ps[0]), title: DeckKit.titleOf(i) };
  }, mi);
  ok('maths rendered with KaTeX (inline + display)', math.katex >= 2 && math.display === 1, JSON.stringify(math).slice(0, 120));
  ok('prices like $5 and $10 stay text', math.prices === 0);
  ok('source of a maths paragraph is what the author wrote', /\$p\(x \\mid z\) \\propto p\(z \\mid x\)\\,p\(x\)\$/.test(math.src) && !/katex|dk-/.test(math.src));

  // Edit mode on a maths paragraph saves the TeX source, never the rendering.
  {
    const src = readFileSync(deck, 'utf8');
    await page.evaluate((src) => {
      window.__written = null;
      window.showOpenFilePicker = async () => [{ name: 'index.html', queryPermission: async () => 'granted',
        getFile: async () => ({ text: async () => src, lastModified: 0 }), createWritable: async () => ({ write: async (t) => { window.__written = t; }, close: async () => {} }) }];
    }, src);
    const box = await page.evaluate((i) => { const r = DeckKit.slides[i].querySelector('.katex').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, mi);
    await page.keyboard.press('e');
    await page.mouse.click(box.x, box.y);
    await page.mouse.click(box.x, box.y, { clickCount: 2 });
    await sleep(100);
    await page.keyboard.press('End');
    await page.keyboard.type(' QA');
    await page.keyboard.press('Escape');
    const rerendered = await page.evaluate((i) => DeckKit.slides[i].querySelectorAll('p')[0].querySelectorAll('.dk-math').length, mi);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__written !== null, { timeout: 4000 }).catch(() => {});
    const out = (await page.evaluate(() => window.__written)) || '';
    const a = new Set(src.split('\n'));
    const changed = out.split('\n').filter((l) => !a.has(l));
    ok('typing into maths edits the TeX and saves only that line', changed.length === 1 && /\$p\(x \\mid z\)[^\n]*QA/.test(changed[0]) && !/katex|dk-|data-dk/.test(out), changed.join(' | ').slice(0, 160));
    ok('maths re-renders after typing', rerendered >= 1);
  }

  // Code: highlighted, line steps, copy button, source stays plain.
  const ci = await at('code');
  await go(ci);
  const code = await page.evaluate((i) => {
    const s = DeckKit.slides[i], pre = s.querySelector('pre');
    return { kw: pre.querySelectorAll('.dk-tk-kw').length, com: pre.querySelectorAll('.dk-tk-com').length, lines: pre.querySelectorAll('.dk-ln').length, copy: !!pre.querySelector('.dk-copy'), total: DeckKit.steps.total, src: DeckKit.sourceHtml(pre) };
  }, ci);
  ok('code highlighted in template colours', code.kw >= 2 && code.com >= 2 && code.lines === 6, JSON.stringify(code).slice(0, 100));
  ok('code has a copy button and its source stays plain', code.copy && !/<span|dk-|Copy/.test(code.src) && /def kalman_step/.test(code.src));
  ok('data-lines segments are steps', code.total === 3);
  await page.keyboard.press('ArrowRight'); await sleep(100);
  const dim1 = await page.evaluate((i) => Array.from(DeckKit.slides[i].querySelectorAll('.dk-ln'), (l) => l.classList.contains('dk-dim') ? 0 : 1).join(''), ci);
  await page.keyboard.press('ArrowRight'); await sleep(100);
  const dim2 = await page.evaluate((i) => Array.from(DeckKit.slides[i].querySelectorAll('.dk-ln'), (l) => l.classList.contains('dk-dim') ? 0 : 1).join(''), ci);
  ok('→ highlights lines 1-2, then line 4', dim1 === '110000' && dim2 === '000100', `${dim1} ${dim2}`);

  // Quiz.
  const qi = await at('quiz');
  await go(qi);
  await page.evaluate((i) => DeckKit.slides[i].querySelectorAll('[data-option]')[0].click(), qi);
  const quiz = await page.evaluate((i) => {
    const s = DeckKit.slides[i], o = s.querySelectorAll('[data-option]');
    return { wrong: o[0].classList.contains('dk-wrong'), right: o[2].classList.contains('dk-right'), explain: s.querySelector('[data-explain]').offsetHeight > 0, idx: DeckKit.index };
  }, qi);
  ok('quiz marks the choice and the right answer, shows the explanation', quiz.wrong && quiz.right && quiz.explain && quiz.idx === qi, JSON.stringify(quiz));
  await go(qi + 1); await go(qi);
  ok('quiz clears when the slide is left', await page.evaluate((i) => !DeckKit.slides[i].querySelector('.dk-answered, .dk-wrong'), qi));

  // Charts: drawn pixels on the JSON canvas and the table chart.
  const chi = await at('charts');
  await go(chi);
  const charts = await page.evaluate((i) => {
    const s = DeckKit.slides[i];
    const ink = (cv) => { if (!cv || !cv.width) return 0; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let k = 3; k < d.length; k += 16) if (d[k] > 0) n++; return n; };
    const t = s.querySelector('table');
    return { bar: ink(s.querySelector('canvas[data-chart]')), line: ink(s.querySelector('.dk-chart-box canvas')), tableHidden: t.getBoundingClientRect().width <= 1 };
  }, chi);
  ok('bar chart from data-chart JSON is drawn', charts.bar > 500, `${charts.bar}`);
  ok('line chart from a table is drawn, table hidden', charts.line > 200 && charts.tableHidden, JSON.stringify(charts));

  // Stepper: declarative frames and a JS simulation.
  const si = await at('stepper');
  await go(si);
  const frames = () => page.evaluate((i) => Array.from(DeckKit.slides[i].querySelectorAll('[data-frame]'), (f) => (f.classList.contains('dk-frame-off') ? 0 : 1)).join(''), si);
  ok('frames: only the first is shown', (await frames()) === '1000');
  await page.evaluate((i) => DeckKit.slides[i].querySelector('[data-stepper] .dk-stepper [data-s="next"]').click(), si);
  ok('⏭ shows the next frame', (await frames()) === '0100');
  await page.evaluate((i) => DeckKit.slides[i].querySelector('#walk + .dk-stepper [data-s="play"]').click(), si);
  await sleep(700);
  const n1 = await page.evaluate((i) => DeckKit.slides[i].querySelector('#walk + .dk-stepper .dk-stepper-n').textContent, si);
  ok('▶ plays the simulation', /^([1-9]\d*) \/ 60$/.test(n1), n1);
  await go(si + 1);
  const n2 = await page.evaluate((i) => DeckKit.slides[i].querySelector('#walk + .dk-stepper .dk-stepper-n').textContent, si);
  await sleep(500);
  const n3 = await page.evaluate((i) => DeckKit.slides[i].querySelector('#walk + .dk-stepper .dk-stepper-n').textContent, si);
  ok('leaving the slide pauses it', n2 === n3, `${n2} ${n3}`);

  // Before / after.
  const cmi = await at('compare');
  await go(cmi);
  const cmp = await page.evaluate((i) => {
    const box = DeckKit.slides[i].querySelector('[data-compare]'), r = box.querySelector('input[type=range]');
    const before = box.style.getPropertyValue('--dk-cmp');
    r.value = '80'; r.dispatchEvent(new Event('input', { bubbles: true }));
    return { before, after: box.style.getPropertyValue('--dk-cmp'), labels: box.querySelectorAll('.dk-cmp-label').length, src: DeckKit.sourceHtml(box.parentElement) };
  }, cmi);
  ok('compare slider starts at data-compare and follows the input', cmp.before === '35%' && cmp.after === '80%' && cmp.labels === 2, JSON.stringify(cmp).slice(0, 90));
  ok('compare source has no generated parts', !/dk-|type="range"|--dk/.test(cmp.src));

  // Hotspots.
  const hi = await at('hotspots');
  await go(hi);
  const hs = await page.evaluate(async (i) => {
    const s = DeckKit.slides[i], d = s.querySelectorAll('.dk-hs-dot'), t = s.querySelectorAll('[data-hotspot]');
    d[1].click();
    const one = [...t].map((x) => (x.classList.contains('dk-open') ? 1 : 0)).join('');
    await new Promise((r) => setTimeout(r, 300));
    const vis = getComputedStyle(t[1]).visibility;
    d[2].click();
    const two = [...t].map((x) => (x.classList.contains('dk-open') ? 1 : 0)).join('');
    return { dots: d.length, one, two, vis, idx: DeckKit.index };
  }, hi);
  ok('hotspot dots open one bubble at a time', hs.dots === 3 && hs.one === '010' && hs.two === '001' && hs.vis === 'visible' && hs.idx === hi, JSON.stringify(hs));

  // QR.
  const qri = await at('qr');
  await go(qri);
  const qr = await page.evaluate((i) => { const p = DeckKit.slides[i].querySelector('svg.dk-qr path'); return p ? p.getAttribute('d').length : 0; }, qri);
  ok('QR code drawn as SVG', qr > 500, `${qr}`);

  // Zoom.
  const zi = await at('zoom');
  await go(zi);
  const zr = await page.evaluate((i) => { const r = DeckKit.slides[i].querySelector('.tiny').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, zi);
  await page.keyboard.press('z');
  await page.mouse.move(zr.x, zr.y - 10); await page.mouse.down(); await page.mouse.move(zr.x + zr.w / 2, zr.y + zr.h + 10, { steps: 5 }); await page.mouse.up();
  await sleep(600);
  const zoomed = await page.evaluate((i) => +DeckKit.slides[i].style.scale || 1, zi);
  await page.keyboard.press('Escape');
  await sleep(700);
  const unz = await page.evaluate((i) => ({ scale: DeckKit.slides[i].style.scale, origin: DeckKit.slides[i].style.transformOrigin }), zi);
  ok('Z + drag zooms into the box, Esc zooms out', zoomed > 1.5 && !unz.scale && !unz.origin, `${zoomed} ${JSON.stringify(unz)}`);

  // Print and exports show every step; the live state comes back afterwards.
  await go(0);
  const pr = await page.evaluate(() => {
    DeckKit.preparePrint();
    const during = document.querySelectorAll('.dk-step-off, .dk-ln.dk-dim').length;
    DeckKit.cleanupPrint();
    return { during, after: DeckKit.slides[0].querySelectorAll('.dk-step-off').length };
  });
  ok('print shows every step, then restores', pr.during === 0 && pr.after === 5, JSON.stringify(pr));
  ok('no page errors', !page._errors.length, page._errors.join(' | ').slice(0, 200));

  // Presenter view: → reveals steps on the audience screen; quiz answers sync.
  await page.evaluate(() => { localStorage.clear(); });
  const popup = browser.waitForTarget((t) => t.url().includes('dk=presenter'), { timeout: 8000 }).catch(() => null);
  await page.keyboard.press('p');
  const pv = await (await popup)?.page();
  if (pv) {
    await pv.waitForFunction(() => window.DeckKit && document.querySelector('#deck-kit'), { timeout: 10000 });
    await sleep(1500);
    await pv.keyboard.press('ArrowRight');
    await sleep(600);
    const a = await page.evaluate(() => ({ i: DeckKit.index, n: DeckKit.steps.n }));
    const pos = await pv.evaluate(() => document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-pos').textContent);
    ok('→ in the presenter reveals a step on the audience screen', a.i === 0 && a.n === 1 && /1\/4/.test(pos), `${JSON.stringify(a)} "${pos}"`);
    await page.evaluate((i) => DeckKit.goTo(i), qi);
    await sleep(1500);
    let f = null;
    for (const fr of pv.frames()) { try { if (fr.url().includes('dk=mirror') && (await fr.evaluate(() => DeckKit.index)) === qi && !f) f = fr; } catch {} }
    if (f) await f.evaluate((i) => DeckKit.slides[i].querySelectorAll('[data-option]')[2].click(), qi);
    await sleep(600);
    ok('quiz answered in the preview shows on the audience screen', await page.evaluate((i) => DeckKit.slides[i].querySelectorAll('[data-option]')[2].classList.contains('dk-right'), qi));
    await pv.close();
  } else ok('presenter opens', false);
  await page.close();

  // Markdown: maths kept intact, code steps, chart, quiz, steps.
  {
    const dir = mkdtempSync(join(tmpdir(), 'deck-mdf-'));
    writeFileSync(join(dir, 'f.md'), [
      '# Features', 'sub', '', '---', '<!-- steps: true -->', '## Steps and maths', '- one $a_1 + b_2$ and *em*', '- two costs $5 and $10', '',
      '---', '## Code', '```python {1|2}', 'x = 1', 'y = 2', '```', '',
      '---', '## Chart', '```chart', '{"type":"bar","labels":["a","b"],"data":[1,2]}', '```', '',
      '---', '## Quiz', '- [ ] no', '- [x] yes', '- [ ] maybe', '',
    ].join('\n'));
    let html = '';
    try { execSync(`node "${resolve(root, 'scripts/md-to-deck.mjs')}" "${join(dir, 'f.md')}" --theme=vellum --out="${join(dir, 'deck')}"`); html = readFileSync(join(dir, 'deck/index.html'), 'utf8'); } catch (e) { html = String(e.message); }
    ok('md-to-deck: maths untouched by emphasis', /\$a_1 \+ b_2\$/.test(html) && /<em>em<\/em>/.test(html));
    ok('md-to-deck: steps, code lines, chart, quiz', /<ul data-steps>/.test(html) && /<pre class="code" data-lines="1\|2"><code class="language-python">/.test(html) &&
      /<canvas class="chart" data-chart="\{&quot;type&quot;:&quot;bar&quot;/.test(html) && /<ul class="quiz" data-quiz><li data-option>no<\/li><li data-option data-correct>yes<\/li>/.test(html));
    const mp = await openDeck(browser, join(dir, 'deck/index.html'), { width: 1600, height: 900 });
    await mp.evaluate(() => DeckKit.goTo(1)); await sleep(600);
    await mp.evaluate(() => DeckKit.settle(1, { min: 200 }));
    const md = await mp.evaluate(() => ({ katex: DeckKit.slides[1].querySelectorAll('.katex').length, total: DeckKit.steps.total, errors: 0 }));
    ok('md deck renders maths and counts list steps', md.katex === 1 && md.total === 2, JSON.stringify(md));
    ok('md deck: no page errors', !mp._errors.length, mp._errors.join(' | ').slice(0, 200));
    await mp.close();
    rmSync(dir, { recursive: true, force: true });
  }

  // Offline bundle: KaTeX and the QR library embedded, nothing fetched.
  {
    const dir = mkdtempSync(join(tmpdir(), 'deck-bundle-'));
    const outFile = join(dir, 'features.html');
    let log = '';
    try { log = execSync(`node "${resolve(root, 'scripts/bundle.mjs')}" "${deck}" "${outFile}"`, { encoding: 'utf8' }); } catch (e) { log = String(e.stdout || e.message); }
    const html = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
    ok('bundle embeds KaTeX (with fonts) and the QR library', /data-dk-lib="katex"/.test(html) && /data-dk-lib="qr"/.test(html) && /font-family:KaTeX_Main[^}]*base64/.test(html), log.split('\n')[0].slice(0, 120));
    const bp = await browser.newPage();
    await bp.setViewport({ width: 1600, height: 900 });
    await bp.setRequestInterception(true);
    let remote = 0;
    bp.on('request', (r) => { if (/^https?:/.test(r.url())) { remote += /katex|qrcode/.test(r.url()) ? 1 : 0; r.abort(); } else r.continue(); });
    await bp.goto(fileUrl(outFile), { waitUntil: 'load' });
    await bp.waitForFunction(() => window.DeckKit && DeckKit.length > 0, { timeout: 15000 });
    await sleep(800);
    const off = await bp.evaluate(() => ({ katex: document.querySelectorAll('.katex').length, qr: !!document.querySelector('svg.dk-qr') }));
    ok('bundled deck renders maths and QR offline', off.katex >= 2 && off.qr && remote === 0, JSON.stringify(off) + ` remote=${remote}`);
    await bp.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

// ── Tools: PowerPoint import, deploy dry run ───────────────────────────────
if (!only || only === 'tools') {
  const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log(`${cond ? 'ok  ' : 'FAIL'} tools: ${name} ${extra}`); };
  const imp = join(out, 'pptx-import');
  let log = '';
  try { log = execSync(`node "${resolve(root, 'scripts/pptx-to-deck.mjs')}" "${resolve(root, 'tests/fixtures/sample.pptx')}" --theme=vellum --out="${imp}"`, { encoding: 'utf8' }); } catch (e) { log = String(e.stdout || e.message); }
  const md = (() => { try { return readFileSync(join(imp, 'source/talk.md'), 'utf8'); } catch { return ''; } })();
  ok('pptx import: 6 slides, hidden one skipped', /Imported 6 slides/.test(log), log.split('\n')[0]);
  ok('pptx import: bullets, levels, table, picture, notes, columns',
    /\n  - GPS jumps/.test(md) && /\| KF \| no \| low \|/.test(md) && /!\[[^\]]*\]\(media\//.test(md) && /Note: Welcome everyone/.test(md) && /\n\|\|\|\n/.test(md));
  if (md) {
    const pg = await openDeck(browser, join(imp, 'index.html'), { width: 1280, height: 720 });
    ok('imported deck boots with notes', (await pg.evaluate(() => DeckKit.length)) === 6 && /GPS story/.test(await pg.evaluate(() => DeckKit.notesOf(0))));
    await pg.close();
  }
  // Markdown media: video / audio players and YouTube embeds.
  {
    const dir = mkdtempSync(join(tmpdir(), 'md-media-'));
    writeFileSync(join(dir, 'talk.md'), '---\ntitle: Media\n---\n# Media\n\n---\n## Clip\n![a clip](clip.mp4)\n\n---\n## Sound\n![a tone](tone.mp3)\n\n---\n## Talk\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42\n');
    ['clip.mp4', 'tone.mp3'].forEach((f) => writeFileSync(join(dir, f), readFileSync(resolve(root, 'tests/fixtures', f))));
    let html = '';
    try { execSync(`node "${resolve(root, 'scripts/md-to-deck.mjs')}" "${join(dir, 'talk.md')}" --theme=vellum --out="${join(dir, 'deck')}"`); html = readFileSync(join(dir, 'deck/index.html'), 'utf8'); } catch (e) { html = String(e.message); }
    ok('md-to-deck: video, audio and YouTube embeds', /<video src="assets\/\d+-clip\.mp4" controls/.test(html) && /<audio src="assets\/\d+-tone\.mp3" controls/.test(html) && /youtube\.com\/embed\/dQw4w9WgXcQ\?rel=0&start=42/.test(html));
    // Deploy keeps media as separate files and refuses files over a host's limit.
    writeFileSync(join(dir, 'deck', 'big.mp4'), Buffer.alloc(26 * 1048576));
    writeFileSync(join(dir, 'deck', 'index.html'), html.replace('</deck-stage>', '<section class="slide"><video src="big.mp4"></video></section></deck-stage>'));
    let dep = '';
    try { dep = execSync(`node "${resolve(root, 'scripts/deploy.mjs')}" "${join(dir, 'deck/index.html')}" --to=cloudflare --dry-run`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { dep = String(e.stdout) + String(e.stderr); }
    ok('deploy stops on files over the host limit (Cloudflare 25 MiB)', /Too big for cloudflare: media\/big\.mp4/.test(dep), dep.split('\n').find((l) => /Too big|Published|Dry run/.test(l)) || '');
    rmSync(dir, { recursive: true, force: true });
  }
  // A deployed copy: no notes, no edit / export tools.
  {
    let built = '';
    try { built = execSync(`node "${resolve(root, 'scripts/deploy.mjs')}" "${resolve(root, 'examples/deck-kit-demo/index.html')}" --to=vercel --dry-run`, { encoding: 'utf8' }); } catch (e) { built = String(e.stdout); }
    const file = (built.match(/Built file: (\S+)/) || [])[1];
    if (file) {
      const pub = await openDeck(browser, file, { width: 1280, height: 720 });
      await pub.keyboard.press('x'); await pub.keyboard.press('e'); await sleep(200);
      const st = await pub.evaluate(() => { const k = document.querySelector('#deck-kit').shadowRoot; const help = k.querySelector('.dk-help').textContent; return { share: k.querySelector('.dk-share').classList.contains('dk-show'), edit: DeckKit.edit.on, notes: DeckKit.slides.some((s, i) => DeckKit.notesOf(i)), helpHasPrint: /Ctrl\+P/.test(help), helpHasEdit: /Edit mode/.test(help) }; });
      ok('published copy: no notes; E, K, X off and out of the ? list; Ctrl+P listed', !st.share && !st.edit && !st.notes && st.helpHasPrint && !st.helpHasEdit, JSON.stringify(st));
      await pub.close();
    } else ok('published copy built', false, built.slice(0, 120));
  }
  // Saving refuses a file that changed after the page loaded it.
  {
    const demoFile = resolve(root, 'examples/deck-kit-demo/index.html');
    const sp = await openDeck(browser, demoFile, { width: 1280, height: 720 });
    await sp.evaluate((src) => {
      window.__written = null;
      window.showOpenFilePicker = async () => [{ name: 'index.html', queryPermission: async () => 'granted',
        getFile: async () => ({ lastModified: Date.now() + 60000, text: async () => src }), createWritable: async () => ({ write: async (t) => { window.__written = t; }, close: async () => {} }) }];
    }, readFileSync(demoFile, 'utf8'));
    await sp.evaluate(() => DeckKit.goTo(1)); await sleep(500);
    const h = await sp.evaluate(() => { const r = DeckKit.slides[1].querySelector('h2').getBoundingClientRect(); return { x: r.left + 15, y: r.top + r.height / 2 }; });
    await sp.keyboard.press('e'); await sp.mouse.move(h.x, h.y); await sp.mouse.down(); await sp.mouse.move(h.x + 30, h.y, { steps: 3 }); await sp.mouse.up();
    await sp.keyboard.press('e'); await sleep(600);
    const st = await sp.evaluate(() => ({ written: window.__written, toast: document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-toast').textContent }));
    ok('save refuses a file changed on disk since opening', st.written === null && /changed on disk/.test(st.toast), st.toast.slice(0, 60));
    await sp.evaluate(() => localStorage.clear());
    await sp.close();
  }
  // Elements a template creates at runtime are skipped (reported), the rest is saved.
  {
    const f = resolve(root, 'templates/8-bit-orbit/template.html');
    const src = readFileSync(f, 'utf8');
    const pg = await openDeck(browser, f, { width: 1280, height: 720 });
    await pg.evaluate((src) => {
      window.__written = null;
      window.showOpenFilePicker = async () => [{ name: 'template.html', queryPermission: async () => 'granted',
        getFile: async () => ({ text: async () => src }), createWritable: async () => ({ write: async (t) => { window.__written = t; }, close: async () => {} }) }];
    }, src);
    // One element that exists in the file (a heading) and one made at runtime.
    const out = await pg.evaluate((src) => {
      const s = DeckKit.slides[0];
      const made = document.createElement('div');
      made.className = 'made-by-script';
      made.textContent = 'runtime';
      s.appendChild(made);
      const h = s.querySelector('h1, h2');
      const pathOf = (n) => { const p = []; for (let e = n; e && e !== s; e = e.parentElement) p.unshift([...e.parentElement.children].indexOf(e)); return p; };
      const edits = [made, h].map((e) => ({ slide: 0, path: pathOf(e), tag: e.tagName.toLowerCase(), text: e.textContent, style: { translate: '5px 5px' } }));
      return DeckKit.patchEditsReport(src, edits);
    }, src);
    const res = { star: true, h: true };
    ok('runtime-made elements are skipped, the rest saved', res.star && res.h && out.skipped.length === 1 && /translate: 5px 5px/.test(out.out), `skipped ${out.skipped.length}`);
    await pg.close();
  }
  let dry = '';
  try { dry = execSync(`node "${resolve(root, 'scripts/deploy.mjs')}" "${resolve(root, 'examples/deck-kit-demo/index.html')}" --to=cloudflare --name="Bộ lọc demo" --preview --dry-run`, { encoding: 'utf8' }); } catch (e) { dry = String(e.stdout || e.message); }
  // Overwrite guard, exercised with a fake npx (nothing reaches Cloudflare).
  {
    const tmp = mkdtempSync(join(tmpdir(), 'deck-guard-'));
    mkdirSync(join(tmp, 'bin')); mkdirSync(join(tmp, 'cfg', 'deck-kit'), { recursive: true });
    writeFileSync(join(tmp, 'bin', 'npx'), '#!/bin/sh\necho "[fake npx] $*" >&2\nexit 0\n', { mode: 0o755 });
    writeFileSync(join(tmp, 'cfg', 'deck-kit', 'deployments.json'), JSON.stringify({ 'cloudflare:deck-kit-demo': { id: '0000000000000000', deck: '/elsewhere/index.html', at: '2026-01-01' } }));
    const env = { ...process.env, PATH: `${join(tmp, 'bin')}:${process.env.PATH}`, XDG_CONFIG_HOME: join(tmp, 'cfg') };
    const cmd = `node "${resolve(root, 'scripts/deploy.mjs')}" "${resolve(root, 'examples/deck-kit-demo/index.html')}" --to=cloudflare`;
    let stopped = false;
    try { execSync(cmd, { env, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { stopped = e.status === 2 && /already holds a different deck/.test(String(e.stdout)); }
    ok('deploy refuses to overwrite a different deck without a terminal', stopped);
    let forced = '';
    try { forced = execSync(cmd + ' --force', { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { forced = String(e.stdout); }
    const reg = JSON.parse(readFileSync(join(tmp, 'cfg', 'deck-kit', 'deployments.json'), 'utf8'));
    ok('--force replaces it and remembers the new deck', /Published/.test(forced) && /deck-kit-demo\/index\.html$/.test(reg['cloudflare:deck-kit-demo'].deck));
    rmSync(tmp, { recursive: true, force: true });
  }
  ok('deploy dry run builds one file and names the project', /--project-name=bo-loc-demo --branch=preview/.test(dry) && /nothing was published/.test(dry));
}

await browser.close();
console.log(failed ? `\n${failed} failure(s). Output: ${out}` : `\nAll passed. Output: ${out}`);
process.exit(failed ? 1 : 0);
