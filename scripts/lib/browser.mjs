/**
 * Shared headless-Chrome helpers for the scripts in this folder.
 * Uses puppeteer-core with the Chrome/Chromium already on the machine
 * (override with CHROME_PATH=/path/to/chrome).
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CANDIDATES = [
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/snap/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

export function findChrome() {
  const env = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (env) return env;
  const hit = CANDIDATES.find((p) => existsSync(p));
  if (!hit) throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH.');
  return hit;
}

export async function launch() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    throw new Error('puppeteer-core is missing. Run `npm install` in the repo root first.');
  }
  return puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox'] });
}

export const fileUrl = (p) => pathToFileURL(resolve(p)).href;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Open a deck and wait until deck-kit is up. Collects page errors in page._errors. */
export async function openDeck(browser, file, { width = 1920, height = 1080, hash = '' } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page._errors = [];
  page.on('pageerror', (e) => page._errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) page._errors.push(m.text());
  });
  // Skip the one-time "press ?" hint so screenshots stay clean.
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('deck-kit-hint', '1'); } catch (e) {} });
  await page.goto(fileUrl(file) + hash, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.DeckKit && window.DeckKit.length > 0, { timeout: 15000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return page;
}

/** Go to slide i, wait for it to land, then until its content stops changing
 *  (entry animations, count-ups), waiting at least `settle` ms. */
export async function showSlide(page, i, settle = 450) {
  await page.evaluate((i) => DeckKit.goTo(i), i);
  await page.waitForFunction((i) => DeckKit.index === i, { timeout: 5000 }, i).catch(() => {});
  await page.evaluate((i, min) => DeckKit.settle(i, { min }), i, settle);
}
