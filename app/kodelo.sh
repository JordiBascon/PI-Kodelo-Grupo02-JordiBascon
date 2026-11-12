#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

DEV="-f docker-compose.yml -f docker-compose.dev.yml"
PROD="-f docker-compose.yml"

preparar_env() {
  if [ ! -f .env ]; then
    cp .env.example .env
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$(openssl rand -hex 16)/" .env
    sed -i "s/^DB_ROOT_PASSWORD=.*/DB_ROOT_PASSWORD=$(openssl rand -hex 16)/" .env
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
    echo "✔ Creado .env con contraseñas aleatorias"
  fi
}

diagnosticar() {
  echo
  echo "✘ KODELO no ha arrancado bien."
  if docker compose $DEV logs api 2>/dev/null | grep -q "ER_ACCESS_DENIED_ERROR"; then
    echo "  La API no puede entrar en MySQL: la contraseña del .env no coincide con la de la base de datos."
    echo "  Pasa cuando se crea un .env nuevo (por ejemplo, al descomprimir el zip en otra carpeta)."
    echo "  Solución: ./kodelo.sh reset-bd   (recrea la base de datos con los datos de ejemplo)"
  else
    echo "  Mira qué dice la API con: ./kodelo.sh logs api"
  fi
  exit 1
}

comprobar_docker() {
  if ! docker info >/dev/null 2>&1; then
    if docker info 2>&1 | grep -qi "permission denied"; then
      echo "✘ Tu usuario aún no puede usar Docker en esta terminal."
      echo "  Ejecuta: newgrp docker   y vuelve a lanzar ./kodelo.sh $1"
      echo "  Para que no vuelva a pasar, reinicia la máquina virtual una vez."
      echo "  Si sigue igual tras reiniciar: sudo usermod -aG docker \$USER  y reinicia otra vez."
    else
      echo "✘ Docker no está en marcha. Arráncalo con: sudo systemctl start docker"
    fi
    exit 1
  fi
}

avisar_copias() {
  if [ -d kodelo/app ]; then
    echo "⚠ Hay una copia de KODELO dentro de esta carpeta ($(pwd)/kodelo)."
    echo "  Descomprime siempre el zip desde ~/KODELO, no desde dentro de app."
  fi
}

puerto() { grep -E '^WEB_PORT=' .env 2>/dev/null | cut -d= -f2 || echo 8080; }

case "${1:-ayuda}" in
  instalar)  bash scripts/instalar-docker-mint.sh ;;
  dev)       comprobar_docker dev; avisar_copias; preparar_env; docker compose $DEV up -d --build || diagnosticar
             echo "✔ KODELO (desarrollo) en http://localhost:$(puerto)  ·  API en http://localhost:3000/api/health" ;;
  prod)      comprobar_docker prod; avisar_copias; preparar_env; docker compose $PROD up -d --build || diagnosticar
             echo "✔ KODELO (producción) en http://localhost:$(puerto)" ;;
  parar)     docker compose $DEV down ;;
  logs)      docker compose $DEV logs -f --tail=100 "${@:2}" ;;
  estado)    docker compose $DEV ps ;;
  bd)        docker compose $DEV exec db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' ;;
  reset-bd)  read -rp "Esto BORRA la base de datos y la recrea con db/init. ¿Seguro? (s/N) " r
             [ "$r" = "s" ] || exit 0
             docker compose $DEV down -v; docker compose $DEV up -d --build ;;
  *)         cat <<EOF
KODELO — comandos:
  ./kodelo.sh instalar   Instala Docker en Linux Mint (solo la primera vez)
  ./kodelo.sh dev        Arranca en modo desarrollo (recarga automática)
  ./kodelo.sh prod       Arranca en modo producción
  ./kodelo.sh parar      Detiene todo (los datos se conservan)
  ./kodelo.sh logs [api] Muestra los registros
  ./kodelo.sh estado     Estado de los contenedores
  ./kodelo.sh bd         Abre una consola MySQL
  ./kodelo.sh reset-bd   Borra y recrea la BD con los scripts de db/init
EOF
  ;;
esac
