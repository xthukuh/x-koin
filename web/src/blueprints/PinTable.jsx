/**
 * The pin assignments of one device, read from the same rows the drawing reads.
 * Rows marked `group: 'deferred'` are blocks that keep their allocation so a
 * later build does not re-derive it; they are dimmed rather than hidden.
 */
export default function PinTable({ device }) {
  const rows = device.pins ?? [];
  if (rows.length === 0) {
    return null;
  }
  const populated = rows.filter((row) => row.group !== 'deferred');
  const deferred = rows.filter((row) => row.group === 'deferred');

  return (
    <div className="xk-bp-pins">
      <div className="xk-bp-pins-head">
        <h3>Pin map</h3>
        <span className="xk-note">{rows.length} rows, same data as the drawing</span>
      </div>
      <div className="xk-bp-scroll">
        <table className="xk-bp-table">
          <thead>
            <tr>
              <th>Pin</th>
              <th>Peripheral</th>
              <th>Signal</th>
              <th>Bus</th>
              <th>Provenance</th>
            </tr>
          </thead>
          <tbody>
            {populated.map((row, i) => (
              <Row key={`${row.pin}-${row.signal}-${i}`} row={row} />
            ))}
            {deferred.length > 0 ? (
              <tr className="xk-bp-row-split">
                <td colSpan={5}>Deferred blocks, allocated so nothing else takes these pins</td>
              </tr>
            ) : null}
            {deferred.map((row, i) => (
              <Row key={`deferred-${row.pin}-${row.signal}-${i}`} row={row} dim />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ row, dim = false }) {
  const proposed = /proposed|not allocated|verify/i.test(row.provenance ?? '');
  return (
    <tr className={dim ? 'xk-bp-row-dim' : undefined}>
      <td className="xk-bp-pin">{row.pin}</td>
      <td>{row.part}</td>
      <td>{row.signal}</td>
      <td className="xk-bp-bus">{row.bus}</td>
      <td className={proposed ? 'xk-bp-prov xk-bp-prov-open' : 'xk-bp-prov'}>{row.provenance}</td>
    </tr>
  );
}
