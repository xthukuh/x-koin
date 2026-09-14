/**
 * xKoin pass-wall gate.
 *
 * A single-file HTTP service on Node built-ins only, so the image stays small
 * and every line of it is auditable. It answers four things:
 *
 *   GET  /auth         nginx auth_request endpoint: 204 with X-Gate-Name when
 *                      the xkgate cookie verifies, 401 otherwise.
 *   GET  /gate         the password page, carrying the originally wanted path.
 *   POST /gate         checks the password, sets the cookie, redirects (303).
 *   GET  /gate/logout  clears the cookie and sends the visitor back to /gate.
 *   GET  /healthz      200, for the container healthcheck.
 *
 * The cookie is base64url(payload) "." base64url(HMAC-SHA256(payload, secret))
 * where payload is JSON {"n": name, "exp": unix-seconds}. Nothing is stored
 * server side, so the service restarts without losing anyone, as long as
 * XKOIN_GATE_SECRET is set. Revocation works by name: /auth re-checks that the
 * name in the cookie is still one of the configured passwords, so deleting a
 * named password from the env and restarting invalidates its cookies alone.
 */
import { createServer } from 'node:http';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'xkgate';
const DEFAULT_NAME = 'default';
const DEFAULT_PASSWORD = 'xkoin#2030';
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const FAIL_DELAY_MS = 1000;
const MAX_BODY_BYTES = 4096;
const MAX_NEXT_LENGTH = 2048;
const MAX_PASSWORD_LENGTH = 512;
const NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const REDIRECT_BASE = 'http://gate.invalid';

/* --------------------------------------------------------------- configuration */

/**
 * Parse XKOIN_GATE_NAMED, a comma separated list of name:password pairs such as
 * `legal:abc123,investor-a:def456`. The first colon splits the pair, so a
 * password may contain colons; it may not contain a comma. A malformed entry is
 * reported on stderr and skipped rather than silently ignored.
 */
function parseNamed(raw) {
  const pairs = [];
  if (typeof raw !== 'string' || raw.trim() === '') return pairs;
  for (const entry of raw.split(',')) {
    const item = entry.trim();
    if (item === '') continue;
    const cut = item.indexOf(':');
    if (cut < 1 || cut === item.length - 1) {
      process.stderr.write('gate: XKOIN_GATE_NAMED entry is not name:password, skipped\n');
      continue;
    }
    const name = item.slice(0, cut).trim();
    const password = item.slice(cut + 1);
    if (!NAME_PATTERN.test(name)) {
      process.stderr.write('gate: XKOIN_GATE_NAMED name is not [A-Za-z0-9_-]{1,64}, skipped\n');
      continue;
    }
    if (name === DEFAULT_NAME) {
      process.stderr.write('gate: XKOIN_GATE_NAMED cannot redefine "default", skipped\n');
      continue;
    }
    if (pairs.some((pair) => pair.name === name)) {
      process.stderr.write('gate: XKOIN_GATE_NAMED repeats a name, later entry skipped\n');
      continue;
    }
    pairs.push({ name, password });
  }
  return pairs;
}

function toPort(raw, fallback) {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : fallback;
}

function toHours(raw, fallback) {
  const value = Number(raw ?? '');
  return Number.isFinite(value) && value > 0 && value <= 8760 ? value : fallback;
}

const PORT = toPort(process.env.XKOIN_GATE_PORT, 8081);
const TTL_SECONDS = Math.round(toHours(process.env.XKOIN_GATE_TTL_HOURS, 72) * 3600);
const SECURE = process.env.XKOIN_GATE_SECURE !== 'false';
const TRUST_PROXY = process.env.XKOIN_GATE_TRUST_PROXY === 'true';

let SECRET = process.env.XKOIN_GATE_SECRET ?? '';
if (SECRET.trim().length < 16) {
  SECRET = randomBytes(32).toString('hex');
  process.stderr.write(
    'gate: XKOIN_GATE_SECRET is unset or too short, using a random one. '
      + 'Every cookie dies on the next restart. Set it in the env file.\n',
  );
}

const CREDENTIALS = [
  { name: DEFAULT_NAME, password: process.env.XKOIN_GATE_PASSWORD || DEFAULT_PASSWORD },
  ...parseNamed(process.env.XKOIN_GATE_NAMED),
].map((pair) => ({
  name: pair.name,
  digest: createHash('sha256').update(pair.password, 'utf8').digest(),
}));

const NAMES = new Set(CREDENTIALS.map((credential) => credential.name));

/* ------------------------------------------------------------------- the token */

function sign(name) {
  const payload = JSON.stringify({ n: name, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS });
  const signature = createHmac('sha256', SECRET).update(payload).digest();
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${signature.toString('base64url')}`;
}

/**
 * Verify a token and return the name it carries, or null. The HMAC is checked
 * before the JSON is parsed, so a forged payload is never handed to JSON.parse.
 */
function verify(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 1024) return null;
  const dot = token.indexOf('.');
  if (dot < 1 || dot === token.length - 1) return null;
  if (token.indexOf('.', dot + 1) !== -1) return null;
  const payload = Buffer.from(token.slice(0, dot), 'base64url').toString('utf8');
  if (payload === '') return null;
  const expected = createHmac('sha256', SECRET).update(payload).digest();
  const given = Buffer.from(token.slice(dot + 1), 'base64url');
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(expected, given)) return null;
  let claims;
  try {
    claims = JSON.parse(payload);
  } catch {
    return null;
  }
  if (claims === null || typeof claims !== 'object') return null;
  if (typeof claims.n !== 'string' || typeof claims.exp !== 'number') return null;
  if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) return null;
  if (!NAMES.has(claims.n)) return null;
  return claims.n;
}

/**
 * Compare in constant time against every configured password. The loop does not
 * break on a match, so the time taken does not say which entry matched or how
 * far down the list it sits.
 */
function matchPassword(submitted) {
  const digest = createHash('sha256').update(submitted, 'utf8').digest();
  let matched = null;
  for (const credential of CREDENTIALS) {
    if (timingSafeEqual(digest, credential.digest)) matched = credential.name;
  }
  return matched;
}

/* ------------------------------------------------------------------- requests */

function readCookie(header) {
  if (typeof header !== 'string' || header.length === 0) return null;
  let index = 0;
  while (index < header.length) {
    let end = header.indexOf(';', index);
    if (end === -1) end = header.length;
    let start = index;
    while (start < end && header.charCodeAt(start) === 32) start += 1;
    const equals = header.indexOf('=', start);
    if (equals !== -1 && equals < end && header.slice(start, equals) === COOKIE_NAME) {
      return header.slice(equals + 1, end).trim();
    }
    index = end + 1;
  }
  return null;
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      const comma = forwarded.indexOf(',');
      const first = (comma === -1 ? forwarded : forwarded.slice(0, comma)).trim();
      if (first !== '') return first.slice(0, 64);
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
}

/**
 * Reduce an untrusted `next` to a same-origin absolute path, or "/". The value
 * is normalised through URL so that the Location header it ends up in is always
 * properly encoded, and anything that could leave the origin (a scheme, a
 * protocol-relative "//host", a backslash) collapses to "/".
 */
function safeNext(value) {
  if (typeof value !== 'string') return '/';
  let path = value;
  if (path === '' || path.length > MAX_NEXT_LENGTH) return '/';
  if (path.includes('%')) {
    try {
      path = decodeURIComponent(path);
    } catch {
      // Keep the raw form; the checks below still have to pass.
    }
  }
  if (path.length > MAX_NEXT_LENGTH) return '/';
  if (path.charCodeAt(0) !== 0x2f) return '/';
  if (path.charCodeAt(1) === 0x2f || path.charCodeAt(1) === 0x5c) return '/';
  for (let i = 0; i < path.length; i += 1) {
    const code = path.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return '/';
  }
  let url;
  try {
    url = new URL(path, REDIRECT_BASE);
  } catch {
    return '/';
  }
  if (url.origin !== REDIRECT_BASE) return '/';
  const out = `${url.pathname}${url.search}${url.hash}`;
  if (!out.startsWith('/') || out.startsWith('//')) return '/';
  if (out === '/gate' || out.startsWith('/gate/') || out.startsWith('/gate?')) return '/';
  return out.length > MAX_NEXT_LENGTH ? '/' : out;
}

/**
 * Pull the raw `next` out of the request target. nginx sends the original
 * $request_uri verbatim, which may itself hold a query string, so everything
 * after `next=` is the value; safeNext decides whether it is usable.
 */
function nextFromTarget(target) {
  const mark = target.indexOf('?');
  if (mark === -1) return '/';
  const query = target.slice(mark + 1);
  if (query.startsWith('next=')) return safeNext(query.slice(5));
  const joined = query.indexOf('&next=');
  if (joined !== -1) return safeNext(query.slice(joined + 6));
  return '/';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* --------------------------------------------------------------- rate limiting */

const failures = new Map();

function pruneFailures(ip) {
  const now = Date.now();
  const hits = (failures.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (hits.length === 0) failures.delete(ip);
  else failures.set(ip, hits);
  return hits;
}

function overLimit(ip) {
  return pruneFailures(ip).length >= RATE_LIMIT;
}

function recordFailure(ip) {
  const hits = pruneFailures(ip);
  hits.push(Date.now());
  failures.set(ip, hits);
}

const sweep = setInterval(() => {
  for (const ip of failures.keys()) pruneFailures(ip);
}, RATE_WINDOW_MS);
sweep.unref();

/* ------------------------------------------------------------------ the page */

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * The page carries its own CSS. No font file, no stylesheet, no script: a
 * visitor without the password causes exactly one request and learns nothing
 * about what is behind the wall.
 */
function renderPage(next, notice) {
  const message = notice === ''
    ? ''
    : `      <p class="notice">${escapeHtml(notice)}</p>\n`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>xKoin. Private preview.</title>
<style>
:root {
  color-scheme: light;
  --ground: #f5f4ef;
  --ink: #14213d;
  --accent: #0b3d91;
  --line: rgba(20, 33, 61, 0.28);
  --panel: #fffefa;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --ground: #0b1424;
    --ink: #e8edf6;
    --accent: #6ea0ff;
    --line: rgba(232, 237, 246, 0.3);
    --panel: #0f1a2e;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--ground);
  color: var(--ink);
  font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
}
main {
  width: 100%;
  max-width: 420px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 0;
  padding: 28px 24px;
}
h1 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.rule {
  height: 1px;
  background: var(--line);
  margin: 18px 0;
}
label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.72;
  margin-bottom: 6px;
}
input[type="password"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 0;
  background: var(--ground);
  color: var(--ink);
  font: inherit;
}
input[type="password"]:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}
button {
  margin-top: 14px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--accent);
  border-radius: 0;
  background: var(--accent);
  color: var(--panel);
  font: inherit;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
button:hover { opacity: 0.9; }
.note {
  margin: 16px 0 0;
  font-size: 12px;
  opacity: 0.7;
}
.notice {
  margin: 0 0 14px;
  padding: 8px 10px;
  border: 1px solid var(--accent);
  font-size: 12px;
}
</style>
</head>
<body>
  <main>
    <h1>xKoin. Private preview.</h1>
    <div class="rule"></div>
    <form method="post" action="/gate">
${message}      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password"
        autofocus required maxlength="${MAX_PASSWORD_LENGTH}">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <button type="submit">Enter</button>
    </form>
    <p class="note">Access is by invitation and is logged.</p>
  </main>
</body>
</html>
`;
}

/* ----------------------------------------------------------------- responses */

function sendPage(res, status, next, notice) {
  const body = Buffer.from(renderPage(next, notice), 'utf8');
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': body.length,
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow, noarchive',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  });
  res.end(body);
}

function sendText(res, status, text) {
  const body = Buffer.from(text, 'utf8');
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function cookieHeader(value, maxAge) {
  const parts = [`${COOKIE_NAME}=${value}`, 'Path=/', `Max-Age=${maxAge}`, 'HttpOnly', 'SameSite=Lax'];
  if (SECURE) parts.push('Secure');
  return parts.join('; ');
}

function log(ip, outcome, name) {
  process.stdout.write(`${JSON.stringify({
    time: new Date().toISOString(),
    ip,
    outcome,
    name,
  })}\n`);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* ------------------------------------------------------------------ handlers */

function handleAuth(req, res) {
  const name = verify(readCookie(req.headers.cookie));
  if (name === null) {
    res.writeHead(401, { 'content-length': 0, 'cache-control': 'no-store' });
    res.end();
    return;
  }
  res.writeHead(204, { 'x-gate-name': name, 'cache-control': 'no-store' });
  res.end();
}

async function handlePost(req, res) {
  const ip = clientIp(req);
  const type = req.headers['content-type'] ?? '';
  if (!type.startsWith('application/x-www-form-urlencoded')) {
    log(ip, 'rejected', 'bad-content-type');
    sendPage(res, 415, '/', 'That password was not accepted.');
    return;
  }
  if (overLimit(ip)) {
    log(ip, 'ratelimited', null);
    sendPage(res, 429, '/', 'Too many attempts. Wait fifteen minutes and try again.');
    return;
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    recordFailure(ip);
    log(ip, 'rejected', 'bad-body');
    await delay(FAIL_DELAY_MS);
    sendPage(res, 400, '/', 'That password was not accepted.');
    return;
  }

  const form = new URLSearchParams(raw);
  const passwords = form.getAll('password');
  const next = safeNext(form.get('next') ?? '/');
  if (passwords.length !== 1
    || passwords[0].length === 0
    || passwords[0].length > MAX_PASSWORD_LENGTH) {
    recordFailure(ip);
    log(ip, 'rejected', null);
    await delay(FAIL_DELAY_MS);
    sendPage(res, 400, next, 'That password was not accepted.');
    return;
  }

  const name = matchPassword(passwords[0]);
  if (name === null) {
    recordFailure(ip);
    log(ip, 'rejected', null);
    await delay(FAIL_DELAY_MS);
    sendPage(res, 200, next, 'That password was not accepted.');
    return;
  }

  failures.delete(ip);
  log(ip, 'ok', name);
  res.writeHead(303, {
    location: next,
    'set-cookie': cookieHeader(sign(name), TTL_SECONDS),
    'cache-control': 'no-store',
    'content-length': 0,
  });
  res.end();
}

function handleLogout(res) {
  res.writeHead(302, {
    location: '/gate',
    'set-cookie': cookieHeader('', 0),
    'cache-control': 'no-store',
    'content-length': 0,
  });
  res.end();
}

const server = createServer((req, res) => {
  const target = req.url ?? '/';
  const pathEnd = target.indexOf('?');
  const path = pathEnd === -1 ? target : target.slice(0, pathEnd);
  const method = req.method ?? 'GET';

  if (path === '/healthz') {
    sendText(res, 200, 'ok\n');
    return;
  }
  if (path === '/auth') {
    handleAuth(req, res);
    return;
  }
  if (path === '/gate/logout') {
    handleLogout(res);
    return;
  }
  if (path === '/gate' || path === '/gate/') {
    if (method === 'GET' || method === 'HEAD') {
      sendPage(res, 200, nextFromTarget(target), '');
      return;
    }
    if (method === 'POST') {
      handlePost(req, res).catch(() => {
        sendText(res, 500, 'gate error\n');
      });
      return;
    }
    res.writeHead(405, { allow: 'GET, HEAD, POST', 'content-length': 0 });
    res.end();
    return;
  }
  sendText(res, 404, 'not found\n');
});

server.headersTimeout = 10000;
server.requestTimeout = 15000;

server.listen(PORT, '0.0.0.0', () => {
  process.stdout.write(`${JSON.stringify({
    time: new Date().toISOString(),
    event: 'listening',
    port: PORT,
    names: [...NAMES],
    ttl_hours: TTL_SECONDS / 3600,
    secure: SECURE,
    trust_proxy: TRUST_PROXY,
  })}\n`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
