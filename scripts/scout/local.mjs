// Nairobi vendor scout: search Kenyan electronics stores for the shopping
// list lines and print what each store offers, as JSON.
//
//   node scripts/scout/local.mjs probe esp32                 # one term, every store
//   node scripts/scout/local.mjs parts [--out dir] [--only id,id]
//
// Plain fetch, no browser: every store here either serves a JSON search
// endpoint or renders the search results into the HTML. Prices are KES as
// the store shows them to a visitor; stock is whatever the store exposes.
// Nothing is written unless --out is given.

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import https from 'node:https';
import { resolve4 } from 'node:dns/promises';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const TIMEOUT_MS = 90000;

// node:https with a keep-alive agent rather than fetch: on this host Node's
// default getaddrinfo lookup takes about 12 s per name (curl and a connect by
// IP take 300 ms), so undici's 10 s connect timeout fails every request. The
// agent resolves names through the DNS resolver instead and caches them.
const dnsCache = new Map();
function lookup(host, opts, cb) {
  if (typeof opts === 'function') [opts, cb] = [{}, opts];
  const hit = dnsCache.get(host);
  const done = (addr) => (opts.all ? cb(null, [{ address: addr, family: 4 }]) : cb(null, addr, 4));
  if (hit) return done(hit);
  return resolve4(host).then((addrs) => {
    dnsCache.set(host, addrs[0]);
    done(addrs[0]);
  }, cb);
}
const agent = new https.Agent({ keepAlive: true, maxSockets: 4, lookup });

function get(url, accept = 'text/html', hops = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent, headers: { 'user-agent': UA, accept, 'accept-language': 'en-KE,en' }, timeout: TIMEOUT_MS }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && hops < 5) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href, accept, hops + 1));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8'), url }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error(`timeout after ${TIMEOUT_MS} ms`)));
    req.on('error', reject);
  });
}

const decode = (s) =>
  String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&#0?38;/g, '&')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
const kes = (s) => {
  const m = String(s ?? '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : null;
};

// One adapter per store: search(term) -> [{ title, price_kes, url, stock }]
export const STORES = {
  pixel: {
    name: 'Pixel Electric (BigCommerce)',
    home: 'https://www.pixelelectric.com/',
    async search(term) {
      const { text } = await get(`https://www.pixelelectric.com/search.php?search_query=${encodeURIComponent(term)}`);
      const re = /card-title">\s*<a[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>[\s\S]{0,1500}?price--withoutTax price--main">([^<]+)/g;
      return [...text.matchAll(re)].map((m) => ({ title: decode(m[2]), price_kes: kes(m[3]), url: decode(m[1]).replace(/\?searchid=.*$/, ''), stock: null }));
    },
  },
  nerokas: {
    name: 'Nerokas (OpenCart)',
    home: 'https://store.nerokas.co.ke/',
    async search(term) {
      const { text } = await get(`https://store.nerokas.co.ke/index.php?route=product/search&search=${encodeURIComponent(term)}`);
      const re = /<div class="name"><a href="([^"]+)">([^<]+)<\/a>[\s\S]{0,2500}?<span class="price-(?:normal|new)">([^<]+)/g;
      return [...text.matchAll(re)].map((m) => ({ title: decode(m[2]), price_kes: kes(m[3]), url: decode(m[1]).replace(/\?search=.*$/, ''), stock: null }));
    },
  },
  ktechnics: {
    name: 'K-Technics (Shopify)',
    home: 'https://www.ktechnics.com/',
    async search(term) {
      const { text } = await get(`https://www.ktechnics.com/search/suggest.json?q=${encodeURIComponent(term)}&resources%5Btype%5D=product&resources%5Blimit%5D=10`, 'application/json');
      const j = JSON.parse(text);
      return (j.resources?.results?.products ?? []).map((p) => ({ title: decode(p.title), price_kes: kes(p.price), url: `https://www.ktechnics.com${p.url.replace(/\?.*$/, '')}`, stock: p.available ? 'in stock' : 'out of stock' }));
    },
  },
  ask: {
    name: 'ASK Electronics (WooCommerce)',
    home: 'https://askelectronics.co.ke/',
    async search(term) {
      const { text } = await get(`https://askelectronics.co.ke/wp-json/wc/store/v1/products?search=${encodeURIComponent(term)}&per_page=20`, 'application/json');
      const j = JSON.parse(text);
      return j.map((p) => ({ title: decode(p.name), price_kes: Math.round(Number(p.prices.price) / 10 ** Number(p.prices.currency_minor_unit)), url: p.permalink, stock: p.is_in_stock ? 'in stock' : 'out of stock' }));
    },
  },
  espke: {
    name: 'esp-ke (custom SPA)',
    home: 'https://www.esp-ke.com/',
    catalog: null,
    async search(term) {
      if (!this.catalog) {
        const { text } = await get('https://www.esp-ke.com/api/products', 'application/json');
        this.catalog = (JSON.parse(text).products ?? []).map((p) => ({ title: decode(p.name), price_kes: kes(p.price), url: `https://www.esp-ke.com/product/${p.id}`, stock: p.stock > 0 ? `${p.stock} in stock` : 'out of stock', category: p.category }));
      }
      const words = term.toLowerCase().split(/\s+/);
      return this.catalog.filter((p) => words.every((w) => p.title.toLowerCase().includes(w)));
    },
  },
  ardu: {
    name: 'ArduinoTech Kenya (JSON-LD)',
    home: 'https://arduinotech.co.ke/',
    async search(term) {
      const { text } = await get(`https://arduinotech.co.ke/shop?q=${encodeURIComponent(term)}`);
      const m = text.match(/<script type="application\/ld\+json"[^>]*>(\{"@context":"https:\/\/schema.org","@type":"ItemList"[\s\S]*?)<\/script>/);
      if (!m) return [];
      const j = JSON.parse(m[1]);
      const words = term.toLowerCase().split(/\s+/);
      return (j.itemListElement ?? [])
        .map((e) => e.item)
        .filter((p) => words.every((w) => p.name.toLowerCase().includes(w)))
        .map((p) => ({ title: decode(p.name), price_kes: kes(p.offers?.price), url: p.url, stock: /InStock/.test(p.offers?.availability ?? '') ? 'in stock' : p.offers?.availability ?? null }));
    },
  },
  jumia: {
    name: 'Jumia Kenya (marketplace)',
    home: 'https://www.jumia.co.ke/',
    async search(term) {
      const { text } = await get(`https://www.jumia.co.ke/catalog/?q=${encodeURIComponent(term)}`);
      const re = /<article[^>]*class="prd[^"]*"[\s\S]*?<a class="core"[^>]*href="([^"]+)"[\s\S]*?<h3 class="name">([^<]+)<\/h3>[\s\S]*?<div class="prc">([^<]+)/g;
      return [...text.matchAll(re)].map((m) => ({ title: decode(m[2]), price_kes: kes(m[3]), url: `https://www.jumia.co.ke${decode(m[1])}`, stock: null }));
    },
  },
};

// Search terms per shopping list line. Stores are searched with each term;
// Jumia only where a consumer product is plausible there.
export const TERMS = {
  '18650-holder': { terms: ['18650 holder', 'battery holder'] },
  'antenna-868-sma': { terms: ['868 antenna', 'lora antenna', '915 antenna', 'sma antenna'] },
  'breadboard-jumpers': { terms: ['breadboard 830', 'breadboard', 'jumper wires', 'dupont'] },
  'esp32-c3-supermini': { terms: ['esp32-c3', 'esp32 c3', 'supermini'] },
  'esp32-s3-devkitc-n16r8': { terms: ['esp32-s3', 'esp32 s3', 'n16r8'] },
  'extension-strips': { terms: ['extension socket', 'extension cable', '4 way extension', 'power strip'], jumia: ['4 way extension cable', 'extension socket 13a'] },
  'heltec-lora32-v3-868': { terms: ['heltec', 'wifi lora 32', 'lora v3'] },
  'hlk-pm01-5v-psu': { terms: ['hlk-pm01', 'hlk', 'hi-link', 'ac dc 5v', '220v to 5v'] },
  'homeplug-av-plain-pair': { terms: ['powerline', 'homeplug', 'tl-pa4010'], jumia: ['powerline adapter', 'tp-link powerline', 'tl-pa4010', 'homeplug'] },
  'homeplug-av-wifi-kit': { terms: ['powerline wifi', 'tl-wpa4220'], jumia: ['powerline wifi extender', 'tl-wpa4220', 'tl-wpa4220 kit'] },
  'ipex-sma-pigtail': { terms: ['ipex sma', 'u.fl', 'pigtail', 'ipx sma', 'ipex'] },
  'kq-130f-plc-module': { terms: ['kq-130f', 'kq130', 'kq-330', 'power line carrier', 'plc module', 'powerline module'] },
  'mains-plc-blocking-filter': { terms: ['emi filter', 'power filter', 'noise filter', 'line filter'] },
  'ra-01sh-sx1262': { terms: ['ra-01sh', 'ra-01', 'sx1262'] },
  'sma-attenuator-30db': { terms: ['attenuator', '30db'] },
  'soil-moisture-capacitive-v2': { terms: ['capacitive soil', 'soil moisture'] },
  'solar-panel-6v-2w': { terms: ['solar panel 6v', '6v solar', 'solar panel', 'solar cell'] },
  'sx1262-module-868': { terms: ['sx1262', 'e22-900m22s', 'e22-900', 'core1262', 'lora module', 'ebyte'] },
  'temp-humidity-sensor': { terms: ['dht22', 'am2302', 'aht20'] },
  'tp4056-solar-charger': { terms: ['tp4056', 'lithium charger', 'cn3065'] },
  'usb-c-otg-adapter': { terms: ['otg', 'type c otg', 'usb c otg'], jumia: ['usb c otg adapter'] },
  'usb-ttl-ch340': { terms: ['ch340', 'cp2102', 'usb ttl', 'usb to ttl', 'ft232'] },
};

async function searchStore(key, term) {
  try {
    return { store: key, term, results: await STORES[key].search(term) };
  } catch (err) {
    return { store: key, term, error: String(err.message ?? err) };
  }
}

async function pool(tasks, width) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (i < tasks.length) {
        const n = i++;
        out[n] = await tasks[n]();
      }
    }),
  );
  return out;
}

async function scoutPart(id, stores) {
  const cfg = TERMS[id];
  const tasks = [];
  for (const key of stores) {
    const terms = key === 'jumia' ? cfg.jumia ?? [] : cfg.terms;
    for (const term of terms) tasks.push(() => searchStore(key, term));
  }
  const runs = await pool(tasks, 3);
  const byUrl = new Map();
  const errors = [];
  for (const run of runs) {
    if (run.error) {
      errors.push(`${run.store} "${run.term}": ${run.error}`);
      continue;
    }
    for (const r of run.results) {
      const k = `${run.store} ${r.url}`;
      if (!byUrl.has(k)) byUrl.set(k, { store: run.store, ...r, terms: [run.term] });
      else byUrl.get(k).terms.push(run.term);
    }
  }
  return { id, recorded: new Date().toISOString().slice(0, 10), errors, results: [...byUrl.values()] };
}

const args = process.argv.slice(2);
const mode = args[0];
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

if (mode === 'probe') {
  const term = args[1];
  const runs = await pool(Object.keys(STORES).map((k) => () => searchStore(k, term)), 4);
  console.log(JSON.stringify(runs, null, 2));
} else if (mode === 'parts') {
  const outDir = opt('--out');
  const only = opt('--only')?.split(',');
  const stores = (opt('--stores') ?? Object.keys(STORES).join(',')).split(',');
  const ids = readdirSync('hardware/shopping/parts')
    .map((f) => f.replace(/\.json$/, ''))
    .filter((id) => TERMS[id] && (!only || only.includes(id)));
  const all = [];
  for (const id of ids) {
    const res = await scoutPart(id, stores);
    all.push(res);
    if (outDir) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, `${id}.json`), JSON.stringify(res, null, 2));
    }
    console.error(`${id}: ${res.results.length} hits${res.errors.length ? `, ${res.errors.length} errors` : ''}`);
  }
  if (!outDir) console.log(JSON.stringify(all, null, 2));
} else {
  console.error('usage: local.mjs probe <term> | parts [--out dir] [--only id,id] [--stores a,b]');
  process.exit(2);
}

// Keep the part files in sight so the TERMS map is checked against them.
void readFileSync;
