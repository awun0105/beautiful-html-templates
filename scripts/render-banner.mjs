#!/usr/bin/env node
/** Render assets/banner.html → assets/banner.png (the README header image). */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, fileUrl, sleep } from './lib/browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 500, deviceScaleFactor: 1.5 });
await page.goto(fileUrl(resolve(root, 'assets/banner.html')), { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await sleep(300);
await page.screenshot({ path: resolve(root, 'assets/banner.png') });
await browser.close();
console.log('Wrote assets/banner.png');
