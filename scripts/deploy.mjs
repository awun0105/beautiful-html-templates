#!/usr/bin/env node
/**
 * deploy.mjs — publish a deck to a shareable URL. Each deck gets its own link.
 *
 *   node scripts/deploy.mjs path/to/deck.html --to=vercel|cloudflare|github [options]
 *
 *   --name=kalman        link / project name (default: the deck's folder name)
 *   --preview            don't touch the main link; publish a separate preview
 *   --repo=owner/slides  GitHub Pages only: repo that holds all your decks
 *                        (default: <your-login>/slides, created public if missing)
 *   --dry-run            build and show the commands without publishing
 *   --force              publish even if the name belongs to a different deck
 *   --keep-notes         publish the speaker notes too (left out by default —
 *                        anyone with the link could read them)
 *
 * Overwrite guard: each deck has an id (a hash of its real file path — the
 * path itself is never published). The id is stamped into the published file
 * and remembered in ~/.config/deck-kit/deployments.json. Re-deploying the same
 * deck updates its link silently; if a DIFFERENT deck already uses that name
 * (seen locally, or in the live copy online), deploy asks before overwriting
 * (and refuses when there's no terminal to ask — use --name or --force).
 *
 * What goes online is ONE self-contained file built by bundle.mjs (scripts,
 * images and fonts inlined) — never the rest of the deck folder (CLAUDE.md,
 * drafts, source files).
 *
 *   vercel      https://<name>.vercel.app            (vercel login once)
 *               --preview → a unique preview URL; every deploy keeps its own URL,
 *               `npx vercel rollback` restores an older one
 *   cloudflare  https://<name>.pages.dev              (wrangler login once)
 *               --preview → https://preview.<name>.pages.dev
 *   github      https://<owner>.github.io/<repo>/<name>/   (uses the gh CLI)
 *               --preview → …/<name>-preview/ ; each deploy overwrites that folder
 */

import { mkdirSync, mkdtempSync, copyFileSync, existsSync, writeFileSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, join, basename, extname } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => {
  const [k, ...v] = a.slice(2).split('=');
  return [k, v.length ? v.join('=') : true];
}));
const input = args.find((a) => !a.startsWith('--'));
const to = String(opt.to || '').toLowerCase();
if (!input || !/^(vercel|cloudflare|github)$/.test(to)) {
  console.error('Usage: node scripts/deploy.mjs <deck.html> --to=vercel|cloudflare|github [--name=…] [--preview] [--repo=owner/slides] [--dry-run] [--force] [--keep-notes]');
  process.exit(1);
}
const deck = resolve(input);
if (!existsSync(deck)) { console.error(`Not found: ${deck}`); process.exit(1); }
const dry = !!opt['dry-run'];
const preview = !!opt.preview;

// Link name: --name, else the folder for index.html/template.html, else the file name.
const base = /^(index|template)\.html?$/i.test(basename(deck)) ? basename(dirname(deck)) : basename(deck, extname(deck));
const name = String(opt.name || base).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
  .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 52) || 'deck';

const isWin = process.platform === 'win32';
function run(cmd, cmdArgs, { capture = false, allowFail = false, cwd } = {}) {
  const shown = [cmd, ...cmdArgs].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ');
  if (dry) { console.log(`  $ ${shown}`); return { status: 0, stdout: '' }; }
  const r = spawnSync(cmd, cmdArgs, { cwd, shell: isWin, encoding: 'utf8', stdio: ['inherit', capture ? 'pipe' : 'inherit', 'inherit'] });
  if (r.status !== 0 && !allowFail) { console.error(`\nFailed: ${shown}`); process.exit(r.status || 1); }
  return r;
}
const quiet = (cmd, cmdArgs) => spawnSync(cmd, cmdArgs, { shell: isWin, encoding: 'utf8' });

// ── Overwrite guard ───────────────────────────────────────────────────────
const deckId = createHash('sha256').update(realpathSync(deck)).digest('hex').slice(0, 16);
const regFile = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'deck-kit', 'deployments.json');
const registry = (() => { try { return JSON.parse(readFileSync(regFile, 'utf8')); } catch { return {}; } })();
const idIn = (html) => ((html || '').match(/<meta name="deck-kit-id" content="([^"]+)"/) || [])[1] || null;
async function guard(key, liveHtml, where) {
  const local = registry[key];
  const remoteId = idIn(liveHtml);
  let other = null;
  if (local && local.id !== deckId) other = `${local.deck} (published ${String(local.at).slice(0, 10)})`;
  else if (remoteId && remoteId !== deckId) other = 'another deck (published from somewhere else)';
  if (!other) return;
  console.log(`\n⚠ "${where}" already holds a different deck:\n    ${other}\n  Publishing would replace it with:\n    ${deck}`);
  if (opt.force) { console.log('  --force given: replacing it.'); return; }
  if (dry) { console.log('  (dry run: a real deploy would stop here and ask)'); return; }
  if (!process.stdin.isTTY) {
    console.error(`\nStopped. Pick another name with --name=<new-name>, or add --force to replace it.`);
    process.exit(2);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ans = (await rl.question('  Overwrite it? [y/N] ')).trim().toLowerCase();
  rl.close();
  if (ans !== 'y' && ans !== 'yes') { console.log('Cancelled — nothing was published. Use --name=<new-name> for a separate link.'); process.exit(2); }
}
async function fetchLive(url) {
  if (dry && process.env.DECK_DEPLOY_OFFLINE) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000), redirect: 'follow' });
    return r.ok ? await r.text() : null;
  } catch { return null; }
}
function remember(key, url) {
  if (dry) return;
  registry[key] = { id: deckId, deck: realpathSync(deck), url, at: new Date().toISOString() };
  mkdirSync(dirname(regFile), { recursive: true });
  writeFileSync(regFile, JSON.stringify(registry, null, 2) + '\n');
}

// ── 1. Build one self-contained file ──────────────────────────────────────
const work = mkdtempSync(join(tmpdir(), 'deck-deploy-'));
const dist = join(work, name);            // folder name = project name for Vercel
mkdirSync(dist, { recursive: true });
console.log(`Building ${name} …`);
const b = spawnSync(process.execPath, [resolve(root, 'scripts/bundle.mjs'), deck, join(dist, 'index.html')], { encoding: 'utf8' });
if (b.status !== 0) { console.error(b.stderr || b.stdout); process.exit(1); }
console.log('  ' + b.stdout.trim().split('\n')[0]);
// Stamp the deck id (not its path) so a later deploy can recognise the live
// copy, mark it as published (deck-kit hides edit / export tools there), and
// leave the speaker notes out unless asked.
{
  const f = join(dist, 'index.html');
  let html = readFileSync(f, 'utf8');
  let stripped = 0;
  if (!opt['keep-notes']) {
    // Only touch markup: inlined scripts (deck-kit itself) contain "<aside class=notes>" in strings.
    html = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/i).map((part) => {
      if (/^<script\b[^>]*id=["']speaker-notes["']/i.test(part)) { stripped++; return part.replace(/(<script[^>]*>)[\s\S]*?(<\/script>)/i, '$1[]$2'); }
      if (/^<(script|style)\b/i.test(part)) return part;
      return part.replace(/[ \t]*<aside\b[^>]*\sclass\s*=\s*["'][^"']*\bnotes\b[^"']*["'][^>]*>[\s\S]*?<\/aside>[ \t]*\n?/gi, () => { stripped++; return ''; });
    }).join('');
  }
  html = html.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="deck-kit-id" content="${deckId}">\n<meta name="deck-kit-published" content="1">`);
  writeFileSync(f, html);
  console.log(opt['keep-notes'] ? '  Speaker notes included (--keep-notes).' : `  Speaker notes left out${stripped ? '' : ' (none found)'} — add --keep-notes to publish them.`);
}
if (/Still remote/.test(b.stdout)) console.log('  ' + b.stdout.trim().split('\n').slice(1).join('\n  '));

// ── 2. Publish ────────────────────────────────────────────────────────────
let url = '';
if (to === 'vercel') {
  if (!dry && quiet('npx', ['--yes', 'vercel', 'whoami']).status !== 0) {
    console.error('Not logged in to Vercel. Run `npx vercel login` once, then deploy again.');
    process.exit(1);
  }
  // Preview URLs are unique per deploy, so only the main link can be overwritten.
  if (!preview) await guard(`vercel:${name}`, await fetchLive(`https://${name}.vercel.app`), `https://${name}.vercel.app`);
  console.log(preview ? 'Deploying a preview to Vercel …' : 'Deploying to Vercel (production) …');
  const r = run('npx', ['--yes', 'vercel', 'deploy', dist, '--yes', ...(preview ? [] : ['--prod'])], { capture: true });
  url = (r.stdout.match(/https:\/\/\S+/g) || []).pop() || '';
  if (!preview) remember(`vercel:${name}`, url);
  if (!preview && url) url += `  (main link: https://${name}.vercel.app unless the name was taken)`;
}

if (to === 'cloudflare') {
  if (!dry && quiet('npx', ['--yes', 'wrangler', 'whoami']).status !== 0) {
    console.error('Not logged in to Cloudflare. Run `npx wrangler login` once, then deploy again.');
    process.exit(1);
  }
  const live = preview ? `https://preview.${name}.pages.dev` : `https://${name}.pages.dev`;
  await guard(`cloudflare:${name}${preview ? ':preview' : ''}`, await fetchLive(live), live);
  console.log('Deploying to Cloudflare Pages …');
  run('npx', ['--yes', 'wrangler', 'pages', 'project', 'create', name, '--production-branch=main'], { allowFail: true });
  const r = run('npx', ['--yes', 'wrangler', 'pages', 'deploy', dist, `--project-name=${name}`, `--branch=${preview ? 'preview' : 'main'}`, '--commit-dirty=true'], { capture: true });
  if (!dry) process.stdout.write(r.stdout);
  url = live;
  remember(`cloudflare:${name}${preview ? ':preview' : ''}`, url);
}

if (to === 'github') {
  const authed = quiet('gh', ['auth', 'status']).status === 0;
  if (!authed && !dry) { console.error('GitHub CLI is not logged in. Run `gh auth login` once.'); process.exit(1); }
  const login = authed ? quiet('gh', ['api', 'user', '-q', '.login']).stdout.trim() : '<your-login>';
  const repo = String(opt.repo || `${login}/slides`);
  const [owner, repoName] = repo.split('/');
  const folder = preview ? `${name}-preview` : name;
  const exists = authed && quiet('gh', ['repo', 'view', repo, '--json', 'name']).status === 0;
  if (!exists) {
    console.log(`Creating public repo ${repo} for your decks …`);
    run('gh', ['repo', 'create', repo, '--public', '--description', 'Slide decks published with beautiful-html-templates']);
  }
  const clone = join(work, 'repo');
  run('gh', ['repo', 'clone', repo, clone, '--', '--depth', '1'], { allowFail: !exists });
  const existing = join(clone, folder, 'index.html');
  await guard(`github:${repo}/${folder}`, existsSync(existing) ? readFileSync(existing, 'utf8') : null, `${repo}/${folder}`);
  if (!dry) {
    mkdirSync(join(clone, folder), { recursive: true });
    copyFileSync(join(dist, 'index.html'), join(clone, folder, 'index.html'));
    writeFileSync(join(clone, '.nojekyll'), '');
    // A plain list of the decks in this repo at the site root.
    const decks = readdirSync(clone, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.') && existsSync(join(clone, d.name, 'index.html'))).map((d) => d.name).sort();
    writeFileSync(join(clone, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Slides</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px}a{color:#2563EB}</style>
<h1>Slides</h1><ul>${decks.map((d) => `<li><a href="${d}/">${d}</a></li>`).join('')}</ul>\n`);
  }
  run('git', ['-C', clone, 'checkout', '-B', 'main']);
  run('git', ['-C', clone, 'add', '-A']);
  run('git', ['-C', clone, 'commit', '-m', `Deploy ${folder}`], { allowFail: true });
  run('git', ['-C', clone, 'push', '-u', 'origin', 'main']);
  // Turn Pages on (first time only; an "already enabled" error is fine).
  if (!dry) quiet('gh', ['api', `repos/${repo}/pages`, '-X', 'POST', '-f', 'source[branch]=main', '-f', 'source[path]=/']);
  else console.log(`  $ gh api repos/${repo}/pages -X POST -f source[branch]=main -f source[path]=/`);
  const site = repoName.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${owner.toLowerCase()}.github.io` : `https://${owner.toLowerCase()}.github.io/${repoName}`;
  url = `${site}/${folder}/`;
  remember(`github:${repo}/${folder}`, url);
  url += '  (GitHub Pages can take a minute to update)';
}

console.log(dry ? `\nDry run — nothing was published. Built file: ${join(dist, 'index.html')}` : `\nPublished: ${url}`);
