# Landing Mentoría · Fernández & Co

Landing estática (un solo `index.html`) desplegada en Vercel. Los formularios envían los leads
a un Google Apps Script que los guarda en Notion.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La landing (imágenes incrustadas) |
| `terminos.html`, `privacidad.html`, `cookies.html` | Páginas legales (`/terminos`, `/privacidad`, `/cookies`) |
| `404.html` | Página 404 propia (Vercel la usa sola) |
| `consent.js` | Banner de cookies + Google Analytics 4 (solo carga con consentimiento) |
| `legal.css` | Estilos de las páginas legales y de la 404 |
| `og-image.jpg` | Imagen de vista previa al compartir el enlace (1200×630) |
| `robots.txt`, `sitemap.xml` | SEO |
| `vercel.json` | Cabeceras de seguridad y HSTS |
| `docs/`, `scripts/` | Ayudas para ti. No se publican (`.vercelignore`) |

## Antes de publicar (3 cosas)

1. **Dominio.** Sustituye el provisional `TU-DOMINIO.es`:
   `bash scripts/cambiar-dominio.sh midominio.es`
2. **Datos legales.** En `terminos.html` y `privacidad.html` busca los textos marcados en amarillo
   (`[COMPLETAR: …]`): titular, NIF/CIF, domicilio y ciudad de los juzgados.
3. **Google Analytics.** En `consent.js` cambia `GA_ID = 'G-XXXXXXXXXX'` por tu ID de medición de GA4.

Para ver qué queda pendiente: `bash scripts/pendientes.sh`

## Ajustes recomendados en GA4

- Admin > Flujos de datos > Medición mejorada: **desactiva «Clics de salida»**. Si no, GA recogería la URL de
  WhatsApp, que en el aviso de fallo lleva los datos del lead.
- Admin > Configuración de datos > Retención de datos: 2 meses.
- Marca `generate_lead` como **evento clave**.
- Eventos que envía la web (solo con consentimiento): `open_application`, `application_step`,
  `generate_lead`, `click_whatsapp`, `click_instagram`.

## Anti-spam

- En la web: campo trampa, tiempo mínimo de 5 s, un único envío por solicitud y límites de longitud.
- En el servidor: pega `docs/apps-script-antispam.gs` en tu Apps Script (instrucciones al inicio del archivo).
  Sin esto, quien conozca la URL `/exec` puede enviarle peticiones directas.

## Después de desplegar

- `curl -sI http://midominio.es` → debe responder 308 a `https://`.
- `curl -sI https://midominio.es` → debe incluir `strict-transport-security`.
- Abre una URL inventada (`/xyz`) → debe verse la 404 propia.
- Search Console > Sitemaps: envía `https://midominio.es/sitemap.xml`.
- Vista previa: pega la URL en el depurador de Facebook/Meta, LinkedIn Post Inspector y WhatsApp
  (guardan caché: si cambias la imagen, vuelve a consultarla en el depurador).
