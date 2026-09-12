// AliExpress scout: search listings and read product pages as JSON.
//
//   node scripts/scout/ali.mjs search "esp32-s3 devkitc-1 n16r8" --max 20
//   node scripts/scout/ali.mjs item https://www.aliexpress.com/item/1005006240249067.html [...more]
//
// Uses the locally installed Google Chrome (or Edge) through playwright-core,
// headless, one browser per process, so several scouts can run in parallel.
// Output is one JSON document on stdout. Nothing is written to disk.

import { chromium } from 'playwright-core';

async function launch() {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel, headless: true, timeout: 30000, args: ['--disable-blink-features=AutomationControlled'] });
    } catch {
      /* try the next channel */
    }
  }
  throw new Error('no Chrome or Edge channel available');
}

async function newPage(browser) {
  // The real Chrome UA and client hints must stay consistent; a custom UA
  // string gets the empty shell on product pages.
  const ctx = await browser.newContext({
    locale: 'en-KE',
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  page.setDefaultTimeout(45000);
  return page;
}

// A fresh context gets an empty shell on product pages until the site's own
// cookies exist, so every context first lands on the home page once.
async function warmUp(page) {
  await page.goto('https://www.aliexpress.com/', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
}

async function readItem(page, url) {
  const rendered = () => document.body.innerText.length > 3000 && /KSh|US\s?\$/.test(document.body.innerText);
  await page.goto(url, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(rendered, null, { timeout: 15000 });
  } catch {
    await page.reload({ waitUntil: 'networkidle' });
    try {
      await page.waitForFunction(rendered, null, { timeout: 15000 });
    } catch {
      /* fall through: the embedded JSON still carries the image list */
    }
  }
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const text = document.body.innerText;
    const pick = (re, src = html) => {
      const m = src.match(re);
      return m ? (m[1] !== undefined ? m[1] : m[0]) : null;
    };
    const j = (key) => pick(new RegExp('"' + key + '":"([^"]{1,200})"'));
    const jn = (key) => pick(new RegExp('"' + key + '":([\\d.]+)'));
    let images = [];
    const ipl = html.match(/"imagePathList":\s*(\[[^\]]*\])/);
    if (ipl) {
      try {
        images = JSON.parse(ipl[1]);
      } catch {
        images = [];
      }
    }
    const skuNames = [...new Set([...html.matchAll(/"skuPropertyName":"([^"]{1,60})"/g)].map((m) => m[1]))];
    const skuValues = [...new Set([...html.matchAll(/"propertyValueDisplayName":"([^"]{1,80})"/g)].map((m) => m[1]))];
    const captcha = /slide to verify|captcha|punish/i.test(text) && text.length < 2000;
    return {
      url: location.href,
      captcha,
      rendered: text.length > 3000,
      title: (document.title.replace(/\s*-\s*AliExpress.*$/, '') || j('subject') || document.querySelector('h1')?.innerText || '').trim(),
      price: pick(/KSh\s?[\d,]+(?:\.\d+)?|US\s?\$\s?[\d,.]+/, text) || j('formatedAmount') || j('minActivityAmount'),
      price_all: [...new Set([...(text.match(/KSh\s?[\d,]+(?:\.\d+)?/g) || []), ...[...html.matchAll(/"formatedAmount":"(KSh[^"]+)"/g)].map((m) => m[1])].slice(0, 8))],
      sold: pick(/([\d,]+\+?)\s*sold/i, text) || j('formatTradeCount') || jn('tradeCount'),
      rating: pick(/(\d\.\d)\s*(?:\n|\s)*(?:\d+\s*reviews?|\(|stars?)/i, text) || j('averageStar') || j('evarageStar'),
      reviews: pick(/(\d[\d,]*)\s*reviews?/i, text) || jn('totalValidNum'),
      store: j('storeName') || document.querySelector('a[href*="/store/"]')?.innerText?.split('\n')[0] || null,
      store_url: document.querySelector('a[href*="/store/"]')?.href || (j('storeURL') ? 'https:' + j('storeURL') : null),
      store_positive: j('positiveRate') || j('sellerPositiveRate'),
      shipping: pick(/((?:Free shipping|Shipping:\s*KSh\s?[\d,]+|Delivery[^\n]{0,80}))/i, text) || j('displayAmount'),
      sku_names: skuNames,
      sku_values: skuValues.slice(0, 40),
      images,
      description_images: [...new Set([...html.matchAll(/https:\/\/ae0\d\.alicdn\.com\/kf\/[A-Za-z0-9]+\.(?:jpg|png|webp)/g)].map((m) => m[0]))].slice(0, 10),
    };
  });
}

async function search(page, query, max) {
  const slug = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const url = `https://www.aliexpress.com/w/wholesale-${slug}.html?SearchText=${encodeURIComponent(query.trim())}&SortType=total_tranpro_desc`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(700);
  }
  const rows = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const cards = document.querySelectorAll('a.search-card-item, a[class*="search-card-item"]');
    for (const a of cards.length ? cards : document.querySelectorAll('a[href*="/item/"]')) {
      const m = a.href.match(/\/item\/(\d+)\.html/);
      if (!m || seen.has(m[1])) continue;
      seen.add(m[1]);
      const t = a.innerText || '';
      const lines = t.split('\n').map((s) => s.trim()).filter((s) => s.length > 12 && !/KSh|sold|Report fraud|shipping|Welcome deal|Choice/i.test(s));
      const title = a.querySelector('img')?.alt || lines.sort((x, y) => y.length - x.length)[0] || '';
      out.push({
        id: m[1],
        url: `https://www.aliexpress.com/item/${m[1]}.html`,
        title: title.trim(),
        price: (t.match(/KSh\s?[\d,]+(?:\.\d+)?|US\s?\$\s?[\d,.]+/) || [null])[0],
        sold: (t.match(/([\d,]+\+?)\s*sold/i) || [null, null])[1],
        rating: (t.match(/(\d\.\d)\b/) || [null, null])[1],
        free_shipping: /free shipping/i.test(t),
        image: a.querySelector('img')?.src || null,
      });
    }
    return out;
  });
  return { query, url, count: rows.length, results: rows.slice(0, max) };
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || !['search', 'item'].includes(cmd)) {
    console.error('usage: ali.mjs search "<query>" [--max N] | ali.mjs item <url> [<url>...]');
    process.exit(2);
  }
  const browser = await launch();
  const out = [];
  try {
    const page = await newPage(browser);
    await warmUp(page);
    if (cmd === 'search') {
      const maxIdx = rest.indexOf('--max');
      const max = maxIdx >= 0 ? Number(rest[maxIdx + 1]) : 20;
      const query = rest.filter((_, i) => i !== maxIdx && i !== maxIdx + 1).join(' ');
      out.push(await search(page, query, max));
    } else {
      for (const url of rest) {
        try {
          out.push(await readItem(page, url));
        } catch (err) {
          out.push({ url, error: String(err.message || err) });
        }
      }
    }
  } finally {
    await browser.close();
  }
  process.stdout.write(JSON.stringify(cmd === 'search' ? out[0] : out, null, 2) + '\n');
}

await main(process.argv.slice(2));
