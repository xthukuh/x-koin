/**
 * The one list of routes. The topbar, the drawer, the footer, the /map sitemap
 * page and scripts/build-sitemap.mjs all read this file, so a page exists in
 * exactly one place and cannot be reachable from one menu and missing from
 * another.
 *
 * `topbar` puts a route in the sticky header; `footer` in the footer strip.
 * `audience` is a hint for the sitemap page. `priority` and `changefreq` feed
 * sitemap.xml.
 */
export const NAV = [
  {
    path: '/',
    label: 'Home',
    title: 'xKoin',
    text: 'What xKoin is: the three mediums, the money, the devices, the Laws and the roadmap.',
    topbar: false,
    footer: false,
    audience: 'everyone',
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: '/docs',
    label: 'Docs',
    title: 'Docs',
    text: 'Full concept walkthrough and technical reference: the whitepaper set, the use cases and the beta board set.',
    topbar: true,
    footer: true,
    audience: 'engineers and reviewers',
    priority: 0.9,
    changefreq: 'weekly',
  },
  {
    path: '/investors',
    label: 'Investors',
    title: 'Investor presentation',
    text: 'Animated walkthrough in plain language: tokenomics, the admin and client journeys, self-sufficiency, LoRa and the fallback network.',
    topbar: true,
    footer: true,
    audience: 'investors',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: '/startup',
    label: 'Startup',
    title: 'Startup plan',
    text: 'Realistic goals, phased roadmap and budget in KES: what the money is for and the path to success.',
    topbar: true,
    footer: true,
    audience: 'investors',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/demo',
    label: 'Demo',
    title: 'Contract demo',
    text: 'Run the contracts by hand: kiosk, wallet and escrow, a 12 MB session, settlement, live costs in KES and recovery drills.',
    topbar: true,
    footer: true,
    audience: 'engineers, auditors and investors',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/replay',
    label: 'Replay',
    title: 'Protocol replay',
    text: 'Microscope on the protocol: end-to-end journeys with every payload, signature check and on-chain record shown as proof, plus the threat scenarios.',
    topbar: true,
    footer: true,
    audience: 'engineers and auditors',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/blueprints',
    label: 'Blueprints',
    title: 'Device blueprints',
    text: 'Schematics of the xKoin core devices and the LoRa ecosystem devices they interoperate with.',
    topbar: true,
    footer: true,
    audience: 'engineers and manufacturers',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: '/manufacturing',
    label: 'Manufacturing',
    title: 'Manufacturing path',
    text: 'From module kit to one custom PCB: feasibility, trade-offs, gains and the factory options.',
    topbar: true,
    footer: true,
    audience: 'manufacturers and investors',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: '/shop',
    label: 'Parts',
    title: 'Proof of concept parts',
    text: 'The MVP kit by device with verified checkout links, Nairobi vendors and prices in KES.',
    topbar: true,
    footer: true,
    audience: 'builders',
    priority: 0.7,
    changefreq: 'weekly',
  },
  {
    path: '/slides',
    label: 'Slides',
    title: 'Full invention slides',
    text: 'The founder deck: every user journey, every operating mode and every attack scenario, with glossary links.',
    topbar: true,
    footer: true,
    audience: 'founder and technical reviewers',
    priority: 0.6,
    changefreq: 'monthly',
  },
  {
    path: '/landlord',
    label: 'Landlord pilot',
    title: 'Landlord pilot',
    text: 'The offer to a building owner: how the mesh reaches every unit and what the building earns.',
    topbar: false,
    footer: false,
    audience: 'landlords',
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/map',
    label: 'Sitemap',
    title: 'Sitemap',
    text: 'Every page on this site, grouped by audience, with the XML sitemap alongside.',
    topbar: false,
    footer: true,
    audience: 'everyone',
    priority: 0.3,
    changefreq: 'monthly',
  },
];

export const TOPBAR = NAV.filter((route) => route.topbar);
export const FOOTER = NAV.filter((route) => route.footer);

export const REPO_URL = 'https://github.com/xthukuh/x-koin';
export const INVENTOR = { name: 'Martin Thuku', url: 'https://github.com/xthukuh' };

/** The route whose path is the longest prefix of `pathname`, or undefined. */
export function routeFor(pathname) {
  let best;
  for (const route of NAV) {
    const hit = route.path === '/' ? pathname === '/' : pathname === route.path || pathname.startsWith(`${route.path}/`);
    if (hit && (!best || route.path.length > best.path.length)) {
      best = route;
    }
  }
  return best;
}
