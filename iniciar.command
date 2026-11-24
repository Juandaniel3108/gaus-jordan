#!/bin/zsh
# Inicia un servidor local para Álgebra Visual y abre el navegador.
# Necesario porque la aplicación usa módulos ES, que el navegador no carga
# desde file:// por políticas de seguridad.

set -e
cd "$(dirname "$0")"

PORT=8080
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo "Álgebra Visual"
echo "Servidor local: http://localhost:$PORT"
echo "Cierra esta ventana o pulsa Ctrl+C para detenerlo."
echo

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT INT TERM

sleep 1
open "http://localhost:$PORT"
wait $SERVER_PID
