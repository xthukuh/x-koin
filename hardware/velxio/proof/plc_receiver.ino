// xKoin velxio proof, board B: read what the KQ-130F model replayed from
// LINE and print it. Same fixed UART2 pins as board A: GPIO17 TX, GPIO18 RX.
//
// See the note in plc_sender.ino about the ESP32 backend binding a chip's
// UART to UART0.

#include <Arduino.h>

#define PIN_PLC_TX 17
#define PIN_PLC_RX 18

static char line[160];
static size_t fill = 0;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, PIN_PLC_RX, PIN_PLC_TX);
  delay(100);
  Serial.println("boardB: kq130f ready, listening");
}

void loop() {
  while (Serial2.available()) {
    char c = (char)Serial2.read();
    if (c == '\n' || fill >= sizeof line - 1) {
      line[fill] = 0;
      if (fill) {
        Serial.print("boardB: got \"");
        Serial.print(line);
        Serial.println("\" from the line");
      }
      fill = 0;
    } else {
      line[fill++] = c;
    }
  }
  delay(2);
}
