#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Instalacja sklepu na własnym serwerze (np. VPS w home.pl) z Ubuntu 22.04/24.04.
#  Uruchom jako root:   bash instaluj.sh
#  Skrypt zapyta o domenę, e-mail administratora i dostęp do repozytorium.
#  Możesz go uruchomić ponownie — wtedy zaktualizuje sklep do najnowszej wersji.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_USER=ryd
APP_DIR=/srv/ryd
BRANCH="${BRANCH:-claude/emilkowalski-ogrngp}"
CONFIG=/etc/ryd.env

[ "$(id -u)" -eq 0 ] || { echo "Uruchom jako root (sudo bash instaluj.sh)."; exit 1; }

ask() { local prompt="$1" var; read -r -p "$prompt" var; printf '%s' "$var"; }
ask_secret() { local prompt="$1" var; read -r -s -p "$prompt" var; echo >&2; printf '%s' "$var"; }

echo "== 1/7 Pakiety systemowe"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q curl git ca-certificates gnupg postgresql debian-keyring debian-archive-keyring apt-transport-https openssl

if ! command -v node >/dev/null || ! node -v | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi
corepack enable
corepack prepare pnpm@10.28.0 --activate

if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -y -q caddy
fi

echo "== 2/7 Ustawienia sklepu"
if [ ! -f "$CONFIG" ]; then
  DOMAIN=$(ask "Domena sklepu (np. sklep.pl, bez https://): ")
  ADMIN_EMAIL=$(ask "E-mail do logowania w panelu: ")
  ADMIN_PASSWORD=$(ask_secret "Hasło startowe do panelu (min. 8 znaków): ")
  DB_PASS=$(openssl rand -hex 16)
  cat > "$CONFIG" <<CFG
# Ustawienia sklepu. Po zmianie uruchom:  systemctl restart ryd
DOMAIN=$DOMAIN
NODE_ENV=production
PORT=3000
DATABASE_URI=postgres://ryd:$DB_PASS@127.0.0.1:5432/ryd
PAYLOAD_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_SERVER_URL=https://$DOMAIN
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
# Poczta — dane skrzynki z panelu home.pl (Poczta → konfiguracja programu pocztowego):
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
# Płatności online (opcjonalnie):
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CFG
  chmod 600 "$CONFIG"
  sudo -u postgres psql -qc "CREATE USER ryd WITH PASSWORD '$DB_PASS';" 2>/dev/null || sudo -u postgres psql -qc "ALTER USER ryd WITH PASSWORD '$DB_PASS';"
  sudo -u postgres psql -qc "CREATE DATABASE ryd OWNER ryd;" 2>/dev/null || true
fi
set -a; . "$CONFIG"; set +a

echo "== 3/7 Użytkownik i kod sklepu"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
if [ ! -d "$APP_DIR/.git" ]; then
  REPO=$(ask "Adres repozytorium [https://github.com/cruncherr/ryd.git]: "); REPO=${REPO:-https://github.com/cruncherr/ryd.git}
  echo "Repozytorium prywatne? Wklej token GitHub z prawem odczytu (Enter, jeśli publiczne)."
  TOKEN=$(ask_secret "Token GitHub: ")
  if [ -n "$TOKEN" ]; then REPO=${REPO/https:\/\//https:\/\/x-access-token:$TOKEN@}; fi
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  git -C "$APP_DIR" remote set-url origin "${REPO/x-access-token:*@/}"
  [ -n "$TOKEN" ] && git -C "$APP_DIR" config credential.helper "store --file=/root/.ryd-git-credentials" && \
    printf 'https://x-access-token:%s@github.com\n' "$TOKEN" > /root/.ryd-git-credentials && chmod 600 /root/.ryd-git-credentials
else
  git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout -q "$BRANCH" && git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
fi
mkdir -p "$APP_DIR/media"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo "== 4/7 Instalacja i budowa (kilka minut)"
cd "$APP_DIR"
sudo -u "$APP_USER" --preserve-env bash -c 'corepack enable >/dev/null 2>&1 || true; pnpm install --frozen-lockfile && pnpm deploy:build'

echo "== 5/7 Usługa systemowa"
cat > /etc/systemd/system/ryd.service <<SVC
[Unit]
Description=Sklep RYD
After=network.target postgresql.service

[Service]
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$CONFIG
ExecStart=/usr/bin/env pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC
systemctl daemon-reload
systemctl enable --now ryd
systemctl restart ryd

echo "== 6/7 HTTPS (certyfikat ustawi się sam)"
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN, www.$DOMAIN {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY
systemctl reload caddy || systemctl restart caddy

echo "== 7/7 Kopia zapasowa bazy (codziennie, 14 dni)"
cat > /etc/cron.daily/ryd-backup <<'BK'
#!/bin/sh
mkdir -p /var/backups/ryd
sudo -u postgres pg_dump ryd | gzip > /var/backups/ryd/baza-$(date +%F).sql.gz
tar czf /var/backups/ryd/zdjecia-$(date +%F).tgz -C /srv/ryd media
find /var/backups/ryd -mtime +14 -delete
BK
chmod +x /etc/cron.daily/ryd-backup

echo
echo "Gotowe. Sklep: https://$DOMAIN   Panel: https://$DOMAIN/admin"
echo "Pamiętaj: w home.pl ustaw rekordy A domeny (i www) na adres IP tego serwera."
echo "Po pierwszym logowaniu zmień hasło w panelu i usuń ADMIN_PASSWORD z $CONFIG."
echo "Aktualizacja sklepu w przyszłości: uruchom ten skrypt ponownie."
