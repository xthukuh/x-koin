# xKoin chip models for self-hosted velxio

Two custom chips and a shared-medium convention, so an xKoin sketch can talk
LoRa and power line carrier inside a velxio simulation.

| Path | What it is |
|---|---|
| `chips/sx1262/chip.c`, `chip.json` | SX1262 model: SPI slave plus a synthetic `ANT` pin |
| `chips/kq130f/chip.c`, `chip.json` | KQ-130F model: 9600 8N1 UART plus a synthetic `LINE` pin |
| `chips/*/chip.wasm` | Compiled by velxio's own `/api/compile-chip/` route |
| `proof/chip_selftest.py` | 15 cases against velxio's WASM chip runtime, all passing |
| `proof/*.ino` | Two-board sender and receiver sketches, fixed gateway pin map |
| `proof/build_vlx.py`, `proof/*.vlx` | The importable two-board projects |

Read the limits section before planning a demo on these. One of them decides
what is worth building next.

## The antenna and line nets

Both models use the same idea: a synthetic pin that is not a real device pin,
carrying a self-clocked bit stream to every other instance wired to it.

`ANT` on the SX1262 is the air. `LINE` on the KQ-130F is the mains. Wire two
or more chips' `ANT` pins together and they share one collision domain. The
same goes for `LINE`. There is no range, no path loss, no channel: everything
on the net hears everything else.

The encoding is Manchester, one wire, no separate clock:

```
preamble  16 bits of 1          edges every half cell, so a receiver can lock
sync      1 byte  0x2D          the receiver hunts for 0xFF2D in its bit stream
length    1 byte                payload length
payload   length bytes
crc       2 bytes big endian    CRC16-CCITT, poly 0x1021, init 0xFFFF,
                                over the length byte and the payload
```

Bit 1 is HIGH then LOW, bit 0 is LOW then HIGH, each half cell lasting
`bit_period_us / 2`. The line idles LOW: a transmitter switches `ANT` to an
output for the frame and releases it to an input afterwards, so an undriven
net reads 0.

A receiver decodes from edge intervals alone. It seeds its half-cell estimate
from the `bit_period_us` attribute, then tracks what it actually measures, so
a host whose software timers run slow still decodes. The discrimination is
between a half cell and a full cell, which gives a tolerance of plus or minus
50 percent on any one interval before a bit flips.

Collisions need no special handling. Two transmitters on one net drive
conflicting levels, the receiver sees edges that belong to neither frame, and
the CRC fails. That is the honest outcome: the receiver knows a frame arrived
and that it was corrupt, and nothing tells it why. The self test covers this.

## Pin tables

### SX1262

| Chip pin | Direction | Gateway GPIO | Notes |
|---|---|---|---|
| SCK | in | 12 | SPI clock |
| MOSI | in | 11 | |
| MISO | out | 13 | |
| NSS | in | 10 | chip select, active low; falling edge opens a transaction |
| BUSY | out | 21 | high for 60 us after each command completes |
| DIO1 | out | 14 | high while `irq_status & dio1_mask` is non-zero |
| RESET | in | not wired | falling edge resets the model; safe to leave unconnected |
| ANT | bidirectional | none | the air; wire to other SX1262 `ANT` pins only |
| VCC, GND | - | 3V3, GND | cosmetic, the model ignores them |

Commands: GetStatus, SetStandby, SetSleep, SetFs, SetPacketType, GetPacketType,
SetRfFrequency, SetPaConfig, SetTxParams, SetBufferBaseAddress,
SetModulationParams, SetPacketParams, SetDioIrqParams, GetIrqStatus,
ClearIrqStatus, WriteBuffer, ReadBuffer, WriteRegister, ReadRegister, SetTx,
SetRx, GetRxBufferStatus, GetPacketStatus, GetRssiInst, GetDeviceErrors,
SetRegulatorMode, SetDIO2AsRfSwitchCtrl, SetDIO3AsTCXOCtrl, CalibrateImage,
Calibrate, SetRxTxFallbackMode. Anything else is accepted and ignored, and the
status byte still comes back, which is what a driver doing a blind init needs.

Transmit length is the number of bytes in the last WriteBuffer, unless
SetPacketParams declared a payload length that is non-zero and no larger, in
which case that wins. The gateway driver sets a fixed `payloadLen` of 0xFF and
never updates it per packet, so it lands on the WriteBuffer length.

One observation worth carrying into hardware bring-up, not a model behaviour:
`firmware/xkoin-gateway/lib/sx1262/sx1262.h` sets `irq[8] = {0x02, 0x62, 0x00,
0x02, ...}`, so the IRQ mask is 0x0262 and the DIO1 mask is 0x0002. TX_DONE is
bit 0 and is in neither. The comment on that line says TXDONE and RXDONE are on
DIO1; the values say RX_DONE only. The model implements the datasheet
behaviour, which means a driver using those masks will never see TX_DONE.

### KQ-130F

| Chip pin | Direction | Gateway GPIO | Notes |
|---|---|---|---|
| RX | in | 17 | ESP32 TX2 into the module |
| TX | out | 18 | module into ESP32 RX2 |
| LINE | bidirectional | none | the mains; wire to other KQ-130F `LINE` pins only |
| VCC, GND | - | 5V, GND | cosmetic |

Store and forward, half duplex. Bytes arriving on RX accumulate until either
4 ms of UART silence or the 128 byte limit, then go out as one framed burst.
A module never hears its own burst. Every other module on the net decodes the
burst and replays the payload on its TX once the frame completes.

## Attributes

| Chip | Attribute | Default | Effect |
|---|---|---|---|
| SX1262 | `rssi_dbm` | -80 | reported by GetPacketStatus as `-2 x rssi` |
| SX1262 | `drop_percent` | 0 | chance a CRC-valid frame is discarded without RX_DONE |
| SX1262 | `bit_period_us` | 20 | one Manchester bit cell on ANT |
| SX1262 | `label` | `sx1262` | prefix on this instance's log lines |
| KQ-130F | `line_noise_percent` | 0 | chance a burst is corrupted before its CRC is checked |
| KQ-130F | `bit_period_us` | 200 | one Manchester bit cell on LINE |
| KQ-130F | `label` | `kq130f` | prefix on this instance's log lines |

`label` is a string attribute. `velxio-chip.h` declares
`vx_attr_register_string` and the backend runtime implements it, but the
`chip.json` schema in `docs/CUSTOM_CHIPS.md` documents only `int` and `float`
attribute types. `"type": "string"` is what the runtime needs and what the
chips read; whether the editor's schema validator accepts it is untested.

## Adding a chip to a project

Add Component, search "Custom Chip", pick it, then paste `chip.c` and
`chip.json` into the chip's own section of the file explorer and press the
hammer to compile. Or import one of the `.vlx` files in `proof/`, which carry
both chips with their source and their compiled WASM already embedded.

Import takes `.vlx` (velxio's native project JSON) or `.zip` (a Wokwi bundle).
A bare `diagram.json` is not an import format, which is why the proof ships as
`.vlx`: it is the only format that carries two boards with a sketch each.

## Compiling the chips

The published image does not ship what the chip compiler needs. On
`ghcr.io/davidmonterocrespo24/velxio:master`, digest as pulled 2026-09-12:

```
$ curl -s http://127.0.0.1:3080/api/compile-chip/status
{"available":false,"wasi_sdk":null,"sdk_include":null}
```

`/opt/wasi-sdk` is absent and so is `/app/sdk/velxio-chip.h`, so the Compile
button in the custom chip designer cannot work on a stock container. Install
both, restart so the service singleton re-resolves them, and the route works.
These are the exact commands used here:

```powershell
docker exec velxio sh -lc "cd /opt && curl -sSL -o wasi-sdk.tar.gz https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-22/wasi-sdk-22.0-linux.tar.gz && tar xzf wasi-sdk.tar.gz && mv wasi-sdk-22.0 wasi-sdk && rm wasi-sdk.tar.gz && /opt/wasi-sdk/bin/clang --version"
docker exec velxio mkdir -p /app/sdk
docker cp velxio-chip.h velxio:/app/sdk/velxio-chip.h
docker restart velxio
```

`velxio-chip.h` comes from `backend/sdk/velxio-chip.h` in the upstream repo.
After the restart:

```
$ curl -s http://127.0.0.1:3080/api/compile-chip/status
{"available":true,"wasi_sdk":"/opt/wasi-sdk","sdk_include":"/app/sdk"}
```

Compiling is a POST per chip:

```bash
python - <<'PY'
import json, urllib.request, base64, pathlib
for name in ("sx1262", "kq130f"):
    src = open(f"hardware/velxio/chips/{name}/chip.c", encoding="utf-8").read()
    cj  = open(f"hardware/velxio/chips/{name}/chip.json", encoding="utf-8").read()
    body = json.dumps({"source": src, "chip_json": cj}).encode()
    req = urllib.request.Request("http://127.0.0.1:3080/api/compile-chip/", body,
                                 {"Content-Type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=180))
    print(name, r["success"], r["byte_size"], r["stderr"][:2000])
    if r["success"]:
        pathlib.Path(f"hardware/velxio/chips/{name}/chip.wasm").write_bytes(
            base64.b64decode(r["wasm_base64"]))
PY
```

Result, both clean, no warnings:

```
sx1262: success=True bytes=16331
kq130f: success=True bytes=12949
```

Off-container the same source builds with the flags velxio uses internally:

```
$WASI_SDK/bin/clang --target=wasm32-unknown-wasip1 -O2 -nostartfiles \
  -Wl,--import-memory -Wl,--export-table -Wl,--no-entry \
  -Wl,--export=chip_setup -Wl,--allow-undefined \
  -I /path/to/sdk chip.c -o chip.wasm
```

## The proof

`proof/chip_selftest.py` loads both `chip.wasm` files into
`app.services.wasm_chip_runtime.WasmChipRuntime`, the same class the ESP32
QEMU worker instantiates, and plays the part of the wiring: SPI bytes into the
chip, a shared net fanning pin writes out to every runtime watching that GPIO,
a UART sink. It runs on virtual time, advancing a clock to the next timer
deadline rather than sleeping, because the models measure edge intervals and a
wall-clock Python loop puts its own scheduler jitter straight into those
measurements. Measured jitter on a busy loop reached half a cell, which is
exactly the Manchester margin, and frames failed at random.

```
docker cp hardware/velxio/proof/chip_selftest.py velxio:/tmp/
docker cp hardware/velxio/chips/sx1262/chip.wasm velxio:/tmp/sx1262.wasm
docker cp hardware/velxio/chips/kq130f/chip.wasm velxio:/tmp/kq130f.wasm
docker exec velxio python3 /tmp/chip_selftest.py
```

Output, at the shipped default bit periods of 20 us and 200 us:

```
SX1262: two radios, one ANT net
    A> radioA: ready
    B> radioB: ready
  [PASS] GetStatus reports STDBY_RC - status=0x22
  [PASS] WriteRegister then ReadRegister round trips - read=0xAB
  [PASS] BUSY returns low after a command
    B> radioB: rx armed
  [PASS] WriteBuffer then ReadBuffer round trips - b'xkoin ping 1'
    A> radioA: tx start, payload 12 bytes
    B> radioB: rx frame ok, len 12
    A> radioA: tx done, payload 12 bytes
  [PASS] TX_DONE raised DIO1 on the sender
  [PASS] RX_DONE raised DIO1 on the receiver - pump_ok=True
  [PASS] receiver IRQ has RX_DONE and no CRC_ERR - irq=0x0002
  [PASS] GetRxBufferStatus length matches - len=12 start=0x80
  [PASS] payload crossed the ANT net intact - b'xkoin ping 1'
  [PASS] GetPacketStatus reports rssi_dbm = -80 - rssiPkt=160
  [PASS] ClearIrqStatus lowers DIO1
  collision case: two radios transmit into one listener
    C1> tx1: ready
    C2> tx2: ready
    C3> listener: ready
    C3> listener: rx armed
    C1> tx1: tx start, payload 12 bytes
    C2> tx2: tx start, payload 12 bytes
    C3> listener: rx crc error, len 12
    C1> tx1: tx done, payload 12 bytes
    C2> tx2: tx done, payload 12 bytes
  [PASS] collision does not deliver a clean frame - irq=0x0042
  drop_percent case
    D1> sender: ready
    D2> deaf: ready
    D2> deaf: rx armed
    D1> sender: tx start, payload 12 bytes
    D2> deaf: rx dropped by drop_percent, len 12
    D1> sender: tx done, payload 12 bytes
  [PASS] drop_percent 100 suppresses RX_DONE - irq=0x0000

KQ-130F: two modules, one LINE net
    A> plcA: ready at 9600 8N1
    B> plcB: ready at 9600 8N1
    A> plcA: line tx start, bytes 12
    B> plcB: line rx ok, forwarded bytes 12
  [PASS] bytes crossed the LINE net intact - got=b'xkoin plc 1\n' pump_ok=True
  [PASS] sender did not hear itself - got=b''
  128 byte payload limit
    C> plcC: ready at 9600 8N1
    D> plcD: ready at 9600 8N1
    C> plcC: line tx start, bytes 128
    D> plcD: line rx ok, forwarded bytes 128
  [PASS] first burst carries exactly the 128 byte limit - got 128 bytes
  line_noise_percent case
    E> plcE: ready at 9600 8N1
    F> plcF: ready at 9600 8N1
    E> plcE: line tx start, bytes 12
    F> plcF: line crc error, bytes 12
    E> plcE: line tx done, bytes 12
  [PASS] line_noise_percent 100 fails the CRC and drops the burst - got=b''

All cases passed.
```

The transmitted waveform was also checked against the frame it should
produce, independently of the receiver: 228 edges captured off the ANT net,
reconstructed into 288 half cells, zero mismatches against the expected
Manchester encoding of `xkoin ping 1` with its CRC.

## Limits

**No chip-to-chip net reaches an ESP32 board.** This is the finding that
matters, and it is a property of velxio, not of these models.
`frontend/src/simulation/parts/CustomChipPart.ts` takes an ESP32-only branch
that ships the chip's WASM to the backend QEMU worker with
`pin_map = {chip pin name: ESP32 GPIO}`, resolved from the diagram's wires. A
chip pin wired only to another chip's pin has no GPIO, so it is not in the
map, and `wasm_chip_runtime.py` then refuses the watch outright:

```python
def vx_pin_watch(handle, edge, cb_idx, user_data):
    p = self._pins[handle]
    if p["gpio"] is None:
        # Chip's logical pin not wired to a real GPIO - no edges to detect.
        return
```

Putting a board GPIO on the net does not rescue it either. A chip's
`vx_pin_write` calls `qemu_picsimlab_set_pin`, which drives a pin into the
guest; the worker's `_on_pin_change` is registered as `picsimlab_write_pin`
and fires only for GPIO the firmware drives out. One chip's write never
re-enters the other chip's watch. And two ESP32 boards are two QEMU
subprocesses: `Interconnect.ts` bridges board pin to board pin over the
WebSocket at millisecond latency, with a byte-level shortcut for hardware UART
precisely because bit-level transport over that hop is too slow.

The frontend chip runtime does support chip-to-chip nets, through
`chipNets.ts` and `syntheticNetPin`, on by default. That path serves AVR and
RP2040 boards, which run in the browser. ESP32 boards never take it.

So the two-board `.vlx` files in `proof/` are correct wiring and correct
sketches, and the air link between the two boards will not carry a bit on
velxio OSS master. What to do about it, cheapest first:

1. Run the medium on AVR or RP2040 boards, where the browser chip runtime
   handles chip-to-chip nets. Loses the ESP32-S3 firmware, gains exact
   timing: `ChipRuntime.ts` backs `vx_sim_now_nanos` with simulated time
   rather than the wall clock, so the edge intervals the decoders measure
   carry no host jitter at all. It implements every import these chips use,
   string attributes included.
2. Patch the ESP32 path: give the backend worker a net-level fan-out for
   chip pins with no GPIO, the same union-find `chipNets.ts` already does in
   the frontend, and route writes between chip runtimes in one worker. Buys
   multiple radios on one board. Still not cross-board.
3. Bridge chip nets across workers through the frontend. Correct in shape,
   millisecond latency, so the bit period has to grow to tens of milliseconds.
4. Keep `chip_selftest.py` as the protocol harness and use velxio only for
   single-board firmware bring-up. This is what works today with no patching.

**A chip's UART binds to UART0.** The backend runtime wires
`vx_uart_attach` to UART0 whatever the diagram says, so on an ESP32 the
KQ-130F model receives whatever the sketch prints with `Serial.print`, not
what it writes to `Serial2`. `proof/plc_sender.ino` uses Serial2 because that
matches the hardware and the browser runtime; on the ESP32 backend it would
have to use Serial, and the sketch's own diagnostics would then travel down
the simulated mains. The frame magic means stray text is ignored rather than
mistaken for a burst.

**Fidelity the models do not claim.** No modulation of any kind: no spreading
factor, no chirp, no bandwidth, no FSK or OFDM carrier. No airtime, so a
frame takes `bit_period_us` times its bit count and nothing else. No
sensitivity, no link budget, no range, no path loss: `rssi_dbm` is a number
the chip reports, not a number it computes. No CAD, no channel activity
detection, no listen-before-talk. Collisions exist only as a failed CRC. The
KQ-130F ignores mains coupling, zero-cross timing, impedance and attenuation.
SX1262 registers are a flat 256-byte array indexed by the low address byte,
with no defaults and no side effects, so a driver that reads a chip-specific
register to identify the part gets zero.

**Timing tolerance.** Any one edge interval may stretch or shrink by up to
half a cell before a bit flips. On a host with a jittery timer, raise
`bit_period_us` until the jitter is comfortably inside that margin, or accept
CRC failures.

## What is proven and what is not

Verified on the container at `http://127.0.0.1:3080`, 2026-09-13:

- Both chips compile through velxio's own `/api/compile-chip/` route, clean,
  no warnings: sx1262 16331 bytes, kq130f 12949 bytes of WASM.
- Both compiled chips load into `WasmChipRuntime` and pass 15 behavioural
  cases, the output above. Two consecutive runs were byte identical, which
  the virtual clock guarantees.
- The transmitted ANT waveform matches the Manchester encoding of its frame
  exactly, checked against an independently generated reference.

Not verified, in the order they would bite:

- **No sketch has been compiled.** The published image ships arduino-cli
  1.5.1 with the avr, ATTinyCore and rp2040 cores only; `GET
  /api/compile/boards` returns 201 boards and none are ESP32. `POST
  /api/compile/ensure-core` with `{"board_fqbn": "esp32:esp32:esp32s3"}` was
  started here and reached 3.4 GB in `/root/.arduino15` before a DNS outage
  on the host killed it, leaving no `esp32` package. Re-run that call, then
  compile the four `.ino` files, to find out whether they build.
- **No project has been run.** Running a velxio simulation needs the browser
  frontend to drive the backend over its WebSocket; there is no headless run
  route. So there is no serial output from a board in this README, only the
  runtime-level output above.
- **The `.vlx` files have never been imported.** They satisfy
  `validatePayload` in `vlxFile.ts` by construction (format, version,
  boards, fileGroups, components, wires all present and of the right type),
  and the component and wire fields come from the upstream type definitions,
  but the `Component` interface the store actually uses was not in the
  repository tree at the path `vlxFile.ts` imports, so field names beyond
  `id`, `metadataId`, `x`, `y` and `properties` are inferred rather than
  confirmed. Expect to adjust them on first import.
- **`"type": "string"` in chip.json** is what the runtime needs for `label`;
  whether the editor's schema validator accepts it is untested.
- The container was modified to get the chip compiler working: wasi-sdk 22
  in `/opt/wasi-sdk` and the SDK header in `/app/sdk`. Both live in the
  container layer, not in a volume, so `docker rm` loses them and the
  commands above have to be repeated.
