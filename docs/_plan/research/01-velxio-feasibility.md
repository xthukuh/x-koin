# Velxio feasibility and alternatives

Research agent report, 2026-09-12, condensed to the facts the deployment and chip-model work depends on. Every claim was checked against the live repo or site on that date.

## Headline

Self-hosting velxio is supported: one Docker image, port 80, any Host header, Traefik-ready. The self-hosted image runs ESP32-S3 (QEMU, Xtensa LX7), ESP32, ESP32-C3, AVR and RP2040 boards, several boards on one canvas talking over drawn UART, I2C and SPI wires, and user-written custom chips in C compiled to WASM that run on the ESP32 backend with SPI slave, I2C slave and UART APIs. What it does not have is any LoRa or power-line part: the Wio-E5 example on velxio.dev is a closed-overlay AT-command mock with a manual "gateway in range" button, not a radio, and it is absent from the open-source build. For xKoin the SX1262 and KQ-130F models are written as custom chips, and the shared medium is a synthetic "antenna" pin wired to one net on the canvas.

## Facts

- Author David Montero Crespo. Dual licence: AGPLv3 for personal, educational and open-source use, commercial licence otherwise (https://github.com/davidmonterocrespo24/velxio#license). AGPL means a network deployment must offer its source: an unmodified upstream image is covered by pointing at the upstream repo; a patched frontend (baked-in examples, new parts) must be published.
- Image `ghcr.io/davidmonterocrespo24/velxio:master`, the only tag; pin by digest. 1.51 GB compressed, several GB on disk (bundles ESP-IDF and QEMU).
- Run command from the README:

      docker run -d --name velxio -p 3080:80 \
        -v velxio-data:/app/data \
        -v velxio-arduino-libs:/root/.arduino15 \
        -v velxio-arduino-user-libs:/root/Arduino \
        -v velxio-ccache:/var/cache/ccache \
        -v velxio-build:/var/lib/velxio-build \
        ghcr.io/davidmonterocrespo24/velxio:master

  Container port 80, healthcheck GET /health. Env: FRONTEND_URL (dev CORS only), VELXIO_NEWS=off to stop the news fetch. SECRET_KEY auto-generates into /app/data. Without the five volumes the first compile after each restart takes 5 to 7 minutes instead of seconds.
- No auth, no database, no server-side project persistence in the OSS build: work is lost on tab refresh unless exported. Backend routes: compile, compile_chip, compile_rom, flash, intellisense, iot_gateway, libraries, micropython_libs, news, simulation.
- MCP server in-tree (docs/MCP.md): compile_project, run_project, import_wokwi_json, export_wokwi_json, create_circuit, update_circuit, generate_code_files, over stdio or SSE on port 8002. Claude Code can drive a running instance.
- Languages: Arduino C++, MicroPython, ESP-IDF. Pre-built .hex/.bin/.elf upload exists since 2.0.1. Sketches compiled inside velxio get their WiFi SSID literal rewritten to an emulated AP; pre-built firmware does not.
- Boards in the self-hosted image: Uno, Nano, Mega, ATtiny85; Pico, Pico W; ESP32 DevKit V1, DevKit-C V4, ESP32-CAM, Lolin32 Lite; ESP32-S3 DevKit, XIAO ESP32-S3, Nano ESP32; ESP32-C3 DevKit, XIAO C3, C3 SuperMini. Hosted only: STM32, Raspberry Pi Linux, ESP32-C6, branded boards.
- Parts: 157 in the OSS catalogue (displays, sensors, inputs, outputs, motors, passives, logic). No LoRa, SX126x, SX127x, RFM95, nRF24 or PLC part anywhere in the tree.
- Project formats: Wokwi-compatible diagram.json (parts, connections as [from, to, colour, hints]); native .vlx single-file JSON (format "velxio-project", version 1, boards[], fileGroups{}, components[], wires[]); .zip Wokwi bundle (diagram.json + sketch + libraries.txt). Import through the toolbar Import button or the file-explorer Open project button. No load-from-URL, no embed route. Permanent URLs exist only for examples compiled into the frontend (frontend/src/data/examples-*.ts, served at /example/<id>).
- Custom chips (docs/CUSTOM_CHIPS.md): chip.json (schema velxio-chip/v1, pins, attributes, optional display) plus a C file using velxio-chip.h: vx_pin_register, vx_pin_watch, vx_pin_read/write, vx_i2c_attach, vx_spi_attach/start/stop, vx_uart_attach/vx_uart_write, vx_timer_*, vx_log, vx_framebuffer_*. On the ESP32 backend (docs/wiki/custom-chips-esp32-backend-runtime.md) the chip WASM runs in wasmtime inside the QEMU host process; all pin, SPI, UART, I2C and timer calls work; DAC injection and framebuffer are deferred. Chips have shared-nothing memory and talk only through wires.
- No Chrome extension. Web Serial flashing exists on velxio.dev and the desktop app only; the OSS web build has a seam but no flasher. A VS Code extension is in-tree (vscode-extension/, 0.2.0 vsix).
- Pedigree: vendors Wokwi's MIT pieces (avr8js, rp2040js, wokwi-elements); ESP32 on the lcgamboa QEMU fork.

## Alternatives

| Tool | Self-host | Licence | ESP32-S3 | Custom chips | RF medium | Browser UI | Multi-device |
|---|---|---|---|---|---|---|---|
| Self-hosted velxio | Yes | AGPLv3 or commercial | Yes | Yes (C to WASM) | None; wire an antenna net | Yes | Yes |
| Wokwi cloud | No | Engine proprietary | Yes | Yes | No part | Yes | No (issue 186 open since 2021) |
| Wokwi CLI / VS Code | No (client of Wokwi servers) | MIT client; VS Code is Hobby+ EUR 8.1/mo, offline Pro EUR 20/seat | Yes | Yes | No | Partly | No |
| SimulIDE | Desktop | AGPLv3 | Experimental, "not really usable" | Script | No | No | Limited |
| espressif/qemu | Yes | GPLv2 | Best fidelity; no WiFi | QEMU devices in C | None | No | Only via sockets you build |
| Renode | Yes | MIT | Not on the supported list | C# or Python | 802.15.4 and BLE media with range and loss; no LoRa | Desktop only | Yes |
| FLoRa (OMNeT++) | Yes | LGPLv3 | No MCU | n/a | Full LoRa PHY/MAC | No | Many nodes |

## Recommendation

1. Self-hosted velxio plus two custom chips (SX1262 over SPI, KQ-130F over UART) and an antenna-bus convention. Only option that is self-hosted, free, visual, runs the real ESP32-S3 firmware and shows several boards talking. Cost: the chip models, three QEMU processes per demo (budget CPU and RAM), no persistence without export.
2. Renode for repeatable multi-node protocol tests later; no browser, no ESP32-S3 platform yet.
3. QEMU plus custom mocks: velxio's backend without its frontend.
4. Wokwi: what is used today; cannot show a mesh, not self-hostable, local workflow is paid.

FLoRa stays in reserve for arguing about airtime and collisions at scale; it models LoRa but not the firmware.

## Two ways to ship the demos, for Martin to choose

A. Unmodified upstream image on the VPS; xKoin demos as .vlx import files kept in this private repo (hardware/velxio/*.vlx) and loaded through the Import button or the MCP import tool. No AGPL publication duty beyond linking upstream; no permanent per-demo URL. B. A public fork with examples-xkoin.ts baked in; permanent URLs such as https://velxio.thuku.dev/example/xkoin-mesh-demo; the fork, including the demo firmware and chip models, must be published under AGPLv3.

## Host sizing note

srv1837953 has 2 vCPU and 7.9 GB RAM with about 3 GB in use by n8n, xos, Traefik and others. Each ESP32-S3 board is a QEMU subprocess; a three-board demo will be slow there. Author and test on the Windows host with Docker Desktop, deploy the same image to the VPS for sharing, and expect to stop idle simulations.

## Decision update (2026-09-13)

Martin chose the unmodified image plus .vlx files first; the chip models then showed that velxio's ESP32 backend carries no chip-to-chip net (hardware/velxio/README.md, Limits), so a multi-board ESP32-S3 demo cannot run on stock velxio. Martin then chose the fork route: the fork lives at https://github.com/xthukuh/velxio (AGPLv3), branch feat/esp32-chip-nets adds net fan-out inside a worker, a cross-board bridge, the UART binding fix and the wasi-sdk compile toolchain; the patch is published and offered upstream, while the xKoin demos stay .vlx files in this private repo.
