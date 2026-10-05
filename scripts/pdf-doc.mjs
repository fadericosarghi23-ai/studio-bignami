/**
 * Stampa docs/palette-e-interventi.html in PDF con Chrome vero.
 *
 *   node scripts/pdf-doc.mjs
 *
 * Usa le stesse dipendenze dello smoke test (chrome-launcher + puppeteer-core):
 * niente catene di conversione, il PDF e' quello che stampa il browser.
 */
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SORGENTE = path.resolve('docs/palette-e-interventi.html');
const USCITA = path.resolve('docs/palette-e-interventi.pdf');

const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });

try {
  const page = (await browser.pages())[0] ?? (await browser.newPage());
  await page.goto(pathToFileURL(SORGENTE).href, { waitUntil: 'networkidle0' });
  await page.pdf({ path: USCITA, format: 'A4', printBackground: true });
  console.log('PDF scritto in', USCITA);
} finally {
  await browser.disconnect();
  // Su Windows la cartella temporanea di Chrome resta a volte agganciata:
  // il PDF e' gia' scritto, non vale la pena far fallire il comando per questo.
  try { await chrome.kill(); } catch { /* cartella temporanea non rimossa */ }
}
