#!/usr/bin/env node
// Screenshot of the user's own product for a piece: a page, one element of it, or the logo, at twice the pixel density so
// a crop that is scaled up stays sharp (numbers.md, Text size on a phone). Only for sites the user owns or may show.
//
// usage: node capture.mjs <url | page.html> <out.png> [--selector "css"] [--full] [--dark] [--hide "css, css"]
//          [--size 1280x800] [--scale 2] [--wait 1000]
//          --selector  just that element (a hero section, a card, "header img" for the logo)
//          --full      the whole scrolling page        --dark  prefers-color-scheme: dark
//          --hide      elements hidden first (a cookie banner, a chat bubble)
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = 'usage: node capture.mjs <url | page.html> <out.png> [--selector "css"] [--full] [--dark] [--hide "css, css"] [--size 1280x800] [--scale 2] [--wait 1000]';
const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : dflt; };
const flag = (name) => argv.includes('--' + name);
const die = (msg, code = 1) => { console.error(msg); process.exit(code); };
const [target, out] = argv;
if (!target || !out || target.startsWith('--') || out.startsWith('--')) die(USAGE, 2);
const [W, H] = opt('size', '1280x800').split('x').map(Number), scale = Number(opt('scale', '2')), wait = Number(opt('wait', '1000'));
if (!(W > 0 && H > 0 && scale > 0 && wait >= 0)) die(USAGE, 2);

// Playwright from the project, this skill's folder, NODE_PATH or the global npm root, as render.mjs finds it
function loadPlaywright() {
  const tries = [path.join(process.cwd(), 'noop.js'), import.meta.url];
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (npmRoot.status === 0) tries.push(path.join(npmRoot.stdout.trim(), 'noop.js'));
  for (const from of tries) { try { return createRequire(from)('playwright'); } catch {} }
  return null;
}
const pw = loadPlaywright();
if (!pw) die('missing:\n  Playwright: npm i -D playwright && npx playwright install chromium');

const url = /^https?:\/\//.test(target) ? target : fs.existsSync(target) ? pathToFileURL(path.resolve(target)).href : die(`not found: ${target}`);
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: scale, colorScheme: flag('dark') ? 'dark' : 'light' });
await page.goto(url, { waitUntil: 'networkidle' });
if (opt('hide')) await page.addStyleTag({ content: `${opt('hide')}{visibility:hidden!important}` });
await page.waitForTimeout(wait);
const sel = opt('selector'), shotOpts = { path: out, ...(sel ? {} : { fullPage: flag('full') }) };
if (sel) { const el = page.locator(sel).first(); if (!(await el.count())) die(`no element matches ${sel}`); await el.screenshot(shotOpts); }
else await page.screenshot(shotOpts);
await browser.close();
console.log(`wrote ${out} (${sel ? `the element ${sel}` : flag('full') ? 'the whole page' : `${W}x${H}`} at ${scale}x)`);
