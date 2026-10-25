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

import { readdirSync, mkdirSync, writeFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
    ok('apply-notes.mjs merges notes.json', /Merged from <b>notes\.json<\/b> \| Closing words\. \| 7/.test(merged), merged);
  }

  // Print: canvases on never-visited slides are drawn and kept.
  const fresh = await openDeck(browser, demo, { width: 1600, height: 900 });
  await fresh.evaluate(() => DeckKit.preparePrint());
  ok('print snapshots every canvas', await fresh.evaluate(() => document.querySelectorAll('img.dk-print-img').length === document.querySelectorAll('section canvas').length));
  await fresh.evaluate(() => DeckKit.cleanupPrint());
  ok('no console errors', !page._errors.length && !fresh._errors.length, [...page._errors, ...fresh._errors].join(' | '));
  await page.close(); await fresh.close();
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
  // A deployed copy: no notes, no edit / export tools.
  {
    let built = '';
    try { built = execSync(`node "${resolve(root, 'scripts/deploy.mjs')}" "${resolve(root, 'examples/deck-kit-demo/index.html')}" --to=vercel --dry-run`, { encoding: 'utf8' }); } catch (e) { built = String(e.stdout); }
    const file = (built.match(/Built file: (\S+)/) || [])[1];
    if (file) {
      const pub = await openDeck(browser, file, { width: 1280, height: 720 });
      await pub.keyboard.press('x'); await pub.keyboard.press('e'); await sleep(200);
      const st = await pub.evaluate(() => ({ share: document.querySelector('#deck-kit').shadowRoot.querySelector('.dk-share').classList.contains('dk-show'), edit: DeckKit.edit.on, notes: DeckKit.slides.some((s, i) => DeckKit.notesOf(i)) }));
      ok('published copy: speaker notes left out, E and X disabled', !st.share && !st.edit && !st.notes, JSON.stringify(st));
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
