# Debian + Apache, in a subfolder

Runs Massive Decks at `https://<your site>/CAH/` on Debian trixie, with the game server as a systemd service that
restarts on its own, behind your existing Apache.

## Install / update

```sh
git clone https://github.com/enderandrew/massivedecks.git
sudo sh massivedecks/deployment/debian-apache/install.sh
```

Run the same script again to update: it pulls, rebuilds both halves and restarts the service. Your config and secret in
`/etc/massivedecks/` are kept.

## What it sets up

| What | Where |
| --- | --- |
| Source and builds | `/opt/massivedecks/repo` (owned by the `massivedecks` user) |
| Server config | `/etc/massivedecks/config.json5` (copied once from `server/config.json5`) |
| Token secret | `/etc/massivedecks/secret.env` (made once, root only) |
| Service | `massivedecks.service`; socket at `/run/massivedecks/server.sock` |
| Saved presets | `/var/lib/massivedecks/presets.json` |
| Apache | `/etc/apache2/conf-available/massivedecks.conf`, enabled with `a2enconf` |

- Node.js 22 comes from NodeSource when the installed one is older (trixie ships 20; the server needs 22).
- The server listens on a Unix socket, not a port, so it is only reachable through Apache.
- The Apache conf applies to every site on the machine. To limit it to one site, paste it into that
  `<VirtualHost *:443>` and run `a2disconf massivedecks`.

## After an update that changes the defaults

The config in `/etc/massivedecks/config.json5` is only written on the first install, so new default settings in the
repository's `server/config.json5` (default decks, house rules that start switched on) don't reach it by themselves:

```sh
sudo MD_RESET_CONFIG=1 sh massivedecks/deployment/debian-apache/install.sh
```

The old file is kept beside it as a dated `.bak`.

## Keeping games through restarts

By default games live in the server's memory, so every restart (including the one at the end of each update) ends
the games in progress. To keep them in a local PostgreSQL database instead, run the install once with:

```sh
sudo MD_POSTGRES=1 sh massivedecks/deployment/debian-apache/install.sh
```

It installs PostgreSQL, makes a `massivedecks` database that the service logs in to over the local socket (no
password), and adds `MD_POSTGRES_DATABASE=massivedecks` to `/etc/massivedecks/secret.env`. Later updates keep using
it. Remove that line and restart to go back to memory. (For a database elsewhere, also set `MD_POSTGRES_HOST`,
`MD_POSTGRES_USER` and `MD_POSTGRES_PASSWORD` there.)

## Discord invites

The host of a game can post an invite to a Discord channel from the invite dialog. In Discord, make a webhook for the
channel (Edit Channel > Integrations > Webhooks), then put it and the site's address in
`/etc/massivedecks/secret.env`:

```sh
MD_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
MD_DISCORD_SITE_URL=https://example.com/CAH/
```

and `sudo systemctl restart massivedecks`. Without these, the dialog still has "Copy invite for Discord".

## The default cards

New games start with every deck in `server/decks/cah-cards-compact.json` (JSON Against Humanity "compact" format).
Replace that file and restart the service to change the cards. If the file is missing or damaged, the server logs
the error and starts without those decks (the built-in and Many Decks sources still work).

## Another path

`MD_BASE_PATH=/games/cah sudo -E sh install.sh`. The client is built for one path, so changing it means running the
script again.

## Useful commands

```sh
systemctl status massivedecks
journalctl -u massivedecks -f
sudo systemctl restart massivedecks     # after editing /etc/massivedecks/config.json5
curl https://example.com/CAH/api/health # {"status":"ok",...} while it's working (503 if not)
```

One address can create 10 games per 10 minutes and make 30 join attempts a minute; past that the server asks
them to wait.
