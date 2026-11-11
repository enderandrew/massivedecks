#!/bin/sh
# Install or update Massive Decks on Debian (trixie) behind Apache, at /CAH/.
#
#   sudo sh install.sh            first install, and every update after it
#
# Settings (environment variables):
#   MD_REPO       git repository   (default https://github.com/enderandrew/massivedecks.git)
#   MD_BRANCH     branch           (default: the repository's default branch)
#   MD_BASE_PATH  path on the site (default /CAH)
#   MD_RESET_CONFIG=1  replace /etc/massivedecks/config.json5 with the one from the repository
#                      (the old one is kept next to it as a dated .bak). Needed to pick up new
#                      defaults after an update; your secret and Discord settings are not touched.
set -eu

REPO="${MD_REPO:-https://github.com/enderandrew/massivedecks.git}"
BASE_PATH="${MD_BASE_PATH:-/CAH}"
ROOT=/opt/massivedecks
SRC="$ROOT/repo"
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "Run this as root (sudo sh $0)." >&2; exit 1; }

say() { printf '\n==> %s\n' "$*"; }

say "Packages"
apt-get update -q
apt-get install -y -q git curl ca-certificates apache2 openssl

# The server needs Node 22 or newer; Debian trixie ships 20. Use NodeSource's.
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$NODE_MAJOR" -lt 22 ]; then
  say "Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -q nodejs
fi
echo "node $(node -v)"

say "User and folders"
id massivedecks >/dev/null 2>&1 ||
  useradd --system --home-dir "$ROOT" --shell /usr/sbin/nologin massivedecks
install -d -o massivedecks -g massivedecks "$ROOT"
install -d -m 0755 /etc/massivedecks

say "Source"
# builds run as the service user, never as root
asmd() { runuser -u massivedecks -- env HOME="$ROOT" "$@"; }
# the elm-material submodule is listed with an SSH address: fetch it over HTTPS
GITHTTPS="-c url.https://github.com/.insteadOf=git@github.com:"
if [ -d "$SRC/.git" ]; then
  asmd git -C "$SRC" fetch -q origin
  asmd git -C "$SRC" reset -q --hard "origin/${MD_BRANCH:-HEAD}"
else
  asmd git clone -q ${MD_BRANCH:+--branch "$MD_BRANCH"} "$REPO" "$SRC"
fi
asmd git -C "$SRC" $GITHTTPS submodule sync -q
asmd git -C "$SRC" $GITHTTPS submodule update -q --init --recursive

say "Building the server"
cd "$SRC/server"
asmd npm ci --no-audit --no-fund
asmd npm run build

say "Building the client for $BASE_PATH/"
cd "$SRC/client"
asmd npm ci --no-audit --no-fund
asmd env MD_BASE_PATH="$BASE_PATH" npx webpack --mode=production

say "Configuration"
if [ "${MD_RESET_CONFIG:-0}" = 1 ] && [ -f /etc/massivedecks/config.json5 ]; then
  backup="/etc/massivedecks/config.json5.$(date +%Y%m%d-%H%M%S).bak"
  mv /etc/massivedecks/config.json5 "$backup"
  echo "Kept the old config as $backup"
fi
if [ ! -f /etc/massivedecks/config.json5 ]; then
  # the stock config, listening on the socket Apache proxies to
  sed -e 's|^\(\s*\)listenOn:.*|\1listenOn: "/run/massivedecks/server.sock",|' \
      -e 's|^\(\s*\)basePath: "",|\1basePath: "'"${BASE_PATH#/}/"'",|' \
      "$SRC/server/config.json5" > /etc/massivedecks/config.json5
  # decks are read relative to the server folder
  echo "Wrote /etc/massivedecks/config.json5"
fi
if [ ! -f /etc/massivedecks/secret.env ]; then
  umask 077
  echo "MD_SECRET=$(openssl rand -hex 32)" > /etc/massivedecks/secret.env
  umask 022
  echo "Wrote /etc/massivedecks/secret.env"
fi
if ! grep -q "MD_DISCORD" /etc/massivedecks/secret.env; then
  cat >> /etc/massivedecks/secret.env <<'EOF'

# Discord invites: uncomment and fill in both lines, then `systemctl restart massivedecks`.
# The webhook comes from Discord: Edit Channel > Integrations > Webhooks > New Webhook > Copy Webhook URL.
#MD_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
#MD_DISCORD_SITE_URL=https://example.com/CAH/
EOF
fi

say "Service"
install -m 0644 "$HERE/massivedecks.service" /etc/systemd/system/massivedecks.service
systemctl daemon-reload
systemctl enable massivedecks >/dev/null
systemctl restart massivedecks

say "Apache"
sed "s|/CAH|$BASE_PATH|g" "$HERE/massivedecks-apache.conf" > /etc/apache2/conf-available/massivedecks.conf
a2enmod -q proxy proxy_http headers >/dev/null
a2enconf -q massivedecks >/dev/null
apache2ctl configtest
systemctl reload apache2

say "Checking"
sleep 2
systemctl --no-pager --lines=0 status massivedecks || true
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST --unix-socket /run/massivedecks/server.sock \
  -H 'Content-Type: application/json' -d '{}' http://localhost/api/games || true)
echo "Game server answered HTTP $code (400 is good: it rejected an empty game)."
echo "Done: open https://<your site>$BASE_PATH/"
