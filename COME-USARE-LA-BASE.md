# Come riempire la base

Il punto di partenza è sempre lo stesso:

```bash
npm run slot
```

Elenca ogni slot rimasto, con file e numero di riga. Quando non stampa più
niente, la base è piena.

---

## La convenzione

I testi da scrivere sono marcati così:

```
[[DA COMPILARE: descrizione di cosa va qui]]
```

Gli `alt` delle immagini così (senza parentesi, perché finiscono in un
attributo):

```
DA COMPILARE: descrizione della foto
```

La descrizione dice anche la **misura attesa** quando conta («4-7 parole»,
«1 frase di circa 150 caratteri»). Le lunghezze sono tarate sul layout: un
testo lungo il triplo manda a capo card che erano allineate o fa sbordare un
binario orizzontale.

### Eccezioni, per vincoli tecnici

Dove il marker inline non ci sta o non è valido, il valore è corto e neutro e
il marker sta nel commento subito sopra (`npm run slot` cerca anche lì).

| Dove | Perché | Valore attuale |
|---|---|---|
| Le 5 voci di navbar (`navLinks` in `landing.ts`) | un marker lungo × 5 manda la barra in overflow sotto i 1200px | `Sezione 1` … `Sezione 5` |
| L'etichetta del bottone contatto in navbar (`Header.astro`) | stesso motivo | `Contattaci` |
| Il dominio (`landing.ts`, `astro.config.mjs`, `netlify.toml`, `robots.txt`) | `new URL()` rifiuta un marker: deve restare un URL valido | `https://www.dominio-da-compilare.example` |

La mappa non ha coordinate: l'embed di Google cerca `site.indirizzo`, quindi si
sistema da sola quando si scrive l'indirizzo.

---

## Ordine consigliato

### 1. Identità e dati tecnici — `src/data/landing.ts`

In cima al file: `site` (nome, dominio, email, telefono, indirizzo, provincia,
aree servite, social) e `legale` (ragione sociale, P. IVA, PEC). Da qui si
propagano navbar, footer, contatti, mappa, JSON-LD e Open Graph.

Il dominio va messo in **quattro** punti: `src/data/landing.ts`,
`astro.config.mjs`, `netlify.toml`, `public/robots.txt`. Nome e descrizione
anche in `public/site.webmanifest`.

### 2. Meta della pagina — `src/pages/index.astro`

`title` (max 60 caratteri) e `description` (140-160).

### 3. Testi delle sezioni — `src/data/landing.ts`

`hero`, `mission`, `fasi` (4), `specializzazioni` (5), `ambiti` (4),
`progetti` (6 in vetrina), `footerMenu`.

### 4. La griglia dei progetti — `src/data/progetti.ts`

16 voci. Se ne servono meno, si cancellano le voci in eccesso **e** i file
immagine corrispondenti da `src/assets/img/progetti/` e da
`scripts/placeholder-slot.json`.

⚠️ Le stringhe delle categorie devono combaciare **carattere per carattere** fra
`progettiTutti[].categorie`, l'array `categorie` in fondo a `progetti.ts`, i
`titolo` di `ambiti` e i `categoria` di `progetti` in `landing.ts`. I marker
`[[DA COMPILARE: categoria N]]` sono identici apposta: si sostituiscono con un
cerca e sostituisci su tutta la cartella `src/data/`. Niente `|` nei nomi.

### 5. Micro-copy nei componenti

Occhielli, titoli di sezione, CTA, colonne del footer: `npm run slot` li
elenca componente per componente.

### 6. Le immagini

Ogni placeholder porta scritta addosso la sua misura. **Sostituire il file
tenendo lo stesso nome e la stessa misura** (o almeno lo stesso rapporto):
nome e misura sono cablati negli `import.meta.glob`, nei `srcset` e nelle
altezze delle card.

| Cartella | File | A cosa servono |
|---|---|---|
| `src/assets/img/` | `progetto-01…06.jpg` | le 6 slide del carosello hero + le prime 4 sul binario della landing |
| | `fase-01…04.jpg` | le 4 fasi del metodo (la 02 fa anche da sfondo velato della sezione) |
| | `ambito-01…04.jpg` | le 4 card degli ambiti |
| | `ritratto-fondatore.jpg` | ritratto nella scheda Studio (2304×3456) |
| | `logo.png` | logo orizzontale 283×71, PNG **con trasparenza** (sopra l'hero viene invertito in bianco) |
| `src/assets/img/progetti/` | `progetto-01…16.jpg` | cover della griglia (490×490, tranne 02, 03, 16) |
| `src/assets/img/progetti-extra/` | `extra-01…10.jpg` | scorta per future pagine di dettaglio, oggi non usate |
| `public/` | `og-default.jpg` | immagine Open Graph, 1500×1000 |
| | `favicon-32.jpg`, `favicon.ico`, `icon-192.jpg`, `favicon-270.jpg`, `apple-touch-icon.jpg` | icone |

Misure e etichette stanno in `scripts/placeholder-slot.json`; `npm run
placeholder` rigenera i placeholder. Se cambia il rapporto d'aspetto,
ricontrollare le altezze fisse nelle card (`h-[260px]`, `h-[420px]`…).

Le foto vere vanno compresse prima di committarle:
`node scripts/comprimi-immagini.mjs` (mozjpeg 82, max 2500px).

### 7. Il form

**Oggi non spedisce niente, ed è voluto.** La validazione client c'è tutta;
manca solo la destinazione. Il punto in cui collegarla è segnato in
`src/scripts/site.ts`, sezione 11, con le due strade possibili (servizio
esterno tipo Formspree/Basin, oppure Astro Action con adapter).

### 8. Analytics, pixel, consensi

Nella base **non c'è nessuno script di tracciamento**: niente GA4, GTM, Meta
Pixel. Se il cliente li vuole, vanno aggiunti insieme a un banner di consenso.

---

## Prima di pubblicare

```bash
npm run slot -- --conta   # deve dire 0
npm run check             # astro check + build + link
npm run smoke             # 34 controlli su Chrome vero
```

`check:links` fa fallire la build su href vuoti, `#`, link interni rotti e
ancore senza destinazione. Gli slot `[[DA COMPILARE]]` invece li **conta e li
stampa** senza bloccare.

Da controllare a mano:

- le pagine interne (`/chi-siamo/`, `/progetti/`, `/contatti/`,
  `/privacy-policy/`) e le schede progetto sono **linkate ma non esistono**:
  `check:links` le elenca come debito dichiarato;
- privacy e cookie policy vanno scritte con i dati del cliente.

## Il design system

I token in `src/styles/global.css` **non sono segnaposto**: la palette
(`--color-brand` #1bb0ce e derivati) è il default della base e si sostituisce
con quella del cliente cambiando solo i token. Il colore del marchio è
sdoppiato: `--color-brand` per decorazioni e testo su fondo scuro,
`--color-brand-ink` (più scuro, 5:1) per testo e CTA su fondo chiaro. Lo stesso
colore va riportato in `theme-color` (`BaseLayout.astro`) e `theme_color`
(`public/site.webmanifest`).
