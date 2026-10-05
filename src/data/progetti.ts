/**
 * La griglia della scheda "Servizi" — Studio Tecnico Bignami.
 *
 * Sono le 12 card della pagina /servizi/ del sito attuale, nello stesso
 * ordine: titolo e sottotitolo verbatim (il sottotitolo sta nel campo
 * `localita` della base, che e' la riga piccola della card). Unica correzione:
 * "Idoneitá"/"Conformitá" del sito sono scritti con l'accento giusto.
 *
 * Cover: le immagini delle card del sito attuale (345x325, importate da un
 * vecchio sito Wix: bassa risoluzione, da sostituire con foto in alta).
 * Ristrutturazioni non ha una card con foto: la sua e' presa dalla libreria
 * media del sito.
 *
 * La base ne aveva 16: le 4 voci in piu' sono state tolte insieme ai file.
 *
 * REGOLA: le stringhe in `categorie` devono combaciare carattere per carattere
 * con quelle di `categorie` in fondo al file e con i `titolo` di `ambiti` in
 * landing.ts, altrimenti il filtro non trova nulla.
 */
export const progettiTutti = [
  {
    titolo: 'Pratiche Edilizie',
    localita: 'Conformità e regolarizzazione progetti.',
    categorie: ['Pratiche Edilizie'],
    href: '#contatti',
    img: 'progetto-01.jpg',
    alt: 'Pratiche edilizie: mani su una tavola di progetto',
  },
  {
    titolo: 'Certificazione Energetica',
    localita: 'Migliora efficienza e sostenibilità.',
    categorie: ['Certificazione Energetica'],
    href: '#contatti',
    img: 'progetto-02.jpg',
    alt: 'Certificazione energetica: modellino di casa e scala delle classi energetiche',
  },
  {
    titolo: 'Pratiche Catastali',
    localita: 'Gestione precisa e aggiornata.',
    categorie: ['Pratiche Catastali'],
    href: '#contatti',
    img: 'progetto-03.jpg',
    alt: 'Pratiche catastali: planimetria con occhiali e strumenti da disegno',
  },
  {
    titolo: 'Idoneità Alloggiativa',
    localita: 'Documentazione per esigenze abitative.',
    categorie: ['Pratiche Edilizie'],
    href: '#contatti',
    img: 'progetto-04.jpg',
    alt: 'Idoneità alloggiativa: modellino di casa su un disegno tecnico',
  },
  {
    titolo: 'Piano di Sicurezza e Coordinamento',
    localita: 'Sicurezza e coordinamento cantiere.',
    categorie: ['Sicurezza e Agibilità'],
    href: '#contatti',
    img: 'progetto-05.jpg',
    alt: 'Piano di sicurezza e coordinamento: tecnici con il caschetto in cantiere',
  },
  {
    titolo: 'Segnalazione Certificata di Agibilità',
    localita: 'Agibilità conforme alla legge.',
    categorie: ['Sicurezza e Agibilità'],
    href: '#contatti',
    img: 'progetto-06.jpg',
    alt: 'Segnalazione certificata di agibilità: modellino di casa su una mano',
  },
  {
    titolo: 'Verifica Conformità Catastale',
    localita: 'Immobiliare allineato ai dati ufficiali.',
    categorie: ['Pratiche Catastali'],
    href: '#contatti',
    img: 'progetto-07.jpg',
    alt: 'Verifica conformità catastale: pianta di un appartamento e penna',
  },
  {
    titolo: 'Verifica Conformità Urbanistica',
    localita: 'Verifica conformità urbanistica e aggiornamento.',
    categorie: ['Pratiche Edilizie'],
    href: '#contatti',
    img: 'progetto-08.jpg',
    alt: 'Verifica conformità urbanistica: tavole di progetto arrotolate',
  },
  {
    titolo: 'Ristrutturazioni',
    localita: 'Progettazione degli interventi di ristrutturazione.',
    categorie: ['Pratiche Edilizie'],
    href: '#contatti',
    img: 'progetto-09.jpg',
    alt: 'Ristrutturazioni: rullo che tinteggia una parete',
  },
  {
    titolo: 'Pratica ENEA',
    localita: 'Incentivi per miglioramenti energetici.',
    categorie: ['Certificazione Energetica'],
    href: '#contatti',
    img: 'progetto-10.jpg',
    alt: 'Pratica ENEA: penna e calcolatrice sui documenti',
  },
  {
    titolo: 'Planimetria e Visura Catastale',
    localita: 'Verifica e aggiornamento immobili.',
    categorie: ['Pratiche Catastali'],
    href: '#contatti',
    img: 'progetto-11.jpg',
    alt: 'Planimetria e visura catastale: metro e matita su una planimetria',
  },
  {
    titolo: "Conformità dell'impianto",
    localita: 'Certificazione sicurezza impianti.',
    categorie: ['Certificazione Energetica'],
    href: '#contatti',
    img: 'progetto-12.jpg',
    alt: "Conformità dell'impianto: tecnici davanti a una casa",
  },
];

/**
 * Le quattro categorie del filtro, nello stesso ordine degli `ambiti`.
 * Devono combaciare carattere per carattere con i `titolo` di `ambiti`.
 */
export const categorie = [
  'Pratiche Edilizie',
  'Pratiche Catastali',
  'Certificazione Energetica',
  'Sicurezza e Agibilità',
];
