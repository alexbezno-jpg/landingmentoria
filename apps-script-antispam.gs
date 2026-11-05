/**
 * PROTECCIÓN ANTI-SPAM PARA EL ENDPOINT DE LEADS (Google Apps Script)
 * ---------------------------------------------------------------------------
 * Por qué hace falta: la URL de tu Apps Script (/exec) está en el HTML de la web,
 * así que cualquiera puede enviarle peticiones POST directamente, sin pasar por
 * el formulario. Las defensas del navegador (campo trampa, tiempo mínimo) solo
 * frenan a los bots básicos. Esta capa valida y limita en el servidor.
 *
 * CÓMO INSTALARLO
 * 1) En tu script actual, RENOMBRA tu función doPost(e) a procesarLead_(datos)
 *    y haz que reciba el objeto ya convertido (en vez de leer e.postData).
 *    Debe devolver el resultado como hacía antes (por ejemplo, un JSON con ok:true).
 * 2) Pega TODO este archivo en el proyecto (archivo nuevo, p. ej. antispam.gs).
 * 3) Implementar > Gestionar implementaciones > Editar > Nueva versión > Implementar.
 *    La URL /exec no cambia.
 * 4) El token de Notion debe estar en Propiedades del script
 *    (Configuración del proyecto > Propiedades del script), NUNCA escrito en el código.
 */

var LIMITES = {
  maxBytes: 8000,          // tamaño máximo de la petición
  maxCampo: 1000,          // caracteres máximos por campo (igual que maxlength de la web)
  maxPorMinuto: 10,        // tope global de solicitudes por minuto (en este embudo es imposible superarlo a mano)
  ventanaDuplicadoSeg: 21600, // 6 h: mismo email = mismo lead (máx. de CacheService)
  maxEnlaces: 2            // más enlaces que esto en los textos libres = spam
};

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    var v = validarLead_(raw);
    if (!v.ok) return json_({ ok: true });             // respuesta neutra: no damos pistas al bot
    if (limiteSuperado_()) return json_({ ok: true }); // idem
    var clave = 'dup_' + hash_(v.datos.m.toLowerCase());
    var cache = CacheService.getScriptCache();
    if (cache.get(clave)) return json_({ ok: true });   // duplicado reciente
    var resultado = procesarLead_(v.datos);             // ← TU lógica actual (guardar en Notion)
    cache.put(clave, '1', LIMITES.ventanaDuplicadoSeg); // se marca solo si todo fue bien
    return resultado;
  } catch (err) {
    console.error(err);
    return json_({ ok: false });
  }
}

/** Valida el cuerpo. Devuelve {ok:boolean, datos?:object, motivo?:string}. */
function validarLead_(raw) {
  if (!raw || raw.length > LIMITES.maxBytes) return { ok: false, motivo: 'tamaño' };
  var d;
  try { d = JSON.parse(raw); } catch (e) { return { ok: false, motivo: 'json' }; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, motivo: 'formato' };

  var obligatorios = ['n', 'a', 't', 'm', 'dedicacion', 'objetivo', 'motivo', 'inversion', 'cuando'];
  for (var i = 0; i < obligatorios.length; i++) {
    var k = obligatorios[i];
    if (typeof d[k] !== 'string' || !d[k].trim()) return { ok: false, motivo: 'falta ' + k };
  }
  if (d.consentimiento !== true) return { ok: false, motivo: 'consentimiento' };

  var limpio = { consentimiento: true };
  var claves = obligatorios;
  for (var j = 0; j < claves.length; j++) {
    var val = String(d[claves[j]]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
    if (val.length > LIMITES.maxCampo) return { ok: false, motivo: 'largo ' + claves[j] };
    limpio[claves[j]] = val;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio.m)) return { ok: false, motivo: 'email' };
  if (!/^\+\d{1,3} ?\d{6,12}$/.test(limpio.t)) return { ok: false, motivo: 'telefono' };

  var textos = [limpio.dedicacion, limpio.objetivo, limpio.motivo].join(' ');
  if (contarEnlaces_(textos) > LIMITES.maxEnlaces) return { ok: false, motivo: 'enlaces' };
  if (/<\s*\/?\s*(script|a|iframe|img)\b/i.test(textos + ' ' + limpio.n + ' ' + limpio.a)) return { ok: false, motivo: 'html' };
  return { ok: true, datos: limpio };
}

function contarEnlaces_(t) {
  var m = String(t).match(/(https?:\/\/|www\.)/gi);
  return m ? m.length : 0;
}

/** Tope global por minuto con candado (CacheService no es atómico). */
function limiteSuperado_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return true;
  try {
    var cache = CacheService.getScriptCache();
    var k = 'rl_' + Math.floor(Date.now() / 60000);
    var n = Number(cache.get(k) || 0) + 1;
    cache.put(k, String(n), 120);
    return n > LIMITES.maxPorMinuto;
  } finally { lock.releaseLock(); }
}

function hash_(s) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s);
  return b.map(function (x) { return ('0' + (x & 0xff).toString(16)).slice(-2); }).join('');
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
