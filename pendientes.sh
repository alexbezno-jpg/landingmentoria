#!/usr/bin/env bash
# Muestra lo que falta por completar antes de publicar. Ejecútalo desde la raíz del proyecto:
#   bash scripts/pendientes.sh
cd "$(dirname "$0")/.." || exit 1
echo "== Datos legales sin completar (COMPLETAR) =="
grep -rn --include='*.html' "COMPLETAR" . || echo "OK"
echo
echo "== Dominio sin cambiar (TU-DOMINIO) =="
grep -rn --include='*.html' --include='*.xml' --include='*.txt' "TU-DOMINIO" . | cut -c1-140 || true
echo
echo "== ID de GA4 sin poner =="
grep -n "G-XXXXXXXXXX" consent.js || echo "OK"
