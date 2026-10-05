/**
 * Comprime i sorgenti delle immagini prima di metterli nel repo.
 *
 * Astro rigenera comunque le rendition servite al browser: qui si interviene
 * sui file di partenza, che erano gli originali del sito e pesavano quanto
 * l'intero progetto. Si ricodifica a qualita' alta (mozjpeg 82) e si limita la
 * larghezza a quella massima realmente usata: nessuna rendition supera i 2500px.
 *
 *   node scripts/comprimi-immagini.mjs            (applica)
 *   node scripts/comprimi-immagini.mjs --prova    (mostra solo cosa farebbe)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PROVA = process.argv.includes('--prova');
const LARGHEZZA_MAX = 2500;
const QUALITA = 82;
const CARTELLE = ['src/assets/img', 'public'];

async function file(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await file(p)));
    else if (/\.(jpe?g|png)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';

let prima = 0;
let dopo = 0;
let toccati = 0;

for (const cartella of CARTELLE) {
  for (const f of await file(cartella)) {
    // Si legge in memoria e si lavora dal buffer: su OneDrive riscrivere un
    // file che sharp tiene ancora aperto fallisce con UNKNOWN.
    const sorgente = await readFile(f);
    const originale = sorgente.length;
    prima += originale;

    const img = sharp(sorgente, { failOn: 'none' });
    const meta = await img.metadata();
    const png = /\.png$/i.test(f);

    // I loghi premio e le icone restano PNG: hanno la trasparenza.
    let pipeline = img.rotate();
    if (meta.width && meta.width > LARGHEZZA_MAX) {
      pipeline = pipeline.resize({ width: LARGHEZZA_MAX, withoutEnlargement: true });
    }
    pipeline = png
      ? pipeline.png({ compressionLevel: 9, palette: true })
      : pipeline.jpeg({ quality: QUALITA, mozjpeg: true, progressive: true });

    const buf = await pipeline.toBuffer();

    // Si sostituisce solo se ci si guadagna davvero.
    if (buf.length < originale * 0.95) {
      if (!PROVA) await writeFile(f, buf);
      dopo += buf.length;
      toccati++;
      console.log(
        `  ${mb(originale).padStart(8)} -> ${mb(buf.length).padStart(8)}  ${f.replace(/\\/g, '/')}`
      );
    } else {
      dopo += originale;
    }
  }
}

console.log(
  `\n${toccati} file ricompressi${PROVA ? ' (prova, nulla scritto)' : ''}` +
    `\ntotale: ${mb(prima)} -> ${mb(dopo)}  (-${(((prima - dopo) / prima) * 100).toFixed(1)}%)`
);
