/*! Consentimiento de cookies + Google Analytics 4 · Fernández & Co
 *  GA4 NO se carga hasta que la persona pulsa "Aceptar".
 *  Se incluye en todas las páginas con:  <script src="/consent.js" defer></script>
 */
(function () {
  'use strict';

  // ► PEGA AQUÍ tu ID de medición de GA4 (Admin > Flujos de datos > ID de medición).
  //   Formato: G-XXXXXXXXXX. Mientras tenga las X, no se carga nada de Google.
  var GA_ID = 'G-XXXXXXXXXX';

  var KEY = 'fco_cookie_consent_v1';          // se guarda en localStorage (solo la elección)
  var MAX_AGE_MS = 365 * 24 * 3600 * 1000;    // se vuelve a preguntar pasados 12 meses
  var gaOn = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // Por defecto, todo denegado (Consent Mode v2)
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  function idValido() { return /^G-[A-Z0-9]{6,}$/.test(GA_ID) && !/^G-X+$/.test(GA_ID); }

  function cargarGA() {
    if (gaOn || !idValido()) return;
    gaOn = true;
    window['ga-disable-' + GA_ID] = false;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_flags: 'SameSite=Lax;Secure'
    });
  }

  function borrarCookiesGA() {
    var host = location.hostname, partes = host.split('.');
    var dominios = ['', host, '.' + host];
    if (partes.length > 2) dominios.push('.' + partes.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^_ga(_|$)/.test(n)) {
        dominios.forEach(function (d) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function revocarGA() {
    if (idValido()) window['ga-disable-' + GA_ID] = true;
    if (gaOn) gtag('consent', 'update', { analytics_storage: 'denied' });
    borrarCookiesGA();
  }

  function leer() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.v === 'granted' || v.v === 'denied') && Date.now() - v.t < MAX_AGE_MS) return v.v;
    } catch (e) {}
    return null;
  }
  function guardar(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  // Eventos para GA4 (solo se envían si hay consentimiento). Nunca pases datos personales.
  window.fcoTrack = function (nombre, params) {
    try {
      if (gaOn && idValido() && !window['ga-disable-' + GA_ID]) gtag('event', nombre, params || {});
    } catch (e) {}
  };

  // Clics en WhatsApp / Instagram (solo el nombre del evento, sin la URL)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('wa.me/') > -1) window.fcoTrack('click_whatsapp');
    else if (h.indexOf('instagram.com/') > -1) window.fcoTrack('click_instagram');
  }, true);

  // ---- Banner ----
  var CSS =
    '#fcoCk{position:fixed;z-index:300;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));' +
    'width:calc(100% - 24px);max-width:560px;background:#121A2B;color:#F1EDE3;border:1px solid rgba(241,237,227,.14);' +
    'border-radius:18px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.55);' +
    'font:400 14px/1.5 "Space Grotesk",system-ui,-apple-system,sans-serif}' +
    '#fcoCk p{margin:0}' +
    '#fcoCk .t{font:600 16px/1.2 "Fraunces",Georgia,serif;margin-bottom:6px}' +
    '#fcoCk .d{color:#C3C7D6}' +
    '#fcoCk a{color:#D8B87F;text-decoration:underline;text-underline-offset:3px}' +
    '#fcoCk .b{display:flex;gap:10px;margin-top:14px}' +
    '#fcoCk button{flex:1;height:46px;border-radius:12px;border:1px solid #BD9760;background:transparent;color:#D8B87F;' +
    'font:600 14.5px "Space Grotesk",system-ui,sans-serif;cursor:pointer}' +
    '#fcoCk button[data-ck="granted"]{background:#BD9760;color:#0A0F1C}' +
    '#fcoCk button:hover{filter:brightness(1.1)}' +
    '#fcoCk button:focus-visible,#fcoCk a:focus-visible{outline:2px solid #D8B87F;outline-offset:3px}';

  function mostrarBanner() {
    if (document.getElementById('fcoCk')) return;
    if (!document.getElementById('fcoCkCss')) {
      var st = document.createElement('style');
      st.id = 'fcoCkCss';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var b = document.createElement('div');
    b.id = 'fcoCk';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-modal', 'false');
    b.setAttribute('aria-labelledby', 'fcoCkT');
    b.setAttribute('aria-describedby', 'fcoCkD');
    b.innerHTML =
      '<p class="t" id="fcoCkT">Cookies de analítica</p>' +
      '<p class="d" id="fcoCkD">Esta web usa Google Analytics para entender cómo se usa y mejorarla. ' +
      'Solo se activa si lo aceptas y puedes cambiarlo cuando quieras. ' +
      '<a href="/cookies">Más información</a></p>' +
      '<div class="b"><button type="button" data-ck="denied">Rechazar</button>' +
      '<button type="button" data-ck="granted">Aceptar</button></div>';
    b.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-ck');
      if (!v) return;
      guardar(v);
      if (v === 'granted') cargarGA(); else revocarGA();
      b.parentNode.removeChild(b);
    });
    document.body.appendChild(b);
  }

  // Botón "Configurar cookies" (en el pie de cada página)
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (!t) return;
    e.preventDefault();
    mostrarBanner();
  });

  function iniciar() {
    var c = leer();
    if (c === 'granted') cargarGA();
    else if (c === null) mostrarBanner();
    if (!idValido() && window.console) console.info('[GA4] Falta el ID de medición en /consent.js (GA_ID). Hasta entonces no se carga Google Analytics.');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
