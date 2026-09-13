// xKoin velxio proof, board A: push bytes into the KQ-130F model, which
// frames them onto LINE. UART2 on the fixed gateway pins: GPIO17 is the
// ESP32 TX (the module's RX), GPIO18 is the ESP32 RX (the module's TX).
//
// NOTE for the velxio ESP32 backend: the WASM chip runtime binds a chip's
// vx_uart_attach to UART0, not to the UART the wires imply. On that runtime
// the sketch has to talk to the module on Serial instead of Serial2. See
// hardware/velxio/README.md, "Limits".

#include <Arduino.h>

#define PIN_PLC_TX 17  // ESP32 TX2 -> module RX
#define PIN_PLC_RX 18  // ESP32 RX2 <- module TX

static uint32_t counter = 0;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, PIN_PLC_RX, PIN_PLC_TX);
  delay(100);
  Serial.println("boardA: kq130f ready, sending");
}

void loop() {
  char msg[32];
  counter++;
  snprintf(msg, sizeof msg, "xkoin plc %lu\n", (unsigned long)counter);
  Serial2.print(msg);
  Serial.print("boardA: wrote \"");
  Serial.print(msg);
  Serial.println("\" to the line");
  delay(2000);
}
