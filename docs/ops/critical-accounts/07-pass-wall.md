# The pass-wall on xkoin.thuku.dev

The presentation site is not public. Nothing behind it is served without a password, and that includes the JavaScript bundle and the docs corpus, so a crawler or a forwarded link yields a login page and nothing else.

## How it works, in ten lines

1. Two containers, defined together in `docker/compose.site.yml`: `site` (nginx with the built SPA) and `gate` (`docker/gate/server.mjs`, Node built-ins only, no dependencies, no ports of its own).
2. Every request nginx receives runs an `auth_request` subrequest to `gate:8081/auth` before a single file is read.
3. `/auth` reads the `xkgate` cookie, checks its HMAC and its expiry, and answers 204 or 401.
4. A 401 becomes a 302 to `/gate?next=<the path that was asked for>`.
5. `/gate` serves one self-contained HTML page: a password field, an Enter button, no external font, no stylesheet, no script.
6. A correct password sets `xkgate` and sends a 303 straight back to the path the visitor originally wanted.
7. The cookie is `base64url({"n":name,"exp":unix})` plus an HMAC-SHA256 of that payload under `XKOIN_GATE_SECRET`. Nothing is stored server side.
8. Passwords are compared in constant time against every configured entry, and a wrong one costs a one second delay.
9. Ten failures from one address in fifteen minutes turns into a 429.
10. Only `/gate`, `/healthz`, `/robots.txt` and `/favicon.svg` answer without a cookie. `robots.txt` says `Disallow: /`, and every response carries `X-Robots-Tag: noindex, nofollow, noarchive`.

It fails closed. With the gate container stopped, nginx answers 500 to every request, cookie or no cookie; it never falls back to serving the files. The site container therefore waits for the gate to report healthy before it starts.

Pages are sent with `Cache-Control: no-store` so a borrowed laptop keeps nothing after the cookie goes. The hashed `/assets` files keep their long cache, marked `private`; they are still behind the wall, and the cache in question is the visitor's own browser.

## Where the settings live

On the VPS, `/docker/xkoin-site/.env`, mode 600, written by `scripts/deploy-site.sh`. `docker/gate/.env.example` lists every key with a comment. The deploy preserves what is already in that file and fills in only what is missing, so a password added by hand on the host survives a deploy.

| Key | Default | What it does |
|---|---|---|
| `XKOIN_GATE_PASSWORD` | `xkoin#2030` | the password everyone gets |
| `XKOIN_GATE_NAMED` | empty | extra `name:password` pairs, comma separated |
| `XKOIN_GATE_SECRET` | generated | the HMAC key that signs cookies |
| `XKOIN_GATE_TTL_HOURS` | `72` | how long a cookie lasts |
| `XKOIN_GATE_SECURE` | `true` | the Secure flag; `false` only for the local http test |
| `XKOIN_GATE_TRUST_PROXY` | `true` | read the client address from X-Forwarded-For |

Every change below is the same two steps: edit the file, then restart the gate. The site container does not need restarting; nginx re-resolves the gate through Docker's DNS on each request.

```bash
cd /docker/xkoin-site && docker compose up -d --force-recreate gate
```

## Change the default password

```bash
cd /docker/xkoin-site
sed -i 's/^XKOIN_GATE_PASSWORD=.*/XKOIN_GATE_PASSWORD=the new one/' .env
docker compose up -d --force-recreate gate
```

Cookies already issued stay valid until they expire. The old password stops working the moment the gate restarts. To throw everyone out at the same time, rotate the secret as well.

Or from the laptop, in one go:

```bash
XKOIN_GATE_PASSWORD='the new one' scripts/deploy-site.sh
```

## Add a named password

A name is letters, digits, underscore and hyphen, up to 64 characters. A password may hold a colon but never a comma, because the comma separates the pairs.

```bash
cd /docker/xkoin-site
sed -i 's/^XKOIN_GATE_NAMED=.*/XKOIN_GATE_NAMED=legal:s0me-long-phrase,investor-a:an0ther-one/' .env
docker compose up -d --force-recreate gate
```

The name is what lands in the log and in the cookie, so the log says who came in without ever holding the password.

## Revoke one named password

Delete that pair from `XKOIN_GATE_NAMED` and restart the gate. The name is gone from the configured set, so `/auth` stops honouring every cookie carrying it, immediately and without waiting for the expiry. Nobody else is affected: the default password and the other names keep working, and their open browser tabs keep working too. This was tested end to end on 2026-09-14.

## Rotate the secret

This logs everyone out at once, including Martin.

```bash
cd /docker/xkoin-site
sed -i "s/^XKOIN_GATE_SECRET=.*/XKOIN_GATE_SECRET=$(openssl rand -hex 32)/" .env
docker compose up -d --force-recreate gate
```

`scripts/gate-secret.sh` in the repo prints the same line, for a host with no `openssl` or for pasting one in from the laptop.

Do this when a password has leaked, or when a laptop with an open session is lost. If `XKOIN_GATE_SECRET` is ever left empty, the gate invents one at start and says so on stderr, which means every cookie dies on the next restart.

## What is logged, and where

One JSON line per password attempt on the gate's stdout, which is the Docker json-file log, capped at 10 MB across 5 files by `docker/compose.site.yml`.

```json
{"time":"2026-09-14T20:34:42.396Z","ip":"41.90.x.x","outcome":"ok","name":"default"}
```

`outcome` is `ok`, `rejected` or `ratelimited`. The password itself is never written, in any outcome. Read the log with:

```bash
cd /docker/xkoin-site && docker compose logs -f gate
```

The address is the first hop of `X-Forwarded-For`, which is the real client because Traefik sets it at the edge. Successful page views are not logged by the gate; nginx's own access log in the `site` container has those.

## Still Martin's to do

DNS. `xkoin.thuku.dev` needs an A record pointing at the VPS IPv4, per `06-vps-xkoin.thuku.dev.md`. Until that record resolves, Let's Encrypt cannot answer the HTTP-01 challenge, Traefik serves its own self-signed certificate, and the browser shows a warning before the password page. The wall itself works either way; only the certificate waits on the record.

```bash
nslookup xkoin.thuku.dev
```

## Testing it locally

The local run is plain http on port 8090, so the cookie cannot carry the Secure flag or the browser drops it:

```bash
XKOIN_GATE_SECURE=false docker compose -f docker/compose.site.yml up --build -d
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/     # 302
docker compose -f docker/compose.site.yml down
```
