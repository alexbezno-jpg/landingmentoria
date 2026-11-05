#!/usr/bin/env bash
# Sustituye el dominio provisional en todos los archivos. Uso:
#   bash scripts/cambiar-dominio.sh midominio.es
set -e
cd "$(dirname "$0")/.."
[ -n "$1" ] || { echo "Uso: bash scripts/cambiar-dominio.sh midominio.es"; exit 1; }
NUEVO="$1"
for f in index.html terminos.html privacidad.html cookies.html robots.txt sitemap.xml; do
  sed -i.bak "s/TU-DOMINIO\\.es/$NUEVO/g" "$f" && rm -f "$f.bak"
done
echo "Hecho. Dominio: https://$NUEVO"
