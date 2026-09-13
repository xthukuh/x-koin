"""Generate the two-board .vlx projects for the xKoin velxio proof.

A .vlx is velxio's native single-file project snapshot (format
"velxio-project", version 1). It is the only import format that carries two
boards with a sketch each, so the proof ships as .vlx rather than as a Wokwi
diagram.json. Each custom chip travels inside the file: its compiled WASM is
base64 in the component's `wasmBase64` property, its chip.json in `chipJson`,
and its C source in the chip's own file group so the chip stays editable and
recompilable in the UI.

Run from the repo root after compiling the chips:

    python hardware/velxio/proof/build_vlx.py

Writes hardware/velxio/proof/xkoin-lora-2board.vlx and
hardware/velxio/proof/xkoin-plc-2board.vlx.
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CHIPS = ROOT / "hardware" / "velxio" / "chips"
PROOF = ROOT / "hardware" / "velxio" / "proof"

BOARD_KIND = "esp32-s3"

# Fixed gateway pin map, hardware/pinmap.md. These must not move.
LORA_PINS = {
    "SCK": "12",
    "MISO": "13",
    "MOSI": "11",
    "NSS": "10",
    "DIO1": "14",
    "BUSY": "21",
}
PLC_PINS = {
    "RX": "17",   # module RX <- ESP32 TX2
    "TX": "18",   # module TX -> ESP32 RX2
}


def chip_component(cid: str, chip: str, x: int, y: int, attrs: dict) -> dict:
    return {
        "id": cid,
        "metadataId": "custom-chip",
        "type": "custom-chip",
        "name": chip,
        "x": x,
        "y": y,
        "rotation": 0,
        "properties": {
            "chipJson": (CHIPS / chip / "chip.json").read_text(encoding="utf-8"),
            "wasmBase64": base64.b64encode(
                (CHIPS / chip / "chip.wasm").read_bytes()
            ).decode("ascii"),
            "attrs": attrs,
        },
    }


def wire(wid: str, a_comp: str, a_pin: str, b_comp: str, b_pin: str,
         colour: str, signal: str | None = None) -> dict:
    w = {
        "id": wid,
        "start": {"componentId": a_comp, "pinName": a_pin, "x": 0, "y": 0},
        "end": {"componentId": b_comp, "pinName": b_pin, "x": 0, "y": 0},
        "waypoints": [],
        "color": colour,
    }
    if signal:
        w["signalType"] = signal
    return w


def board(bid: str, name: str, group: str, x: int) -> dict:
    return {
        "id": bid,
        "name": name,
        "boardKind": BOARD_KIND,
        "x": x,
        "y": 0,
        "activeFileGroupId": group,
        "languageMode": "arduino",
        "serialBaudRate": 115200,
        "libraries": [],
    }


def build(kind: str) -> dict:
    if kind == "lora":
        chip, pins = "sx1262", LORA_PINS
        sketch_a, sketch_b = "lora_sender.ino", "lora_receiver.ino"
        shared_pin, shared_colour, name = "ANT", "#d946ef", "xKoin LoRa two board proof"
        attrs_a = {"rssi_dbm": -80, "drop_percent": 0, "bit_period_us": 20,
                   "label": "radioA"}
        attrs_b = dict(attrs_a, label="radioB")
    else:
        chip, pins = "kq130f", PLC_PINS
        sketch_a, sketch_b = "plc_sender.ino", "plc_receiver.ino"
        shared_pin, shared_colour, name = "LINE", "#f59e0b", "xKoin PLC two board proof"
        attrs_a = {"line_noise_percent": 0, "bit_period_us": 200, "label": "plcA"}
        attrs_b = dict(attrs_a, label="plcB")

    ga, gb = "group-boardA", "group-boardB"
    ca, cb = f"chip_{chip}_a", f"chip_{chip}_b"
    boards = [board("boardA", "Board A", ga, 0), board("boardB", "Board B", gb, 900)]
    comps = [chip_component(ca, chip, 480, 40, attrs_a),
             chip_component(cb, chip, 1380, 40, attrs_b)]

    wires = []
    n = 0
    for comp, bid in ((ca, "boardA"), (cb, "boardB")):
        for pin_name, gpio in pins.items():
            n += 1
            sig = "spi" if pin_name in ("SCK", "MISO", "MOSI", "NSS") else (
                "usart" if pin_name in ("TX", "RX") else "digital")
            wires.append(wire(f"w{n}", comp, pin_name, bid, gpio, "#3b82f6", sig))
        n += 1
        wires.append(wire(f"w{n}", comp, "VCC", bid, "3V3", "#ef4444", "power-vcc"))
        n += 1
        wires.append(wire(f"w{n}", comp, "GND", bid, "GND", "#111827", "power-gnd"))
    # The medium: both chips' synthetic pin on one net, no board pin on it.
    n += 1
    wires.append(wire(f"w{n}", ca, shared_pin, cb, shared_pin, shared_colour, "digital"))

    file_groups = {
        ga: [{"name": "sketch.ino", "content": (PROOF / sketch_a).read_text(encoding="utf-8")}],
        gb: [{"name": "sketch.ino", "content": (PROOF / sketch_b).read_text(encoding="utf-8")}],
    }
    # Keep each chip's source with its component so the UI can recompile it.
    for cid in (ca, cb):
        file_groups[f"group-chip-{cid}"] = [
            {"name": "chip.c", "content": (CHIPS / chip / "chip.c").read_text(encoding="utf-8")},
            {"name": "chip.json", "content": (CHIPS / chip / "chip.json").read_text(encoding="utf-8")},
        ]

    return {
        "format": "velxio-project",
        "version": 1,
        "exportedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "name": name,
        "boards": boards,
        "fileGroups": file_groups,
        "components": comps,
        "wires": wires,
        "activeBoardId": "boardA",
    }


if __name__ == "__main__":
    for kind, out in (("lora", "xkoin-lora-2board.vlx"), ("plc", "xkoin-plc-2board.vlx")):
        path = PROOF / out
        path.write_text(json.dumps(build(kind), indent=2), encoding="utf-8")
        print(f"wrote {path} ({path.stat().st_size} bytes)")
