/**
 * Contenuti della landing — Studio Tecnico Bignami (San Giuliano Milanese).
 *
 * Riempita dalla mappa in CONTENT_FILL.md (analisi di studiobignami.net del
 * 05/10/2026). I testi lunghi sono verbatim dal sito del cliente; le etichette
 * brevi che il sito non ha (occhielli, CTA, nomi delle categorie) sono
 * composte con le parole del sito e vanno validate.
 *
 * La base nasceva per uno studio di architettura: qui la "vetrina" e il
 * "portfolio" raccontano i SERVIZI dello studio, non progetti realizzati.
 * Quello che resta da compilare (marker DA COMPILARE) e' un dato che la mappa segna come
 * assente: `npm run slot` li elenca tutti.
 */

export const site = {
  nome: 'Studio Tecnico Bignami',
  // Host di produzione: quello che il cliente usa oggi. Se il nuovo sito
  // andasse altrove, va cambiato qui E in astro.config.mjs, netlify.toml e
  // public/robots.txt: sono i quattro punti che formano canonical, Open
  // Graph, JSON-LD e sitemap.
  dominio: 'https://www.studiobignami.net',
  email: 'info@studiobignami.net',
  telefono: '+39 351 320 24 72',
  telefonoE164: '+393513202472',
  // Civico: la pagina Contatti e la Privacy dicono 9/B, footer e home "n° 9".
  // Usato il 9/B (e' quello dei dati legali): da confermare col cliente.
  indirizzo: 'Via Monte Rosa, 9/B, 20098 San Giuliano Milanese (MI)',
  via: 'Via Monte Rosa, 9/B',
  citta: 'San Giuliano Milanese',
  cap: '20098',
  provincia: 'MI',
  // "lavora a Milano e in tutta la provincia" + le pagine servizio "Lombardia".
  areeServite: ['Milano e provincia', 'Lombardia'],
  // Orari verbatim dalla pagina Contatti.
  orari: 'Lun. - Ven. 09:00 – 18:00 · Sabato 09:00 – 13:00 · Domenica Chiusi',
  // Il cliente non ha profili social collegati al sito (mappa: "assente").
  // Vuoti = il footer non mostra la colonna social e il JSON-LD li salta.
  social: {
    instagram: '',
    facebook: '',
  },
};

/**
 * Dati legali del footer e delle pagine privacy/cookie.
 * P.IVA dalla Privacy Policy del sito attuale.
 */
export const legale = {
  ragioneSociale: 'Studio Tecnico Bignami',
  piva: '04690350964',
  pec: '[[DA COMPILARE: indirizzo PEC, assente sul sito attuale]]',
};

/**
 * Navigazione della landing: ancore interne alla stessa pagina.
 * Gli `hash` sono la struttura: non cambiarli.
 */
export const navLinks = [
  { label: 'Studio', hash: '#mission' },
  { label: 'Valori', hash: '#metodo' },
  { label: 'Ambiti', hash: '#ambiti' },
  { label: 'Servizi', hash: '#portfolio' },
  { label: 'Contatti', hash: '#contatti' },
];

export const hero = {
  eyebrow: 'Studio Tecnico Bignami',
  h1: 'Innovazione edilizia', // verbatim ("INNOVAZIONE EDILIZIA")
  kicker: 'Trasformiamo visioni in realtà con soluzioni su misura per ogni progetto.', // verbatim
  ctaLabel: 'Visualizza servizi', // verbatim ("VISUALIZZA SERVIZI")
};

export const mission = {
  label: 'Chi siamo', // verbatim
  // Verbatim: seconda frase del "Chi siamo".
  quote:
    "Dal 2005, siamo il vostro punto di riferimento per un'assistenza tecnica altamente specializzata, accompagnandovi con competenza nella realizzazione dei vostri progetti edilizi e immobiliari.",
  // Il sito non nomina un titolare: la firma e' lo studio.
  autore: 'Studio Tecnico Bignami', // verbatim (titolo della sezione)
  ruolo: 'Studio di Geometra · dal 2005',
  // Verbatim: il resto del "Chi siamo".
  corpo: [
    'Benvenuti allo Studio Tecnico Bignami, situato in Via Monte Rosa 9, San Giuliano Milanese. Il nostro Studio di Geometra lavora a Milano e in tutta la provincia, offriamo un ampio spettro di servizi nel campo delle certificazioni energetiche, pratiche edilizie, CILA, SCIA e altre.',
    "Impegnati nella precisione e nell'eccellenza, forniamo soluzioni su misura per ogni esigenza, garantendo un percorso fluido e completo verso il successo del vostro investimento. Vi invitiamo a visitare il nostro studio a San Giuliano Milanese per discutere direttamente con i nostri esperti. In alternativa, potete esplorare la nostra gamma di servizi online. Non esitate a contattarci per una consulenza personalizzata: siamo pronti ad assistervi in ogni fase del vostro progetto, offrendo un supporto completo e professionale.",
  ],
  ctaLabel: 'Contattaci',
};

/**
 * La sezione "metodo" della base ospita i VALORI dello studio (6 sul sito,
 * qui i primi 4: la sezione ne regge quattro). Testi verbatim.
 * Restano fuori "Innovazione" (che e' gia' la headline dell'hero) e "Noi"
 * (usato come introduzione della sezione, in Metodo.astro).
 */
export const fasi = [
  {
    n: '01',
    titolo: 'Sviluppo',
    testo:
      'Progettiamo con precisione i tuoi spazi, assicurando che ogni aspetto della costruzione sia minuziosamente conforme alle normative.',
    img: 'fase-01.jpg',
    alt: 'Sezione di una casa con le tavole di progetto',
  },
  {
    n: '02',
    titolo: 'Precisione',
    testo:
      'La nostra attenzione ai dettagli assicura che ogni servizio sia fornito con la massima chiarezza e precisione.',
    img: 'fase-02.jpg',
    alt: 'Modellino di casa sulle tavole di progetto, con matite e strumenti di misura',
  },
  {
    n: '03',
    titolo: 'Strategia',
    testo:
      'Definiamo strategie su misura per ogni cliente, garantendo soluzioni ottimali per pratiche catastali e certificazioni energetiche.',
    img: 'fase-03.jpg',
    alt: 'Matita rossa e modellino di casa su una planimetria',
  },
  {
    n: '04',
    titolo: 'Certificazioni',
    testo:
      'Forniamo documentazione completa e certificazioni affidabili per ogni aspetto del tuo progetto edilizio e energetico.',
    img: 'fase-04.jpg',
    alt: 'Edifici con pannelli solari e tetti verdi: efficienza energetica',
  },
];

/**
 * Banda scorrevole fra Mission e Metodo: i 5 "servizi più richiesti" del
 * footer del sito attuale.
 */
export const specializzazioni = [
  'Certificazione Energetica',
  'Pratiche Edilizie',
  'Pratiche Catastali',
  'SCIA',
  'CILA',
];

/**
 * Ambiti = le categorie dei servizi, e i filtri della griglia.
 * Il sito non raggruppa i servizi: i quattro gruppi sono nostri e vanno
 * validati. I nomi sono tre servizi del cliente piu' "Sicurezza e Agibilità"
 * (PSC + SCA). Testi: descrizioni verbatim di "Servizi principali".
 *
 * REGOLA: ogni `titolo` qui deve combaciare CARATTERE PER CARATTERE con le
 * stringhe di `categorie` in progetti.ts. Niente `|` nei nomi.
 */
export const ambiti = [
  {
    titolo: 'Pratiche Edilizie',
    testo:
      "Gestiamo tutte le pratiche necessarie per la realizzazione, l'approvazione e la regolarizzazione dei tuoi progetti edilizi, garantendo la conformità con le normative locali e nazionali.",
    href: '#portfolio',
    img: 'ambito-01.jpg',
    alt: 'Edificio residenziale con i ponteggi durante i lavori',
  },
  {
    titolo: 'Pratiche Catastali',
    testo:
      'Offriamo un servizio completo per la gestione delle pratiche catastali, assicurando precisione, aggiornamenti e conformità alle normative vigenti.',
    href: '#portfolio',
    img: 'ambito-02.jpg',
    alt: 'Lente di ingrandimento su una planimetria catastale',
  },
  {
    titolo: 'Certificazione Energetica',
    testo:
      "Forniamo certificazioni energetiche (APE) indispensabili per migliorare l'efficienza e la sostenibilità dei tuoi edifici, sia residenziali che commerciali.",
    href: '#portfolio',
    img: 'ambito-03.jpg',
    alt: 'Classi energetiche su uno smartphone, fra disegni e strumenti di progetto',
  },
  {
    titolo: 'Sicurezza e Agibilità',
    testo:
      'Redigiamo e gestiamo il Piano di Sicurezza e Coordinamento per garantire la sicurezza nei cantieri e la conformità alle normative sulla sicurezza sul lavoro.',
    href: '#portfolio',
    img: 'ambito-04.jpg',
    alt: 'Geometra in cantiere con caschetto, tablet e stazione di rilievo',
  },
];

/**
 * 6 servizi in vetrina: le 6 card "I Nostri Servizi" della home del cliente,
 * nello stesso ordine. Sono le 6 slide del carosello dell'hero; le prime 4
 * finiscono anche sul binario della landing.
 *
 * `localita` qui porta il sottotitolo verbatim della card (il campo resta
 * quello della base: e' la riga piccola sotto il titolo).
 * `img` e' lo slot della vetrina (progetto-01..06.jpg in src/assets/img/);
 * `href` apre la scheda Servizi (le pagine di dettaglio non esistono).
 */
export const progetti = [
  {
    titolo: 'Pratiche Edilizie',
    localita: 'Conformità e regolarizzazione progetti.',
    categoria: 'Pratiche Edilizie',
    nota: '',
    href: '#portfolio',
    img: 'progetto-01.jpg',
    alt: 'Tavole di progetto e planimetrie sul tavolo dello studio',
  },
  {
    titolo: 'Certificazione Energetica',
    localita: 'Migliora efficienza e sostenibilità.',
    categoria: 'Certificazione Energetica',
    nota: '',
    href: '#portfolio',
    img: 'progetto-02.jpg',
    alt: 'Pannelli fotovoltaici sul tetto di un edificio a Milano',
  },
  {
    titolo: 'Pratiche Catastali',
    localita: 'Gestione precisa e aggiornata.',
    categoria: 'Pratiche Catastali',
    nota: '',
    href: '#portfolio',
    img: 'progetto-03.jpg',
    alt: 'Mani che consultano una planimetria',
  },
  {
    titolo: 'Idoneità Alloggiativa',
    localita: 'Documentazione per esigenze abitative.',
    categoria: 'Pratiche Edilizie',
    nota: '',
    href: '#portfolio',
    img: 'progetto-04.jpg',
    alt: 'Tecnico che analizza la planimetria di un alloggio',
  },
  {
    titolo: 'Piano di Sicurezza e Coordinamento',
    localita: 'Sicurezza e coordinamento cantiere.',
    categoria: 'Sicurezza e Agibilità',
    nota: '',
    href: '#portfolio',
    img: 'progetto-05.jpg',
    alt: 'Gru e palazzi in costruzione',
  },
  {
    titolo: 'Segnalazione Certificata di Agibilità',
    localita: 'Agibilità conforme alla legge.',
    categoria: 'Sicurezza e Agibilità',
    nota: '',
    href: '#portfolio',
    img: 'progetto-06.jpg',
    alt: 'Documenti tecnici per il certificato di agibilità',
  },
];

/**
 * Menu del footer: 3 voci verso le viste della landing (la base prevedeva
 * pagine interne che non esistono). Etichette di 1 parola.
 */
export const footerMenu = [
  { label: 'Servizi', href: '#portfolio' },
  { label: 'Studio', href: '#mission' },
  { label: 'Contatti', href: '#contatti' },
];
