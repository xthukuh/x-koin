# The public endpoint: xkoin.thuku.dev

Yes to the DNS record. Jenga posts payment results to the `callbackUrl` we
put in each request, and that must be a public HTTPS root before any UAT
push test. A tunnel from the laptop would do for one afternoon; the VPS is
the same shape as production, keeps the callback URL stable for the Finserve
portal, and lets the payout worker run unattended.

## Martin's two steps

1. DNS: an A record `xkoin` on `thuku.dev` pointing at the VPS IPv4. TTL
   300 while testing. Confirm with:

```bash
nslookup xkoin.thuku.dev
```

2. On the VPS, a directory that holds the secrets and nothing else:

```bash
sudo mkdir -p /srv/xkoin && sudo chown $USER:$USER /srv/xkoin && chmod 700 /srv/xkoin
```

The `.env` (from `gateway-api/.env.sepolia.example`) and `jenga_private.pem`
go there with mode 600. They are typed or copied over SSH, never through a
chat or an email.

## The session's steps

The repo now carries the container definition:

| File | Role |
|---|---|
| `docker/gateway.Dockerfile` | Python 3.12 slim, the gateway's requirements, non-root user, uvicorn on 8000 |
| `docker/compose.gateway.yml` | Two services sharing `/srv/xkoin/.env`: `gateway` (FastAPI, behind Traefik) and `payout-worker` (no ports) |

The compose file follows the same Traefik pattern as the tbcrm server:
external network `proxy`, entrypoint `websecure`, certresolver
`letsencrypt`, a headers middleware. If the thuku.dev host names its network
or resolver differently, those two labels are the only edit.

Bring-up on the VPS, from a checkout of the tagged commit:

```bash
git clone --depth 1 --branch <tag> git@github.com:xthukuh/x-koin.git /srv/xkoin/app
```

```bash
docker compose -f /srv/xkoin/app/docker/compose.gateway.yml --env-file /srv/xkoin/.env up -d --build
```

```bash
curl -s https://xkoin.thuku.dev/health
```

`/health` reports the chain id, the dry-run flag and whether the bridge key
is set, with no secret values. A 200 there with `dry_run: false` and
`chain_id: 84532` is the phase 2 starting line.

## What the endpoint exposes, and what it does not

Exposed through Traefik: `/health`, `/buy-gas`, the Jenga and Daraja
callback paths, `/settlement/relay`, `/payouts`. The callback handlers
verify the payload against the order they issued before touching the chain;
an unknown reference is logged and dropped.

Not exposed: the payout worker (no ports, it only polls the chain and calls
out to Jenga), the RPC key, the `.env`. Traefik terminates TLS; the gateway
container listens only on the compose network.

Firewall on the host: 22, 80, 443 only. Traefik owns 80 and 443 already.

## Ask Finserve during onboarding

Whether they allowlist callback destinations by IP or by domain, and whether
the UAT environment posts callbacks to arbitrary HTTPS hosts. The public
docs do not say; the `callbackUrl` field suggests any host works. If they
need a fixed IP, the VPS has one.

## Rolling forward

A new release is a new tag. On the VPS: fetch the tag, `docker compose up -d
--build`, check `/health`, watch one callback land. Rolling back is the
previous tag with the same two commands. `.env` is untouched by either.

## Host name change (2026-09-12)

Martin's decision in session four: the presentation site takes
`xkoin.thuku.dev`, the gateway API moves to `api.xkoin.thuku.dev`
(`docker/compose.gateway.yml` default), and the simulator runs at
`velxio.thuku.dev`. Every `xkoin.thuku.dev` URL above for `/health`,
`/buy-gas` and the callbacks now reads `api.xkoin.thuku.dev`; the DNS step
becomes two A records, `xkoin` and `api.xkoin`. The compose file also
needs its external `proxy` network dropped before it runs on this host,
because Traefik there runs on the host network and reaches containers on
their own compose network (see `docker/compose.site.yml` for the pattern).
