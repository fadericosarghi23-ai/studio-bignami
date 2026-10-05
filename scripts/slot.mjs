/**
 * Elenca gli slot ancora da riempire nella base.
 *
 *   npm run slot            (elenco completo, raggruppato per file)
 *   npm run slot -- --conta (solo i totali)
 *
 * Cerca due cose nei sorgenti:
 *  - i marker di testo `[[DA COMPILARE: ...]]`
 *  - gli alt immagine `DA COMPILARE: ...`
 *
 * Quando questo comando non stampa piu' niente, la base e' piena.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const RADICI = ['src', 'public', 'scripts', 'astro.config.mjs', 'netlify.toml'];
const ESTENSIONI = /\.(astro|ts|tsx|js|mjs|css|json|txt|toml|webmanifest|md)$/i;
const IGNORA = /node_modules|dist|\.astro[/\\]|placeholder-slot\.json|slot\.mjs|check-links\.mjs/;

const soloConta = process.argv.includes('--conta');

async function file(p) {
  const out = [];
  const info = await readdir(p, { withFileTypes: true }).catch(() => null);
  if (!info) return [p]; // e' un file singolo
  for (const e of info) {
    const full = path.join(p, e.name);
    if (IGNORA.test(full)) continue;
    if (e.isDirectory()) out.push(...(await file(full)));
    else if (ESTENSIONI.test(e.name)) out.push(full);
  }
  return out;
}

const elenchi = [];
let totale = 0;

for (const radice of RADICI) {
  for (const f of await file(radice)) {
    if (IGNORA.test(f)) continue;
    const righe = (await readFile(f, 'utf8')).split(/\r?\n/);
    const trovate = [];
    righe.forEach((riga, i) => {
      if (/\[\[DA COMPILARE|DA COMPILARE:/.test(riga)) {
        trovate.push({ n: i + 1, testo: riga.trim().slice(0, 140) });
      }
    });
    if (trovate.length) {
      totale += trovate.length;
      elenchi.push({ file: f.replace(/\\/g, '/'), trovate });
    }
  }
}

if (!soloConta) {
  for (const { file: f, trovate } of elenchi) {
    console.log(`\n${f}  (${trovate.length})`);
    for (const t of trovate) console.log(`  ${String(t.n).padStart(4)}  ${t.testo}`);
  }
}

console.log(`\nslot: ${totale} righe con segnaposto in ${elenchi.length} file.`);
if (!totale) console.log('La base e\' piena: nessuno slot rimasto.');
