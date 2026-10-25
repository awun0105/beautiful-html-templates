#!/usr/bin/env node
/**
 * sync-runtime.mjs — copy the shared runtime into every template folder.
 *
 * Templates stay self-contained (a cloned folder must work on its own), so
 * each one carries copies of the runtime files. runtime/ is the only place to
 * edit them; this script pushes the edits out.
 *
 *   node scripts/sync-runtime.mjs           # copy
 *   node scripts/sync-runtime.mjs --check   # exit 1 if any copy has drifted (CI)
 *
 * Which deck-stage a template gets: the "rail" build (thumbnail column) when
 * its current copy is the rail build, otherwise the plain one.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const read = (p) => readFileSync(p, 'utf8');
const src = {
  kit: read(resolve(root, 'runtime/deck-kit.js')),
  stage: read(resolve(root, 'runtime/deck-stage.js')),
  rail: read(resolve(root, 'runtime/deck-stage-rail.js')),
};
const RAIL_MARK = '(g) thumbnail rail';

const drift = [];
let written = 0;
for (const slug of readdirSync(resolve(root, 'templates')).sort()) {
  const dir = resolve(root, 'templates', slug);
  const html = resolve(dir, 'template.html');
  if (!existsSync(html)) continue;
  const want = { 'deck-kit.js': src.kit };
  const stagePath = resolve(dir, 'deck-stage.js');
  if (existsSync(stagePath)) want['deck-stage.js'] = read(stagePath).includes(RAIL_MARK) ? src.rail : src.stage;
  if (!read(html).includes('src="deck-kit.js"')) drift.push(`${slug}/template.html does not load deck-kit.js`);
  for (const [name, content] of Object.entries(want)) {
    const p = resolve(dir, name);
    if (existsSync(p) && read(p) === content) continue;
    if (check) drift.push(`${slug}/${name}`);
    else { writeFileSync(p, content); written++; }
  }
}

if (check) {
  if (drift.length) {
    console.error('Runtime copies out of sync — run `node scripts/sync-runtime.mjs`:\n  ' + drift.join('\n  '));
    process.exit(1);
  }
  console.log('All template runtime copies match runtime/.');
} else {
  console.log(`Synced runtime into templates (${written} file${written === 1 ? '' : 's'} updated).`);
  if (drift.length) console.warn(drift.join('\n'));
}
