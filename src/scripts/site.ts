import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Solo in sviluppo: handle per ispezionare/guidare le animazioni dai devtools.
if (import.meta.env.DEV) {
  (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
}

/* =========================================================================
   1. Lenis: smooth scroll della vista landing.
   Con prefers-reduced-motion attivo Lenis non parte: lo scroll resta nativo.
========================================================================= */
let lenis: Lenis | null = null;

if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', () => {
    ScrollTrigger.update();
    // Anche da qui, non solo dall'evento nativo: con lo smooth scroll attivo
    // e' Lenis a guidare la posizione, e l'evento nativo puo' non arrivare.
    updateScrolledFlag();
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  if (import.meta.env.DEV) {
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
  }
}

/* =========================================================================
   2. Elementi di pagina
========================================================================= */
const header = document.getElementById('site-header')!;
const curtain = document.getElementById('view-curtain');
const curtainLayers = curtain ? Array.from(curtain.querySelectorAll<HTMLElement>('span')) : [];
const indicator = document.getElementById('nav-indicator');
const navLinkEls = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
const desktopLinks = navLinkEls.filter((el) => !el.closest('#mobile-nav'));

const sections = Array.from(new Set(navLinkEls.map((el) => el.dataset.navLink!)))
  .map((hash) => ({ hash, el: document.querySelector<HTMLElement>(hash) }))
  .filter((s): s is { hash: string; el: HTMLElement } => Boolean(s.el));

const navHeight = () => header.offsetHeight;

/* =========================================================================
   3. Reveal on-scroll
   La visibilita' del contenuto non dipende da GSAP: basta la classe .is-in,
   che mette un IntersectionObserver. Prima bastava che ScrollTrigger non
   scattasse per lasciare intere sezioni a opacity 0, cioe' pagine vuote.
========================================================================= */
document.documentElement.classList.add('js');

const tuttiIReveal = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-clip]'));

const osservatore =
  'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(
        (voci, obs) => {
          voci.forEach((v) => {
            if (!v.isIntersecting) return;
            v.target.classList.add('is-in');
            obs.unobserve(v.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px' }
      )
    : null;

/** Rimette sotto osservazione quello che non e' ancora stato scoperto. */
function armaReveal() {
  if (!osservatore) {
    tuttiIReveal().forEach((el) => el.classList.add('is-in'));
    return;
  }
  tuttiIReveal().forEach((el) => {
    if (!el.classList.contains('is-in')) osservatore.observe(el);
  });
}

/** Scopre subito cio' che e' gia' a video, senza aspettare l'osservatore. */
function rivelaInViewport() {
  tuttiIReveal().forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
  });
}

// Rete di sicurezza: se per qualunque motivo l'osservatore non scatta, il
// contenuto non puo' restare nascosto. Meglio senza animazione che invisibile.
window.setTimeout(rivelaInViewport, 2500);

/* =========================================================================
   4. Due viste: la landing che scorre e le schede della navbar
   La vista iniziale e' la landing completa. Ogni voce della navbar apre
   invece la propria scheda a tutta pagina: resta a video solo quella
   sezione, senza scorrere la landing, senza cambio pagina e senza reload.
========================================================================= */
type View = 'landing' | 'tab';

const revealsOf = (scope: ParentNode) =>
  Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-clip]'));

/** Rigioca l'ingresso CSS di una sezione (hero, o scheda appena aperta). */
function replayEnter(scope: HTMLElement) {
  if (reduceMotion) return;
  const els = scope.querySelectorAll<HTMLElement>('[data-enter], [data-enter-clip], .word > span');
  els.forEach((el) => (el.style.animationName = 'none'));
  void scope.offsetWidth; // forza il reflow
  els.forEach((el) => (el.style.animationName = ''));
}

/**
 * Reveal del contenuto di una scheda appena aperta: la sezione era in
 * display:none, quindi va rigiocata a mano con uno stagger.
 */
function playSectionIn(section: HTMLElement) {
  replayEnter(section);
  const els = revealsOf(section);

  if (reduceMotion) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  els.forEach((el) => {
    el.classList.remove('is-in');
    el.style.removeProperty('--reveal-delay');
  });
  void section.offsetWidth;
  els.forEach((el, i) => el.style.setProperty('--reveal-delay', `${0.05 + i * 0.05}s`));

  // Doppia sicurezza: rAF per far partire la transizione, piu' un timeout nel
  // caso il frame non arrivi. Il contenuto non puo' restare nascosto: e' il
  // guasto che aveva gia' svuotato le sezioni una volta.
  const mostra = () => els.forEach((el) => el.classList.add('is-in'));
  requestAnimationFrame(mostra);
  window.setTimeout(mostra, 400);
}

/** Sipario a due strati: copre, lascia scambiare il contenuto, si ritira. */
function sweepCurtain(swap: () => void) {
  if (reduceMotion || !curtainLayers.length) {
    swap();
    return;
  }

  gsap.killTweensOf(curtainLayers);
  gsap.set(curtainLayers, { scaleY: 0, transformOrigin: 'bottom' });

  gsap
    .timeline()
    .to(curtainLayers, { scaleY: 1, duration: 0.4, ease: 'power3.inOut', stagger: 0.07 })
    .add(swap)
    .set(curtainLayers, { transformOrigin: 'top' })
    .to(curtainLayers, { scaleY: 0, duration: 0.5, ease: 'power3.inOut', stagger: 0.07 }, '+=0.05');
}

let currentView: View = 'landing';
let currentHash = '';

function applyView(view: View, hash: string) {
  currentView = view;
  currentHash = hash;
  document.body.dataset.view = view;

  sections.forEach(({ hash: h, el }) =>
    el.classList.toggle('is-active', view === 'tab' && h === hash)
  );

  if (view === 'tab') {
    // Le schede non scorrono fra loro: si riparte sempre dall'alto.
    lenis?.stop();
    window.scrollTo(0, 0);
    lenis?.start();
  }

  setActive(view === 'tab' ? hash : '');
  updateScrolledFlag();
  armaReveal();
  ScrollTrigger.refresh();
  // Il binario orizzontale del Metodo esiste solo dentro la sua scheda:
  // finche' e' in display:none misura zero, quindi va rimontato adesso.
  if (typeof rimontaBinari === 'function') rimontaBinari();
}

/**
 * Verifica che le regole delle schede siano davvero applicate. Se il foglio di
 * stile in pagina e' vecchio (succede col dev server dopo certe modifiche),
 * impostare data-view non nasconderebbe nulla: il click sulla navbar non
 * avrebbe alcun effetto visibile. In quel caso si scorre, che e' sempre meglio
 * di un click morto.
 */
function schedeAttive(hash: string) {
  return sections.some(
    ({ hash: h, el }) => h !== hash && getComputedStyle(el).display === 'none'
  );
}

/** Apre la scheda di una voce della navbar. */
function openTab(hash: string, { instant = false } = {}) {
  const section = document.querySelector<HTMLElement>(hash);
  if (!section) return;
  if (currentView === 'tab' && currentHash === hash) return;

  const swap = () => {
    applyView('tab', hash);

    if (!schedeAttive(hash)) {
      // Ripiego: senza le regole delle schede la pagina resta la landing.
      applyView('landing', '');
      scrollToSection(hash);
      return;
    }

    playSectionIn(section);
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
  };

  if (instant) swap();
  else sweepCurtain(swap);
}

/** Torna alla landing completa che scorre. */
function openLanding({ instant = false } = {}) {
  if (currentView === 'landing') {
    if (lenis && !instant) lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo(0, 0);
    return;
  }

  const swap = () => {
    applyView('landing', '');
    window.scrollTo(0, 0);
    const hero = document.getElementById('hero');
    if (hero) replayEnter(hero);
    // Tornando indietro le sezioni erano gia' state svuotate una volta:
    // qui si riarma l'osservatore e si scopre subito cio' che e' a video.
    armaReveal();
    rivelaInViewport();
  };

  if (instant) swap();
  else sweepCurtain(swap);
}

/** Scroll interno alla landing: lo usano le CTA, non la navbar. */
function scrollToSection(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { duration: 1.1 });
  else target.scrollIntoView({ behavior: 'auto', block: 'start' });
}

document.querySelectorAll<HTMLAnchorElement>('a[data-nav-anchor]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return;
    if (!document.querySelector(hash)) return;

    event.preventDefault();
    closeMobileNav();

    // Il logo riporta alla landing completa.
    if (link.hasAttribute('data-nav-home')) {
      openLanding();
      if (window.location.hash) history.pushState(null, '', window.location.pathname);
      return;
    }

    /*
     * Voce "Contatti": porta in fondo alla landing, non apre la scheda. Il
     * form sta dietro il pulsante di contatto in navbar, che invece la apre.
     */
    if (link.hasAttribute('data-nav-scroll')) {
      if (currentView === 'tab') {
        openLanding();
        window.setTimeout(() => scrollToSection(hash), 950);
      } else {
        scrollToSection(hash);
      }
      if (window.location.hash !== hash) history.pushState(null, '', hash);
      return;
    }

    // Le CTA dentro la landing scorrono; la navbar apre la scheda.
    if (!link.hasAttribute('data-nav-link') && currentView === 'landing') {
      scrollToSection(hash);
      return;
    }

    openTab(hash);
    if (window.location.hash !== hash) history.pushState(null, '', hash);
  });
});

// Back/forward del browser, sempre senza reload.
window.addEventListener('popstate', () => {
  const hash = window.location.hash;
  if (hash && sections.some((s) => s.hash === hash)) openTab(hash, { instant: true });
  else openLanding({ instant: true });
});

/* =========================================================================
   5. Stato attivo della voce + indicatore scorrevole
========================================================================= */
let activeHash = '';

function moveIndicator(link: HTMLAnchorElement | null) {
  if (!indicator) return;
  if (!link) {
    gsap.to(indicator, { opacity: 0, duration: 0.25 });
    return;
  }
  const navBox = indicator.parentElement!.getBoundingClientRect();
  const box = link.getBoundingClientRect();
  gsap.to(indicator, {
    x: box.left - navBox.left,
    width: box.width,
    opacity: 1,
    duration: reduceMotion ? 0 : 0.45,
    ease: 'power3.out',
  });
}

function setActive(hash: string) {
  activeHash = hash;
  navLinkEls.forEach((el) => {
    if (hash && el.dataset.navLink === hash) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveIndicator(desktopLinks.find((el) => el.dataset.navLink === hash) ?? null);
}

/*
 * Nessuno scrollspy: scorrendo la landing la navbar non evidenzia niente.
 * Le sue voci non dicono "dove sei", aprono una scheda: la voce si accende
 * solo quando quella scheda e' aperta (vedi applyView).
 */

/** Sopra l'hero la navbar e' trasparente: questo flag la fa tornare bianca. */
function updateScrolledFlag() {
  document.body.toggleAttribute('data-scrolled', window.scrollY > 24);
}

window.addEventListener('scroll', updateScrolledFlag, { passive: true });
window.addEventListener('resize', () => {
  moveIndicator(desktopLinks.find((el) => el.dataset.navLink === activeHash) ?? null);
});

/* =========================================================================
   6. Menu mobile
========================================================================= */
const toggle = document.getElementById('nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

function closeMobileNav() {
  if (!toggle || !mobileNav) return;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Apri il menu di navigazione');
  mobileNav.classList.remove('is-open');
  document.body.removeAttribute('data-menu-open');
  document.body.style.overflow = '';
  lenis?.start();
}

function openMobileNav() {
  if (!toggle || !mobileNav) return;
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Chiudi il menu di navigazione');
  mobileNav.classList.add('is-open');
  // Sopra l'hero la navbar e' trasparente con i tratti del burger in bianco:
  // sul pannello bianco del menu sparirebbero. Qui torna solida.
  document.body.setAttribute('data-menu-open', '');
  document.body.style.overflow = 'hidden';
  lenis?.stop();
}

toggle?.addEventListener('click', () => {
  toggle.getAttribute('aria-expanded') === 'true' ? closeMobileNav() : openMobileNav();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileNav();
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 1025) closeMobileNav();
});

/* =========================================================================
   7. Carosello dell'hero: fa il giro dei progetti, uno ogni 7 secondi
========================================================================= */
const carosello = document.getElementById('hero-carosello');

if (carosello) {
  const slide = Array.from(carosello.querySelectorAll<HTMLElement>('[data-slide]'));
  const didascalie = Array.from(document.querySelectorAll<HTMLElement>('[data-slide-nome]'));
  const puntini = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-slide-punto]'));
  let indice = 0;
  let timer = 0;

  const vai = (n: number) => {
    indice = (n + slide.length) % slide.length;
    slide.forEach((el, i) => el.classList.toggle('is-current', i === indice));
    didascalie.forEach((el, i) => el.classList.toggle('is-current', i === indice));
    puntini.forEach((b, i) => {
      b.classList.toggle('is-current', i === indice);
      b.setAttribute('aria-current', i === indice ? 'true' : 'false');
    });
  };

  const ferma = () => {
    window.clearInterval(timer);
    timer = 0;
  };
  const avvia = () => {
    if (timer || reduceMotion || slide.length < 2) return;
    timer = window.setInterval(() => vai(indice + 1), 7000);
  };

  puntini.forEach((b, i) =>
    b.addEventListener('click', () => {
      vai(i);
      ferma();
      avvia(); // il click rimette il cronometro a zero
    })
  );

  // Non gira quando non si vede: scheda aperta, tab in background, hero fuori
  // schermo. Cosi' non consuma batteria ne' decodifiche inutili.
  const osservaHero = new IntersectionObserver(
    (voci) => (voci[0].isIntersecting && currentView === 'landing' ? avvia() : ferma()),
    { threshold: 0.15 }
  );
  osservaHero.observe(carosello);

  document.addEventListener('visibilitychange', () => (document.hidden ? ferma() : avvia()));

  // Le foto oltre la prima si caricano dopo il primo paint, per non rubare
  // banda all'immagine che fa da LCP.
  const caricaResto = () => {
    slide.slice(1).forEach((el) => {
      el.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((s) => {
        s.srcset = s.dataset.srcset!;
        delete s.dataset.srcset;
      });
      el.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.src = img.dataset.src!;
        delete img.dataset.src;
      });
    });
  };
  if (document.readyState === 'complete') window.setTimeout(caricaResto, 400);
  else window.addEventListener('load', () => window.setTimeout(caricaResto, 400));
}

/* =========================================================================
   8. Contatori: le cifre salgono quando entrano in scena
========================================================================= */
const contatori = Array.from(document.querySelectorAll<HTMLElement>('[data-conta]'));

if (contatori.length && !reduceMotion) {
  const osservaConti = new IntersectionObserver(
    (voci, obs) => {
      voci.forEach((v) => {
        if (!v.isIntersecting) return;
        const el = v.target as HTMLElement;
        obs.unobserve(el);
        const meta = Number(el.dataset.conta);
        gsap.fromTo(
          { n: 0 },
          { n: 0 },
          {
            n: meta,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate() {
              el.textContent = String(Math.round((this.targets()[0] as { n: number }).n));
            },
            onComplete() {
              el.textContent = String(meta);
            },
          }
        );
      });
    },
    { threshold: 0.6 }
  );
  contatori.forEach((el) => osservaConti.observe(el));
}

/* =========================================================================
   9. Binari orizzontali a pagina bloccata
   Stessa meccanica del sito di riferimento: si blocca la sezione e si trascina
   il binario di quanto eccede la larghezza della finestra, con una barra di
   avanzamento. Sotto i 1025px e con reduced-motion non si blocca niente: il
   binario resta una pila verticale e si scorre normalmente.
========================================================================= */
function montaBinari() {
  if (reduceMotion || window.innerWidth < 1025) return;

  document.querySelectorAll<HTMLElement>('[data-binario-scena]').forEach((scena) => {
    const binario = scena.querySelector<HTMLElement>('[data-binario]');
    const pin = scena.querySelector<HTMLElement>('[data-binario-pin]');
    const barra = scena.querySelector<HTMLElement>('[data-binario-avanzamento]');
    if (!binario) return;

    // La corsa si misura sulla finestra VISIBILE del binario, non sulla
    // finestra del browser: nella landing il binario dei servizi sta dentro
    // `container-content` (il pin taglia a 1140px), e misurandolo su
    // window.innerWidth la pagina ripartiva prima che passasse l'ultima card.
    const visibile = () => (pin ?? scena).clientWidth;
    const eccesso = () => Math.max(0, binario.scrollWidth - visibile());
    if (eccesso() <= 0) return;

    gsap.to(binario, {
      x: () => -eccesso(),
      ease: 'none',
      scrollTrigger: {
        // Il trigger e' il contenitore, il pin e' il figlio: sono due elementi
        // diversi di proposito. Usando lo stesso elemento per entrambi,
        // ScrollTrigger gli mette sotto il proprio spacer e lo spinge in basso
        // di tutta la corsa del binario, mandandolo fuori schermo.
        trigger: scena,
        start: () => 'top ' + navHeight() + 'px',
        end: () => '+=' + eccesso(),
        pin: pin ?? true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (barra) barra.style.width = (self.progress * 100).toFixed(2) + '%';
        },
      },
    });
  });
}

/**
 * I binari vivono anche dentro le schede: finche' la scheda e' in display:none
 * misurano zero, quindi vanno rimontati a ogni cambio vista.
 */
function rimontaBinari() {
  ScrollTrigger.getAll()
    .filter((t) => t.trigger instanceof HTMLElement && t.trigger.hasAttribute('data-binario-scena'))
    .forEach((t) => t.kill(true));
  gsap.set('[data-binario]', { clearProps: 'transform' });
  document
    .querySelectorAll<HTMLElement>('[data-binario-avanzamento]')
    .forEach((b) => (b.style.width = '0%'));
  montaBinari();
}

/* =========================================================================
   10. Filtro del portfolio
========================================================================= */
const filtri = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filtro]'));
const griglia = document.querySelector<HTMLElement>('[data-griglia]');
const conteggio = document.querySelector<HTMLElement>('[data-conteggio]');

if (filtri.length && griglia) {
  const schede = Array.from(griglia.querySelectorAll<HTMLElement>(':scope > li'));

  const applica = (cat: string) => {
    let visibili = 0;
    schede.forEach((li) => {
      const sue = (li.dataset.categorie ?? '').split('|');
      const dentro = !cat || sue.includes(cat);
      li.toggleAttribute('hidden', !dentro);
      if (dentro) visibili++;
    });
    filtri.forEach((b) => {
      const attivo = (b.dataset.filtro ?? '') === cat;
      b.classList.toggle('is-current', attivo);
      b.setAttribute('aria-pressed', attivo ? 'true' : 'false');
    });
    if (conteggio) {
      conteggio.textContent = `${visibili} ${visibili === 1 ? 'servizio' : 'servizi'}${cat ? ' in ' + cat : ''}`;
    }
    // Le schede appena mostrate non erano ancora state scoperte dall'osservatore.
    armaReveal();
    rivelaInViewport();
  };

  filtri.forEach((b) => b.addEventListener('click', () => applica(b.dataset.filtro ?? '')));
}

/* =========================================================================
   11. Form contatti

   La validazione lato client c'e' tutta ed e' quella definitiva: campi
   obbligatori, email malformata, trappola anti-bot, messaggi sotto al campo,
   focus sul primo errore.

   L'INVIO INVECE E' STACCATO, di proposito: una base non deve spedire messaggi
   da nessuna parte. Il punto in cui collegare il servizio e' segnato qui sotto.
   [[DA COMPILARE: endpoint del form]]
========================================================================= */
const form = document.querySelector<HTMLFormElement>('[data-form-contatti]');

if (form) {
  const esito = form.querySelector<HTMLElement>('[data-form-esito]');

  const segnala = (campo: HTMLInputElement | HTMLTextAreaElement, messaggio: string) => {
    campo.setAttribute('aria-invalid', 'true');
    let nota = campo.parentElement?.querySelector<HTMLElement>('.campo-errore');
    if (!nota) {
      nota = document.createElement('span');
      nota.className = 'campo-errore';
      campo.parentElement?.appendChild(nota);
    }
    nota.textContent = messaggio;
  };

  const pulisci = (campo: HTMLInputElement | HTMLTextAreaElement) => {
    campo.removeAttribute('aria-invalid');
    campo.parentElement?.querySelector('.campo-errore')?.remove();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Trappola per i bot: compilata vuol dire che non e' una persona.
    if ((form.elements.namedItem('azienda') as HTMLInputElement)?.value) return;

    const richiesti = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')
    );
    let primoErrore: HTMLInputElement | HTMLTextAreaElement | null = null;

    for (const campo of richiesti) {
      pulisci(campo);
      const vuoto = campo.type === 'checkbox' ? !(campo as HTMLInputElement).checked : !campo.value.trim();
      const emailStorta = campo.type === 'email' && campo.value.trim() !== '' && !campo.checkValidity();

      if (vuoto) {
        if (campo.type !== 'checkbox') segnala(campo, 'Questo campo serve per risponderti.');
        primoErrore ??= campo;
      } else if (emailStorta) {
        segnala(campo, 'Controlla l’indirizzo: manca qualcosa.');
        primoErrore ??= campo;
      }
    }

    if (primoErrore) {
      if (esito) esito.textContent = 'Manca qualcosa qui sopra.';
      primoErrore.focus();
      return;
    }

    /* ---------------------------------------------------------------------
       [[DA COMPILARE: endpoint del form]]

       Qui va l'invio vero. Finche' non c'e', il form si ferma e lo dice: non
       apre client di posta, non chiama nessun servizio, non perde il messaggio
       facendo finta di averlo spedito.

       Le due strade normali:

       1) servizio esterno (Formspree, Basin, Web3Forms...) — basta un fetch:
            const risposta = await fetch('URL_DELL_ENDPOINT', {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: new FormData(form),
            });
       2) Astro Action o endpoint /api con un adapter (Netlify, Vercel...),
          se le mail devono partire dal server con Resend o simili.

       In entrambi i casi: mostrare l'esito in [data-form-esito], svuotare il
       form quando va a buon fine, e lasciare un messaggio di errore quando no.
    --------------------------------------------------------------------- */
    if (esito) {
      esito.textContent =
        'Form non collegato: manca l’endpoint. Vedi site.ts, sezione 11.';
    }
  });
}

/* =========================================================================
   12. Parallax (solo estetica, mai la visibilita' del contenuto)
========================================================================= */
if (!reduceMotion) {
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax || 12);
    gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* =========================================================================
   13. Apertura del sito e stato iniziale
   Le due ante si scostano in CSS, quindi partono al primo paint e non
   spostano l'LCP. Qui si toglie solo il nodo a fine corsa.
========================================================================= */
const startHash = window.location.hash;
if (startHash && sections.some((s) => s.hash === startHash)) {
  // Link diretto a una scheda: si apre subito quella.
  applyView('tab', startHash);
  const section = document.querySelector<HTMLElement>(startHash);
  if (section) playSectionIn(section);
} else {
  applyView('landing', '');
}

const intro = document.getElementById('intro');
if (intro) {
  const anta = intro.querySelector('[data-intro-anta="dx"]');
  if (!anta || reduceMotion || getComputedStyle(anta).animationName === 'none') intro.remove();
  else anta.addEventListener('animationend', () => intro.remove(), { once: true });
}

// Immagini caricate dopo il primo calcolo: riallinea i trigger.
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
  rimontaBinari();
});

let ridimensiona = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(ridimensiona);
  ridimensiona = window.setTimeout(rimontaBinari, 200);
});
