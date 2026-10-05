/**
 * Controllo link post-build (punto 1 di 06-anti-errori).
 *
 * Fallisce la build se trova:
 *  - href/src vuoti o uguali a "#"
 *  - placeholder mai sostituiti (URL_DELLA_TUA_..., {{...}}, lorem, AAAA)
 *  - URL malformati, tipo il doppio dominio "nomesitohttps://..."
 *  - ancore interne che puntano a un id inesistente
 *  - link interni verso file che la build non ha prodotto
 *
 * Le rotte non ancora costruite vanno dichiarate in ROTTE_PREVISTE: non
 * bloccano la build ma vengono stampate come debito aperto, cosi' restano
 * visibili invece di sparire.
 *
 * Stesso trattamento per gli slot della base: un href o un testo che contiene
 * ancora "[[DA COMPILARE" non fa fallire la build (altrimenti la base non
 * builderebbe mai), ma viene contato e stampato. Quando gli slot arrivano a
 * zero il controllo torna severo da solo.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

/** Pagine interne previste dal brief ma non ancora costruite (fase 2). */
// Studio Bignami: nessuna. Tutti i link interni vanno a pagine o ancore che
// esistono (le rotte della base sono state ripuntate alle viste della landing).
const ROTTE_PREVISTE = new Set([]);

/** Schede di dettaglio previste: nessuna (vedi sopra). */
const PATTERN_PREVISTI = [];

const PLACEHOLDER = /URL_DELLA_TUA|\{\{[^}]+\}\}|lorem ipsum|AAAA|TODO_|DA_CATTURARE/i;

/** Slot dichiarati della base: si contano e si stampano, non fanno fallire. */
const SLOT = /\[\[DA COMPILARE/;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const errori = [];
const daCostruire = new Map();
let slotLink = 0;
let slotTesto = 0;

if (!existsSync(DIST)) {
  console.error('check-links: manca dist/. Esegui prima `npm run build`.');
  process.exit(1);
}

for (const file of await htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  const pagina = '/' + path.relative(DIST, file).replace(/\\/g, '/');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const [, attr, valore] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const v = valore.trim();

    if (v === '' || v === '#') {
      errori.push(`${pagina}: ${attr} vuoto o "#"`);
      continue;
    }
    if (SLOT.test(v)) {
      slotLink += 1;
      continue;
    }
    // Un data URI (es. il logo inline dell'apertura) e' base64: "AAAA" li' e'
    // normale, non un placeholder.
    if (v.startsWith('data:')) continue;
    if (PLACEHOLDER.test(v)) {
      errori.push(`${pagina}: ${attr} con placeholder -> ${v}`);
      continue;
    }
    // Doppio schema o dominio incollato: "nomesitohttps://..."
    if (/.+https?:\/\//.test(v) && !v.startsWith('http') && !v.startsWith('data:')) {
      errori.push(`${pagina}: ${attr} malformato -> ${v}`);
      continue;
    }
    if (/^(https?:|mailto:|tel:|data:)/.test(v)) continue;

    if (v.startsWith('#')) {
      if (!ids.has(v.slice(1))) errori.push(`${pagina}: ancora senza destinazione -> ${v}`);
      continue;
    }
    if (!v.startsWith('/')) continue; // relativi: nessuno nel progetto

    const senzaHash = v.split('#')[0];
    if (ROTTE_PREVISTE.has(senzaHash) || PATTERN_PREVISTI.some((r) => r.test(senzaHash))) {
      daCostruire.set(senzaHash, (daCostruire.get(senzaHash) ?? 0) + 1);
      continue;
    }

    const candidati = senzaHash.endsWith('/')
      ? [path.join(DIST, senzaHash, 'index.html')]
      : [path.join(DIST, senzaHash)];
    if (!candidati.some((c) => existsSync(c))) {
      errori.push(`${pagina}: link interno rotto -> ${v}`);
    }
  }

  const testo = html.replace(/<[^>]+>/g, ' ');
  if (/AAAA/.test(testo)) errori.push(`${pagina}: testo segnaposto "AAAA" nel contenuto`);
  slotTesto += (testo.match(/\[\[DA COMPILARE/g) ?? []).length;
}

if (slotLink || slotTesto) {
  console.log(
    `\ncheck-links: slot della base ancora da riempire — ${slotTesto} nel testo, ` +
      `${slotLink} dentro href/src. Elenco completo: npm run slot`
  );
}

if (daCostruire.size) {
  console.log('\ncheck-links: rotte previste ma non ancora costruite (fase 2)');
  for (const [rotta, n] of [...daCostruire].sort()) {
    console.log(`  ${rotta}  (${n} link)`);
  }
}

if (errori.length) {
  console.error(`\ncheck-links: ${errori.length} problemi`);
  for (const e of errori) console.error(`  ${e}`);
  process.exit(1);
}

console.log('\ncheck-links: nessun href vuoto, placeholder, malformato o rotto.');
