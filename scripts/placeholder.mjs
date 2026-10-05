/**
 * Genera i placeholder immagine della base.
 *
 * Ogni slot e' un file raster (JPG/PNG) delle STESSE dimensioni della foto che
 * andra' al suo posto: cosi' srcset, aspect-ratio, altezze delle card e
 * animazioni non si spostano di un pixel quando si sostituisce il file.
 *
 * L'elenco degli slot sta in scripts/placeholder-slot.json (percorso, misura,
 * etichetta). Per cambiare una misura si modifica il JSON e si rilancia.
 *
 *   node scripts/placeholder.mjs                 (rigenera tutti gli slot)
 *   node scripts/placeholder.mjs progetto-01     (solo gli slot che combaciano)
 *
 * NOTA: si generano raster, non SVG. In Astro un import .svg restituisce un
 * componente, non un ImageMetadata: con un SVG salterebbero <Image>, getImage()
 * e tutti i srcset del carosello.
 */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const MANIFEST = 'scripts/placeholder-slot.json';

const COLORI = {
  fondo: '#e8e8ec',
  tratto: '#c8c8d2',
  cornice: '#b0b0bd',
  piatto: '#f3f3f6',
  testo: '#55555f',
  nota: '#8a8a96',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Larghezza stimata di una riga: basta per non farla uscire dal riquadro. */
const largo = (testo, f) => testo.length * f * 0.62;

function svg({ w, h, etichetta, trasparente }) {
  const misura = `${w} × ${h}`;
  const s = Math.max(1, Math.round(Math.min(w, h) / 260));
  const m = Math.round(Math.min(w, h) * 0.04);

  // `trasparente` serve al logo: la navbar lo inverte in bianco sopra l'hero, e
  // con un fondo pieno diventerebbe un rettangolo bianco invece di un segno.
  const sfondo = `
    ${trasparente ? '' : `<rect width="${w}" height="${h}" fill="${COLORI.fondo}"/>`}
    <g stroke="${trasparente ? COLORI.testo : COLORI.tratto}" stroke-width="${s}" fill="none">
      <line x1="0" y1="0" x2="${w}" y2="${h}"/>
      <line x1="${w}" y1="0" x2="0" y2="${h}"/>
    </g>
    <rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}"
          fill="none" stroke="${trasparente ? COLORI.testo : COLORI.cornice}" stroke-width="${s}"
          stroke-dasharray="${s * 6} ${s * 5}"/>`;

  // Troppo piccolo per una scritta leggibile: resta il segno grafico.
  if (w < 140 || h < 56) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${sfondo}</svg>`;
  }

  const righe = h < 150 ? [etichetta, misura] : [etichetta, misura, 'IMMAGINE DA SOSTITUIRE'];

  // Il corpo si adatta all'altezza, poi rientra se la riga piu' lunga sborda.
  let f = Math.min(72, Math.max(11, Math.round(Math.min(w, h) / 12)));
  const piuLunga = righe.reduce((a, b) => (largo(a, 1) > largo(b, 1) ? a : b));
  if (largo(piuLunga, f) > w * 0.86) f = Math.floor((w * 0.86) / (piuLunga.length * 0.62));
  f = Math.max(8, f);

  const interlinea = Math.round(f * 1.45);
  const altezzaTesto = righe.length * interlinea;
  const y0 = Math.round(h / 2 - altezzaTesto / 2 + f * 0.85);

  const piattoW = Math.min(w * 0.94, largo(piuLunga, f) + f * 2.2);
  const piattoH = altezzaTesto + f * 0.9;

  const corpo = righe
    .map((riga, i) => {
      const dimensione = i === 0 ? f : Math.round(f * 0.62);
      const colore = i === 0 || trasparente ? COLORI.testo : COLORI.nota;
      const peso = i === 0 ? '700' : '500';
      return `<text x="${w / 2}" y="${y0 + i * interlinea}" text-anchor="middle"
        font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="${dimensione}"
        font-weight="${peso}" letter-spacing="${(dimensione * 0.06).toFixed(2)}"
        fill="${colore}">${esc(riga)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${sfondo}
    <rect x="${(w - piattoW) / 2}" y="${h / 2 - piattoH / 2}" width="${piattoW}" height="${piattoH}"
          fill="${trasparente ? 'none' : COLORI.piatto}"
          stroke="${trasparente ? 'none' : COLORI.cornice}" stroke-width="${s}"/>
    ${corpo}
  </svg>`;
}

const filtro = process.argv[2];
const slot = JSON.parse(await readFile(MANIFEST, 'utf8'));
const scelti = filtro ? slot.filter((s) => s.file.includes(filtro)) : slot;

if (!scelti.length) {
  console.error(`placeholder: nessuno slot combacia con "${filtro}".`);
  process.exit(1);
}

for (const s of scelti) {
  // .ico: il favicon di fallback e' un PNG col nome .ico, come l'originale.
  const png = /\.(png|ico)$/i.test(s.file);
  const immagine = sharp(Buffer.from(svg(s)));
  const buf = await (png
    ? immagine.png({ compressionLevel: 9 }).toBuffer()
    : immagine.jpeg({ quality: 78, mozjpeg: true }).toBuffer());
  await writeFile(s.file, buf);
  console.log(`  ${s.file}  ${s.w}×${s.h}  ${(buf.length / 1024).toFixed(0)} kB`);
}

console.log(`\nplaceholder: ${scelti.length} slot generati.`);
