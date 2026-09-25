# gateway-api

The fiat boundary. A FastAPI service that sells gas vouchers for M-Pesa and Equitel money, relays settlement to the L2, and pays the founder fee out to a pinned phone number. Every outbound call in the test suite is mocked, and the service runs in dry-run mode by default, so nothing here touches a real rail or a real chain until it is told to.

| Path | What it is |
|---|---|
| `app/main.py` | The routes: `/health`, `/buy-gas`, the Daraja and Jenga callbacks, `/settlement/relay`, the B2C result and timeout hooks, and `/payouts`. |
| `app/escrow_routes.py` | `/escrow/withdraw` and `/escrow/transfer`: relay a client-signed `withdrawWithSig` or `transferDeposit`, refusing anything that would revert before the kiosk spends gas. |
| `app/escrow_auth.py` | The EIP-712 `Withdraw` and `TransferDeposit` digests and signer recovery, with parity against the /demo JavaScript. |
| `app/daraja/client.py` | M-Pesa through Safaricom Daraja: STK push and B2C. |
| `app/jenga/client.py` | Equitel through Finserve Jenga: payment and the M-Pesa STK rail, RSA-signed. |
| `app/vouchers.py` | Gas vouchers: Ed25519 signed by the kiosk root key, verified at the edge by a Node or a Node-Satellite. |
| `app/settlement/chain.py` | The chain bridge: `bridgeMint`, `bridgeBurn` and the relayer. In dry run it returns the transaction it would have sent. |
| `app/payout/worker.py` | Watches `Transfer(beneficiary -> bridge)`, fires a Daraja B2C to the founder MSISDN, then burns exactly the amount paid out once Daraja's result callback confirms. |
| `app/payout/pin.py` | Signs the MSISDN pin offline with an EIP-191 signature from the beneficiary key. |
| `app/config.py` | Settings, read from the environment. `.env.example` lists every key. |
| `trace_kiosk.py` | Drives four journeys through the real app and writes `protocol/out/kiosk.json` for the site. |
| `tests/` | 39 tests: the fiat bridge, the payout worker, the pin CLI, the kiosk trace and the relayed escrow exits. |

## Prerequisites

    python -m venv .venv                                    # from the repository root
    .venv/Scripts/python.exe -m pip install -r gateway-api/requirements.txt -r gateway-api/requirements-dev.txt

Runtime dependencies are FastAPI, uvicorn, httpx, pydantic-settings, PyNaCl, cryptography and web3. The dev set adds pytest, respx, anyio and black.

Configuration: copy `.env.example` to `.env` and fill what you need. `XKOIN_DRY_RUN=true` is the default and makes every chain call return the transaction it would send instead of broadcasting it. Flip it to false only after real sandbox credentials are in place (Daraja sandbox app, Jenga UAT, and an RSA keypair registered on the Finserve portal).

## Test

    cd gateway-api
    ../.venv/Scripts/python.exe -m pytest tests/ -q

Verified on 2026-09-26: exit 0, 39 passed in 3.6 s, with two deprecation warnings from starlette's test client that are not ours.

All outbound HTTP is intercepted by respx at the same base URLs the real clients use, so a passing suite proves the request bodies as well as the handling. Assert JSON without spaces: httpx serialises `{"Amount":20}`, not `{"Amount": 20}`.

## Run

    cd gateway-api
    ../.venv/Scripts/python.exe -m uvicorn app.main:app --reload
    # http://127.0.0.1:8000/health

The payout worker is a separate process:

    ../.venv/Scripts/python.exe -m app.payout.worker

Sign the MSISDN pin offline before running it in anything but dry run; the docstring in `app/payout/pin.py` carries the exact command.

In Docker, on the VPS:

    docker compose -f docker/compose.gateway.yml --env-file /srv/xkoin/.env up -d --build

That file expects `/srv/xkoin/.env` and `/srv/xkoin/jenga_private.pem` on the host, so `docker compose config` exits 1 anywhere else. Verified on this host on 2026-09-14: exit 1 with `env file .../srv/xkoin/.env not found`, which is the expected result off the VPS and not a syntax error.

## The security property to preserve

A compromised server may delay a payout. It must never redirect one. That is enforced structurally, not by policy:

- B2C fires only for transfers that originated from the beneficiary address.
- The MSISDN is pinned by an EIP-191 signature from the beneficiary key and verified against the treasury's on-chain beneficiary, so a rewritten `.env` or a hostile event feed changes nothing.
- `bridgeBurn` is self-only on the token, so no key reachable from here can burn a user balance.

Any change that loosens one of these is a design change and belongs in front of Martin, not in a refactor.
