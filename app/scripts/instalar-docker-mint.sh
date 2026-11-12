#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "✔ Docker ya está instalado: $(docker --version)"
  exit 0
fi

. /etc/os-release
CODENAME="${UBUNTU_CODENAME:-}"
if [ -z "$CODENAME" ]; then
  echo "✘ No se encontró UBUNTU_CODENAME en /etc/os-release. ¿Es Linux Mint o Ubuntu?" >&2
  exit 1
fi
echo "→ Linux Mint ${VERSION:-} basado en Ubuntu '${CODENAME}'"

for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove -y "$pkg" >/dev/null 2>&1 || true
done

sudo apt-get update
sudo apt-get install -y ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo
echo "✔ Docker instalado: $(docker --version)"
echo "⚠ Cierra sesión y vuelve a entrar (o reinicia) para usar 'docker' sin sudo."
