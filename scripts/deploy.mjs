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

import { mkdirSync, mkdtempSync, copyFileSync, existsSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join, basename, extname } from 'node:path';
import { tmpdir } from 'node:os';
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
  console.error('Usage: node scripts/deploy.mjs <deck.html> --to=vercel|cloudflare|github [--name=…] [--preview] [--repo=owner/slides] [--dry-run]');
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

// ── 1. Build one self-contained file ──────────────────────────────────────
const work = mkdtempSync(join(tmpdir(), 'deck-deploy-'));
const dist = join(work, name);            // folder name = project name for Vercel
mkdirSync(dist, { recursive: true });
console.log(`Building ${name} …`);
const b = spawnSync(process.execPath, [resolve(root, 'scripts/bundle.mjs'), deck, join(dist, 'index.html')], { encoding: 'utf8' });
if (b.status !== 0) { console.error(b.stderr || b.stdout); process.exit(1); }
console.log('  ' + b.stdout.trim().split('\n')[0]);
if (/Still remote/.test(b.stdout)) console.log('  ' + b.stdout.trim().split('\n').slice(1).join('\n  '));

// ── 2. Publish ────────────────────────────────────────────────────────────
let url = '';
if (to === 'vercel') {
  if (!dry && quiet('npx', ['--yes', 'vercel', 'whoami']).status !== 0) {
    console.error('Not logged in to Vercel. Run `npx vercel login` once, then deploy again.');
    process.exit(1);
  }
  console.log(preview ? 'Deploying a preview to Vercel …' : 'Deploying to Vercel (production) …');
  const r = run('npx', ['--yes', 'vercel', 'deploy', dist, '--yes', ...(preview ? [] : ['--prod'])], { capture: true });
  url = (r.stdout.match(/https:\/\/\S+/g) || []).pop() || '';
  if (!preview && url) url += `  (main link: https://${name}.vercel.app unless the name was taken)`;
}

if (to === 'cloudflare') {
  if (!dry && quiet('npx', ['--yes', 'wrangler', 'whoami']).status !== 0) {
    console.error('Not logged in to Cloudflare. Run `npx wrangler login` once, then deploy again.');
    process.exit(1);
  }
  console.log('Deploying to Cloudflare Pages …');
  run('npx', ['--yes', 'wrangler', 'pages', 'project', 'create', name, '--production-branch=main'], { allowFail: true });
  const r = run('npx', ['--yes', 'wrangler', 'pages', 'deploy', dist, `--project-name=${name}`, `--branch=${preview ? 'preview' : 'main'}`, '--commit-dirty=true'], { capture: true });
  if (!dry) process.stdout.write(r.stdout);
  url = preview ? `https://preview.${name}.pages.dev` : `https://${name}.pages.dev`;
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
  url = `${site}/${folder}/  (GitHub Pages can take a minute to update)`;
}

console.log(dry ? `\nDry run — nothing was published. Built file: ${join(dist, 'index.html')}` : `\nPublished: ${url}`);
