/**
 * Highlight helper for the companion screens.
 *
 * A screen receives `highlight` from the phone frame naming the one control the
 * surrounding story is talking about. Every control that can be named appends
 * `hl(highlight, 'key')` to its class list, which is an empty string unless the
 * frame asked for it.
 *
 *   <div className={`xk-app-action${hl(highlight, 'buy')}`}>Buy</div>
 *
 * A control can answer to more than one name, so a story can say "attach" or
 * "node" and point at the same card.
 */
export function hl(highlight, ...keys) {
  return highlight && keys.includes(highlight) ? ' xk-app-hl' : '';
}

export default hl;
