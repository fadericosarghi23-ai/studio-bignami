# Studio Tecnico Bignami — sito web

Sito dello Studio Tecnico Bignami, studio di geometra a San Giuliano Milanese
(MI): landing a pagina unica con schede (Studio, Valori, Ambiti, Servizi,
Contatti) e pagina Privacy e Cookie Policy. Astro 7 + Tailwind v4 + GSAP/Lenis,
pubblicato su Netlify (`netlify.toml`, Node 22).

Contenuti in `src/data/landing.ts` e `src/data/progetti.ts`, palette nei token di
`src/styles/global.css`. `npm run slot` elenca i dati ancora da ricevere dal
cliente (PEC, foto dello studio, endpoint del form).

```bash
npm install
npm run dev        # http://localhost:4700
```

## Sezioni

Hero con carosello (6 progetti) · Studio (citazione + scheda bio con ritratto) ·
banda scorrevole dei servizi · Metodo in 4 fasi (binario orizzontale) · Ambiti
(4 categorie, binario orizzontale) · Portfolio (binario in landing, griglia con
filtro nella scheda) · Contatti con mappa e form.

Ogni voce della navbar apre la sezione come "scheda" a tutta pagina senza
ricaricare; il logo riporta alla landing.

## Riempire la base

```bash
npm run slot             # elenco completo degli slot, con file e riga
npm run slot -- --conta  # solo i totali
```

La guida passo passo è in [COME-USARE-LA-BASE.md](COME-USARE-LA-BASE.md).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | dev server sulla 4700 |
| `npm run build` | build di produzione in `dist/` |
| `npm run preview` | serve la build sulla 4701 |
| `npm run slot` | elenca gli slot ancora aperti |
| `npm run check` | `astro check` + build + controllo link |
| `npm run smoke` | 34 controlli su Chrome vero (serve `npm run preview` attivo) |
| `npm run placeholder` | rigenera i placeholder immagine da `scripts/placeholder-slot.json` |

## Deploy

`netlify.toml` è pronto (build + check link, `NODE_VERSION = "22"`: Astro 7
richiede Node >= 22.12). Il `package-lock.json` resta fuori dal repo
(`.gitignore`): npm non installa in modo affidabile i binari per-piattaforma
quando il lock è stato generato su Windows (npm/cli#4828).

Nota per questa macchina Windows: Smart App Control blocca il binario nativo di
`satteri` (dipendenza di Astro 7). Il dev e la build girano grazie al pacchetto
`@bruits/satteri-wasm32-wasi` estratto a mano in `node_modules` (fallback WASI):
un `npm install` pulito lo cancella e va rimesso con
`npm pack @bruits/satteri-wasm32-wasi@<versione di satteri>`.
Da ottobre 2026 SAC blocca anche il compilatore Astro
(`@astrojs/compiler-binding-win32-x64-msvc`): stesso rimedio con
`npm pack @astrojs/compiler-binding-wasm32-wasi@<versione di compiler-binding>`,
estratto in `node_modules/@astrojs/compiler-binding-wasm32-wasi/`.
