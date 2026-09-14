/**
 * One set of conversion rates for the whole site.
 *
 * Every page that prints money shows Kenyan shillings first and the foreign
 * figure beside it in parentheses, using the rates below and nothing else. The
 * source documents quote in United States dollars (the beta cost model, the
 * roadmap funding ranges) and occasionally in Chinese yuan (factory equipment
 * list prices), so those two rates are all that is needed.
 *
 * Changing a rate here changes it on /manufacturing, /startup and anywhere else
 * that imports this file. Nothing else in the tree hard-codes a rate.
 *
 * Note on the 129 figure: the repository's own documents were written against a
 * 130 KES benchmark (`docs/_drive/03-hardware-bom-and-sourcing-guide.md`), and
 * Martin's measured peer-to-peer trade on 2026-09-09 was 123.29. The site uses
 * 129 as one published rate across every page so that two pages never disagree.
 * Converted figures therefore differ by under one percent from the dollar totals
 * printed in the source papers.
 */

export const RATES = {
  usdKes: 129,
  cnyKes: 17.8,
  recorded: '2026-09-14',
};

/** The sentence a page prints once, at the top, before any converted figure. */
export const RATE_NOTE = `All money is in Kenyan shillings at one rate for the whole page: 1 USD = ${RATES.usdKes} KES, 1 CNY = ${RATES.cnyKes} KES.`;

/** Normalise any shilling amount to whole shillings. */
export function kes(value) {
  return Number.isFinite(value) ? Math.round(value) : NaN;
}

/** United States dollars to whole shillings. */
export function usdToKes(value) {
  return kes(value * RATES.usdKes);
}

/** Chinese yuan to whole shillings. */
export function cnyToKes(value) {
  return kes(value * RATES.cnyKes);
}

/** Whole shillings as a label: fmtKes(6472) is 'KES 6,472'. */
export function fmtKes(value) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return `KES ${Math.round(value).toLocaleString('en-US')}`;
}

/** The dollar figure that sits in parentheses beside a shilling one. */
export function fmtUsd(value, { decimals = 2 } = {}) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return `USD ${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** The yuan figure that sits in parentheses beside a shilling one. */
export function fmtCny(value, { decimals = 0 } = {}) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  return `CNY ${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** 'KES 6,472 (USD 50.17)': the house shape for a dollar-sourced figure. */
export function fromUsd(value, { decimals = 2 } = {}) {
  return `${fmtKes(usdToKes(value))} (${fmtUsd(value, { decimals })})`;
}

/** 'KES 445,000 (CNY 25,000)': the house shape for a yuan-sourced figure. */
export function fromCny(value, { decimals = 0 } = {}) {
  return `${fmtKes(cnyToKes(value))} (${fmtCny(value, { decimals })})`;
}
