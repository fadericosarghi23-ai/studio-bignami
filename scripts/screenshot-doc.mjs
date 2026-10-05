/**
 * Screenshot per il documento di consegna (docs/img/), dal sito in preview.
 *
 *   npm run preview            (in un altro terminale, porta 4701)
 *   node scripts/screenshot-doc.mjs
 */
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const URL_BASE = process.argv[2] ?? 'http://localhost:4701/';
const OUT = 'docs/img';
await mkdir(OUT, { recursive: true });

const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1.5 });

  // 1. Apertura: il logo composto, prima che le ante si aprano.
  await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  await pausa(1650);
  await page.screenshot({ path: `${OUT}/intro.jpg`, type: 'jpeg', quality: 82 });

  // 2. Hero a ingresso finito.
  await pausa(2600);
  await page.screenshot({ path: `${OUT}/hero.jpg`, type: 'jpeg', quality: 82 });

  // 3. Ambiti e 4. contatti: scroll alla sezione e attesa dei reveal.
  for (const [id, file] of [['#ambiti', 'ambiti'], ['#contatti', 'contatti']]) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 92);
    }, id);
    await pausa(1800);
    await page.screenshot({ path: `${OUT}/${file}.jpg`, type: 'jpeg', quality: 82 });
  }
  console.log('screenshot in', OUT);
} finally {
  await browser.disconnect();
  try { await chrome.kill(); } catch { /* cartella temporanea agganciata */ }
}
