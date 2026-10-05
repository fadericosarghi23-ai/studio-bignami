/**
 * Smoke test su Chrome vero.
 *
 * Serve perche' il Browser pane, quando e' nascosto, non consegna eventi di
 * scroll, congela rAF, IntersectionObserver e le animazioni CSS, e non
 * ridipinge gli elementi fissi: li' una navbar o un reveal possono sembrare
 * rotti anche quando funzionano, e viceversa.
 *
 *   npm run preview          (in un altro terminale: serve la build su 4701)
 *   npm run smoke            (contro http://localhost:4701/)
 *   node scripts/smoke-nav.mjs http://localhost:4700/   (contro il dev server)
 */
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const URL_BASE = process.argv[2] ?? 'http://localhost:4701/';
const SEZIONI = ['mission', 'metodo', 'ambiti', 'portfolio', 'contatti'];
/* La voce "Contatti" scorre in fondo alla landing; la scheda col form la apre
   il pulsante di contatto in navbar. */
const SCHEDE = ['mission', 'metodo', 'ambiti', 'portfolio'];

const esiti = [];
const check = (nome, ok, dettaglio = '') => {
  esiti.push({ nome, ok });
  console.log(`${ok ? 'OK  ' : 'KO  '} ${nome}${dettaglio ? ' — ' + dettaglio : ''}`);
};
const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
const browser = await puppeteer.connect({
  browserURL: `http://127.0.0.1:${chrome.port}`,
  defaultViewport: { width: 1440, height: 900 },
});

try {
  const page = (await browser.pages())[0] ?? (await browser.newPage());
  const errori = [];
  page.on('pageerror', (e) => errori.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errori.push(m.text()));

  await page.goto(URL_BASE, { waitUntil: 'networkidle0' });
  await attendi(1200);

  const stato = () =>
    page.evaluate((sez) => {
      const hdr = document.getElementById('site-header');
      const visibili = sez.filter((id) => getComputedStyle(document.getElementById(id)).display !== 'none');
      const soloLanding = [...document.querySelectorAll('[data-landing-only]')];
      return {
        view: document.body.dataset.view,
        scrollY: Math.round(window.scrollY),
        headerBg: getComputedStyle(hdr).backgroundColor,
        // hero e marquee esistono solo nella landing: in vista scheda devono
        // sparire, altrimenti la scheda si apre sotto una schermata di hero.
        landingOnlyVisibili: soloLanding
          .filter((el) => getComputedStyle(el).display !== 'none')
          .map((el) => el.id || el.getAttribute('aria-label') || 'senza-nome'),
        tabOnlyVisibili: [...document.querySelectorAll('[data-tab-only]')].filter(
          (el) => getComputedStyle(el).display !== 'none'
        ).length,
        visibili,
        // Conta solo cio' che e' gia' nel viewport: sotto la piega i reveal
        // devono restare chiusi finche' non ci si scorre sopra, ed e' giusto
        // cosi'. Quello che questo controllo deve prendere e' una sezione che
        // si apre vuota.
        invisibili: visibili
          .map((id) => {
            const s = document.getElementById(id);
            const rev = [...s.querySelectorAll('[data-reveal], [data-reveal-clip]')].filter((e) => {
              const r = e.getBoundingClientRect();
              return r.top < window.innerHeight && r.bottom > 0;
            });
            const fuori = rev.filter((e) => getComputedStyle(e).opacity === '0');
            return fuori.length ? `${id} ${fuori.length}/${rev.length}` : null;
          })
          .filter(Boolean),
        attiva: [...document.querySelectorAll('header nav a[aria-current="true"]')]
          .filter((a) => !a.closest('#mobile-nav'))
          .map((a) => a.textContent.trim()),
      };
    }, SEZIONI);

  // 1. Vista iniziale: la landing completa
  let s = await stato();
  check('vista iniziale: landing con tutte e 5 le sezioni', s.view === 'landing' && s.visibili.length === 5, s.visibili.join(','));
  check('in cima: navbar trasparente sulla foto', s.headerBg === 'rgba(0, 0, 0, 0)', s.headerBg);

  // Scorrendo la landing la navbar non deve evidenziare niente: le sue voci
  // aprono una scheda, non dicono dove sei.
  const spia = await page.evaluate(async () => {
    const doc = document.documentElement;
    let acceseMai = 0;
    for (let y = 0; y <= doc.scrollHeight - innerHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
      acceseMai += [...document.querySelectorAll('header nav a[aria-current="true"]')].filter(
        (a) => !a.closest('#mobile-nav')
      ).length;
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
    return acceseMai;
  });
  check('landing: scorrendo non si evidenzia nessuna voce', spia === 0, `${spia} evidenziazioni`);
  check(
    'landing: solo introduzioni, niente contenuto pieno delle schede',
    s.tabOnlyVisibili === 0,
    `${s.tabOnlyVisibili} blocchi di scheda a video`
  );

  // 2. Il carosello fa il giro dei progetti
  const caro = await page.evaluate(async () => {
    const attiva = () =>
      [...document.querySelectorAll('[data-slide]')].findIndex((s) => s.classList.contains('is-current'));
    const primo = attiva();
    document.querySelectorAll('[data-slide-punto]')[3].click();
    await new Promise((r) => setTimeout(r, 300));
    return {
      slide: document.querySelectorAll('[data-slide]').length,
      primo,
      dopoClick: attiva(),
      puntiAttivi: document.querySelectorAll('[data-slide-punto].is-current').length,
    };
  });
  check('carosello: una slide per progetto', caro.slide === 6, `${caro.slide} slide`);
  check(
    'carosello: i comandi cambiano progetto',
    caro.primo !== caro.dopoClick && caro.dopoClick === 3 && caro.puntiAttivi === 1,
    `slide ${caro.primo} -> ${caro.dopoClick}`
  );

  const auto = await page.evaluate(async () => {
    const attiva = () =>
      [...document.querySelectorAll('[data-slide]')].findIndex((s) => s.classList.contains('is-current'));
    const prima = attiva();
    await new Promise((r) => setTimeout(r, 8000)); // il giro e' ogni 7 secondi
    return { prima, dopo: attiva() };
  });
  check('carosello: gira da solo dopo 7 secondi', auto.prima !== auto.dopo, `slide ${auto.prima} -> ${auto.dopo}`);

  // 3. Ogni voce della navbar apre la sua scheda, senza scorrere la landing
  await page.evaluate(() => {
    window.__reloads = 0;
    addEventListener('beforeunload', () => window.__reloads++);
  });

  for (const id of SCHEDE) {
    await page.evaluate((h) => {
      const a = [...document.querySelectorAll(`header nav a[data-nav-link="${h}"]`)].find(
        (x) => !x.closest('#mobile-nav')
      );
      a.click();
    }, '#' + id);
    await attendi(1700);
    s = await stato();
    const soloLei = s.visibili.length === 1 && s.visibili[0] === id;
    check(
      `scheda #${id}: sola, col contenuto pieno, niente hero sopra`,
      soloLei &&
        s.view === 'tab' &&
        s.scrollY === 0 &&
        s.invisibili.length === 0 &&
        s.landingOnlyVisibili.length === 0 &&
        s.tabOnlyVisibili > 0 &&
        s.attiva.length === 1, // nelle schede la voce attiva c'e', ed e' una sola
      `visibili ${s.visibili.join(',')} · scrollY ${s.scrollY}` +
        (s.landingOnlyVisibili.length ? ` · rimasti a video: ${s.landingOnlyVisibili.join(',')}` : '') +
        (s.invisibili.length ? ` · invisibili ${s.invisibili.join(' ')}` : '')
    );
  }

  const reloads = await page.evaluate(() => window.__reloads);
  check('nessun ricaricamento di pagina', reloads === 0, `${reloads}`);

  // 4. Il logo riporta alla landing, con tutte le sezioni ancora piene
  await page.evaluate(() => document.querySelector('a[data-nav-home]').click());
  await attendi(1800);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  await attendi(900);
  s = await stato();
  check('ritorno landing: tutte e 5 le sezioni', s.view === 'landing' && s.visibili.length === 5, s.visibili.join(','));
  check(
    'ritorno landing: hero, marquee e anteprime di nuovo a video',
    s.landingOnlyVisibili.includes('hero') &&
      s.landingOnlyVisibili.some((x) => x.includes('Specializzazioni')) &&
      s.tabOnlyVisibili === 0,
    `${s.landingOnlyVisibili.length} blocchi landing · ${s.tabOnlyVisibili} blocchi scheda`
  );
  check('ritorno landing: nessuna sezione rimasta invisibile', s.invisibili.length === 0, s.invisibili.join(' · '));
  check('navbar solida dopo lo scroll', s.headerBg === 'rgb(255, 255, 255)', s.headerBg);

  // 4a. Il Metodo scorre in orizzontale a pagina bloccata
  await page.evaluate(() => {
    const a = [...document.querySelectorAll('header nav a[data-nav-link="#metodo"]')].find(
      (x) => !x.closest('#mobile-nav')
    );
    a.click();
  });
  await attendi(2000);
  const metodo = await page.evaluate(async () => {
    const sez = document.getElementById('metodo');
    const b = sez.querySelector('[data-binario]');
    const barra = sez.querySelector('[data-binario-avanzamento]');
    const prima = getComputedStyle(b).transform;
    for (let y = 0; y < 1600; y += 200) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 140));
    }
    await new Promise((r) => setTimeout(r, 700));
    return {
      largo: b.scrollWidth > window.innerWidth,
      mosso: prima !== getComputedStyle(b).transform,
      barra: barra.style.width || '0%',
    };
  });
  check('metodo: il binario eccede la finestra', metodo.largo);
  check('metodo: scorre in orizzontale con la barra', metodo.mosso && metodo.barra !== '0%', `barra ${metodo.barra}`);

  await page.evaluate(() => document.querySelector('a[data-nav-home]').click());
  await attendi(1700);

  // Il binario e' il linguaggio comune delle quattro sezioni di contenuto
  const binari = await page.evaluate(() =>
    ['mission', 'metodo', 'ambiti', 'portfolio'].filter(
      (id) => document.getElementById(id).querySelector('[data-binario-scena]')
    )
  );
  check(
    'binario in metodo e ambiti (schede) e in progetti (anteprima landing)',
    ['metodo', 'ambiti', 'portfolio'].every((x) => binari.includes(x)),
    binari.join(',')
  );

  // La landing illustra i progetti con quattro foto sullo stesso binario
  const anteprimaProgetti = await page.evaluate(() => {
    const b = document.querySelector('#portfolio [data-landing-only] [data-binario]');
    return { pannelli: b ? b.querySelectorAll(':scope > li').length : 0, foto: b ? b.querySelectorAll('img').length : 0 };
  });
  check('landing: quattro progetti con foto sul binario', anteprimaProgetti.pannelli === 4 && anteprimaProgetti.foto === 4, `${anteprimaProgetti.pannelli} pannelli, ${anteprimaProgetti.foto} foto`);

  // Il binario bloccato deve restare dentro la finestra. Con trigger e pin
  // sullo stesso elemento, ScrollTrigger ci infila sotto il proprio spacer e
  // spinge il riquadro fuori schermo: la sezione appare vuota.
  const dentro = await page.evaluate(async () => {
    const scena = document.querySelector('#portfolio [data-landing-only] [data-binario-scena]');
    const pin = scena.querySelector('[data-binario-pin]');
    const b = scena.querySelector('[data-binario]');
    const meta = window.scrollY + scena.getBoundingClientRect().top + 500;
    for (let y = window.scrollY; y < meta; y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, meta);
    await new Promise((r) => setTimeout(r, 900));
    return {
      pinTop: Math.round(pin.getBoundingClientRect().top),
      binarioTop: Math.round(b.getBoundingClientRect().top),
      finestra: window.innerHeight,
      fissato: getComputedStyle(pin).position === 'fixed',
    };
  });
  check(
    'landing: il binario bloccato resta dentro la finestra',
    dentro.binarioTop >= 0 && dentro.binarioTop < dentro.finestra,
    `binario a ${dentro.binarioTop}px, riquadro a ${dentro.pinTop}px (finestra ${dentro.finestra})`
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await attendi(700);

  await page.evaluate(() => document.querySelector('a[data-nav-home]').click());
  await attendi(1700);

  // 4b. Servizi: tutti e dodici con il filtro
  await page.evaluate(() => {
    const a = [...document.querySelectorAll('header nav a[data-nav-link="#portfolio"]')].find(
      (x) => !x.closest('#mobile-nav')
    );
    a.click();
  });
  await attendi(1800);
  const vetrina = await page.evaluate(async () => {
    const griglia = document.querySelector('[data-griglia]');
    const tutte = griglia.querySelectorAll(':scope > li').length;
    const bottoni = [...document.querySelectorAll('[data-filtro]')];
    const cat = bottoni[1].dataset.filtro;
    bottoni[1].click();
    await new Promise((r) => setTimeout(r, 400));
    const dopo = [...griglia.querySelectorAll(':scope > li')].filter((li) => !li.hasAttribute('hidden'));
    const giuste = dopo.every((li) => (li.dataset.categorie || '').split('|').includes(cat));
    bottoni[0].click();
    await new Promise((r) => setTimeout(r, 300));
    return {
      tutte,
      filtri: bottoni.length,
      cat,
      dopo: dopo.length,
      giuste,
      tornate: [...griglia.querySelectorAll(':scope > li')].filter((li) => !li.hasAttribute('hidden')).length,
      conteggio: document.querySelector('[data-conteggio]').textContent.trim(),
    };
  });
  check('servizi: ci sono tutti e dodici', vetrina.tutte === 12, `${vetrina.tutte} servizi`);
  check('progetti: cinque filtri (tutti + 4 categorie)', vetrina.filtri === 5, `${vetrina.filtri}`);
  check('progetti: il filtro mostra solo la categoria scelta', vetrina.dopo > 0 && vetrina.giuste, `${vetrina.cat}: ${vetrina.dopo}`);
  check('servizi: "Tutti" li rimette tutti', vetrina.tornate === 12, `${vetrina.tornate}`);

  // 4d. Contatti: il form c'e' e valida
  await page.evaluate(() => {
    const a = [...document.querySelectorAll('header nav a[data-nav-link="#contatti"]')].find(
      (x) => !x.closest('#mobile-nav')
    );
    a.click();
  });
  await attendi(1800);
  const modulo = await page.evaluate(async () => {
    const f = document.querySelector('[data-form-contatti]');
    f.querySelector('button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 300));
    return {
      campi: f.querySelectorAll('input:not([type=checkbox]):not([tabindex]), textarea').length,
      errori: f.querySelectorAll('.campo-errore').length,
      esito: f.querySelector('[data-form-esito]').textContent.trim(),
    };
  });
  check('contatti: il form ha i suoi quattro campi', modulo.campi === 4, `${modulo.campi} campi`);
  check('contatti: form vuoto non parte e segnala', modulo.errori > 0 && modulo.esito !== '', `${modulo.errori} errori · "${modulo.esito}"`);

  await page.evaluate(() => document.querySelector('a[data-nav-home]').click());
  await attendi(1700);

  // 4e. Contatti: la voce scorre, il pulsante apre la scheda col form
  await page.evaluate(() => document.querySelector('a[data-nav-home]').click());
  await attendi(1700);
  const gesti = await page.evaluate(async () => {
    const voce = [...document.querySelectorAll('header nav a[data-nav-scroll]')].find(
      (x) => !x.closest('#mobile-nav')
    );
    voce.click();
    await new Promise((r) => setTimeout(r, 2000));
    const dopoVoce = {
      view: document.body.dataset.view,
      top: Math.round(document.getElementById('contatti').getBoundingClientRect().top),
      form: !!document.querySelector('[data-form-contatti]')?.getClientRects().length,
    };

    document.querySelector('.tel-card').click();
    await new Promise((r) => setTimeout(r, 2000));
    const dopoBottone = {
      view: document.body.dataset.view,
      form: !!document.querySelector('[data-form-contatti]')?.getClientRects().length,
    };
    return { dopoVoce, dopoBottone };
  });
  check(
    'navbar "Contatti": scorre in fondo alla landing, niente scheda',
    gesti.dopoVoce.view === 'landing' && gesti.dopoVoce.top >= 0 && gesti.dopoVoce.top < 160 && !gesti.dopoVoce.form,
    `vista ${gesti.dopoVoce.view}, sezione a ${gesti.dopoVoce.top}px, form ${gesti.dopoVoce.form ? 'visibile' : 'assente'}`
  );
  check(
    'pulsante di contatto in navbar: apre la scheda con il form',
    gesti.dopoBottone.view === 'tab' && gesti.dopoBottone.form,
    `vista ${gesti.dopoBottone.view}, form ${gesti.dopoBottone.form ? 'visibile' : 'assente'}`
  );

  // 5. La mappa e' quella vera di Google, tinta coi colori della palette
  const mappa = await page.evaluate(() => {
    const f = document.querySelector('.mappa-frame');
    return {
      src: f?.getAttribute('src') ?? '',
      lazy: f?.getAttribute('loading') ?? '',
      filtro: f ? getComputedStyle(f).filter : '',
    };
  });
  check(
    'mappa: embed di Google Maps presente',
    mappa.src.includes('google.com/maps') &&
      mappa.src.includes('output=embed') &&
      // la query e' l'indirizzo dello studio; va bene anche una coppia lat,lng
      /[?&]q=[^&]+/.test(mappa.src),
    mappa.src.slice(0, 52)
  );
  check('mappa: caricata lazy e tinta con la palette', mappa.lazy === 'lazy' && mappa.filtro !== 'none' && mappa.filtro.includes('invert'), mappa.filtro.slice(0, 60));

  // 6. Menu mobile
  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle0' });
  await attendi(1200);
  const menu = await page.evaluate(async () => {
    document.getElementById('nav-toggle').click();
    await new Promise((r) => setTimeout(r, 500));
    const aperto = {
      bg: getComputedStyle(document.getElementById('site-header')).backgroundColor,
      burger: getComputedStyle(document.querySelector('.burger > span')).backgroundColor,
    };
    document.querySelector('#mobile-nav a[data-nav-link="#ambiti"]').click();
    await new Promise((r) => setTimeout(r, 1800));
    return {
      ...aperto,
      chiuso: !document.getElementById('mobile-nav').classList.contains('is-open'),
      view: document.body.dataset.view,
      visibile: getComputedStyle(document.getElementById('ambiti')).display !== 'none',
    };
  });
  check('menu mobile: navbar solida, burger scuro', menu.bg === 'rgb(255, 255, 255)' && menu.burger === 'rgb(33, 33, 33)' /* --color-ink #212121 */, `${menu.bg} / ${menu.burger}`);
  check('menu mobile: la voce apre la scheda e chiude il menu', menu.chiuso && menu.view === 'tab' && menu.visibile);

  check('nessun errore in console', errori.length === 0, errori.slice(0, 3).join(' | '));
} finally {
  await browser.disconnect();
  // Su Windows chrome-launcher fallisce a cancellare la sua temp dir: e' solo
  // pulizia, non deve far fallire il test.
  try {
    chrome.kill();
  } catch {
    /* ignorato */
  }
}

const falliti = esiti.filter((e) => !e.ok);
console.log(`\n${esiti.length - falliti.length}/${esiti.length} verifiche passate`);
process.exit(falliti.length ? 1 : 0);
