#!/usr/bin/env python3
"""Generate xKoin device wiring schematics (SVG) and pinmap.md from one
pinmap source of truth. Pins marked doc02 are fixed by the MVP plan; pins
marked proposed are this repo's allocation and need Martin's sign-off before
PCB or benchtop wiring.

    python3 gen_schematics.py   # writes xkoin-gateway.svg, xkoin-satellite.svg, pinmap.md
"""

import html

BUS_COLORS = {"SPI": "#2f81f7", "UART": "#d29922", "PWR": "#f85149",
              "GND": "#484f58", "CTRL": "#3fb950"}

GATEWAY = {
    "device": "xKoin-Gateway (ESP32-S3-DevKitC-1)",
    "peripherals": [
        ("SX1262 LoRa 868 MHz", "doc02", [
            ("GPIO12", "SCK", "SPI"), ("GPIO13", "MISO", "SPI"), ("GPIO11", "MOSI", "SPI"),
            ("GPIO10", "NSS/CS", "SPI"), ("GPIO14", "DIO1 (IRQ)", "CTRL"),
            ("GPIO21", "BUSY", "CTRL"), ("3V3", "VCC", "PWR"), ("GND", "GND", "GND"),
        ]),
        ("KQ-130F narrowband PLC", "doc02", [
            ("GPIO17", "RX  (ESP TX2)", "UART"), ("GPIO18", "TX  (ESP RX2)", "UART"),
            ("5V", "VCC (isolated side)", "PWR"), ("GND", "GND (isolated side)", "GND"),
        ]),
        ("W5500 Ethernet -> HomePlug AV", "proposed", [
            ("GPIO36", "SCK", "SPI"), ("GPIO37", "MISO", "SPI"), ("GPIO35", "MOSI", "SPI"),
            ("GPIO38", "CS", "SPI"), ("GPIO39", "INT", "CTRL"), ("GPIO40", "RST", "CTRL"),
            ("3V3", "VCC", "PWR"), ("GND", "GND", "GND"),
        ]),
        ("SIM7600E LTE (backhaul)", "proposed", [
            ("GPIO4", "RXD (ESP TX1)", "UART"), ("GPIO5", "TXD (ESP RX1)", "UART"),
            ("GPIO6", "PWRKEY", "CTRL"), ("5V", "VCC 2A peak", "PWR"), ("GND", "GND", "GND"),
        ]),
    ],
    "notes": [
        "SAFETY: KQ-130F couples to 230 V mains. Keep mains coupling network fully",
        "isolated from the logic side; opto/transformer isolation per doc 03. Never",
        "bench-test the mains side without an isolation transformer and RCD.",
        "Power: 230 V -> 5 V/3 A buck (HLK or MeanWell) -> AMS1117/buck 3V3 rail.",
    ],
}

SATELLITE = {
    "device": "xKoin-Satellite (ESP32-S3, off-grid)",
    "peripherals": [
        ("SX1262 LoRa 868 MHz", "doc02 (same map as gateway for firmware reuse)", [
            ("GPIO12", "SCK", "SPI"), ("GPIO13", "MISO", "SPI"), ("GPIO11", "MOSI", "SPI"),
            ("GPIO10", "NSS/CS", "SPI"), ("GPIO14", "DIO1 (IRQ)", "CTRL"),
            ("GPIO21", "BUSY", "CTRL"), ("3V3", "VCC", "PWR"), ("GND", "GND", "GND"),
        ]),
        ("TP4056 + 10 W solar + 18650", "doc03", [
            ("5V-IN", "Solar panel +", "PWR"), ("BAT+", "18650 +", "PWR"),
            ("OUT+", "To 3V3 boost/buck", "PWR"), ("GND", "Common ground", "GND"),
        ]),
        ("Battery sense", "proposed", [
            ("GPIO1", "VBAT divider (ADC1_CH0)", "CTRL"),
        ]),
    ],
    "notes": [
        "Deep sleep between beacon windows; SX1262 DIO1 wake. Target < 40 mA avg",
        "so a 10 W panel + 3400 mAh 18650 rides through 2 overcast days (doc 03).",
    ],
}


def render(dev: dict, path: str):
    row_h, box_w, left_x = 26, 300, 40
    right_x, gap = 640, 40
    y = 90
    blocks, wires, texts = [], [], []
    for title, provenance, pins in dev["peripherals"]:
        h = row_h * len(pins) + 62
        blocks.append((right_x, y, box_w, h, f"{title}", provenance))
        for i, (esp_pin, per_pin, bus) in enumerate(pins):
            wy = y + 62 + i * row_h - 8
            wires.append((left_x + box_w, wy, right_x, wy, BUS_COLORS[bus], esp_pin, per_pin))
        y += h + gap
    total_h = y + 140
    esp_h = total_h - 140

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{total_h}" '
           f'font-family="monospace" font-size="13">',
           f'<rect width="1000" height="{total_h}" fill="#0d1117"/>',
           f'<text x="40" y="40" fill="#e6edf3" font-size="20">{html.escape(dev["device"])}</text>',
           f'<rect x="{left_x}" y="70" width="{box_w}" height="{esp_h}" fill="#161b22" '
           f'stroke="#30363d" rx="8"/>',
           f'<text x="{left_x+16}" y="98" fill="#e6edf3" font-size="15">ESP32-S3</text>']
    for bx, by, bw, bh, title, prov in blocks:
        svg.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#161b22" '
                   f'stroke="#30363d" rx="8"/>')
        svg.append(f'<text x="{bx+12}" y="{by+22}" fill="#e6edf3">{html.escape(title)}</text>')
        svg.append(f'<text x="{bx+12}" y="{by+38}" fill="#8b949e" font-size="11">'
                   f'[{html.escape(prov)}]</text>')
    for x1, yy, x2, _, color, lpin, rpin in wires:
        svg.append(f'<line x1="{x1}" y1="{yy}" x2="{x2}" y2="{yy}" stroke="{color}" '
                   f'stroke-width="2"/>')
        svg.append(f'<text x="{x1-8}" y="{yy+4}" fill="#e6edf3" text-anchor="end">'
                   f'{html.escape(lpin)}</text>')
        svg.append(f'<text x="{x2+8}" y="{yy+4}" fill="#e6edf3">{html.escape(rpin)}</text>')
        svg.append(f'<circle cx="{x1}" cy="{yy}" r="3" fill="{color}"/>')
        svg.append(f'<circle cx="{x2}" cy="{yy}" r="3" fill="{color}"/>')
    ly = total_h - 66
    lx = 40
    for bus, color in BUS_COLORS.items():
        svg.append(f'<rect x="{lx}" y="{ly}" width="14" height="14" fill="{color}"/>')
        svg.append(f'<text x="{lx+20}" y="{ly+12}" fill="#e6edf3">{bus}</text>')
        lx += 110
    for i, note in enumerate(dev["notes"]):
        svg.append(f'<text x="40" y="{ly+34+i*16}" fill="#f0883e" font-size="11">'
                   f'{html.escape(note)}</text>')
    svg.append("</svg>")
    with open(path, "w") as fh:
        fh.write("\n".join(svg))


def pinmap_md(devices, path):
    out = ["# xKoin device pinmaps\n",
           "Provenance: `doc02` pins are fixed by the MVP plan and must not move;",
           "`proposed` pins are this repo's allocation, pending sign-off.\n"]
    for dev in devices:
        out.append(f"\n## {dev['device']}\n")
        out.append("| ESP32-S3 pin | Peripheral | Signal | Bus | Provenance |")
        out.append("|---|---|---|---|---|")
        for title, prov, pins in dev["peripherals"]:
            for esp_pin, per_pin, bus in pins:
                out.append(f"| {esp_pin} | {title} | {per_pin} | {bus} | {prov} |")
        out.append("")
        for n in dev["notes"]:
            out.append(f"> {n}")
        out.append("")
    with open(path, "w") as fh:
        fh.write("\n".join(out))


if __name__ == "__main__":
    render(GATEWAY, "xkoin-gateway.svg")
    render(SATELLITE, "xkoin-satellite.svg")
    pinmap_md([GATEWAY, SATELLITE], "pinmap.md")
    print("wrote xkoin-gateway.svg, xkoin-satellite.svg, pinmap.md")
