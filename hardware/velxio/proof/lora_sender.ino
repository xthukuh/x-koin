// xKoin velxio proof, board A: send "xkoin ping N" through the SX1262 model.
//
// Pin map is the fixed gateway map (hardware/pinmap.md): SCK 12, MISO 13,
// MOSI 11, NSS 10, DIO1 14, BUSY 21. The command sequence mirrors
// firmware/xkoin-gateway/lib/sx1262/sx1262.h so the model is exercised the
// same way the real driver exercises it.

#include <Arduino.h>
#include <SPI.h>

#define PIN_SCK 12
#define PIN_MISO 13
#define PIN_MOSI 11
#define PIN_NSS 10
#define PIN_DIO1 14
#define PIN_BUSY 21

#define OP_SET_STANDBY 0x80
#define OP_SET_PACKET_TYPE 0x8A
#define OP_SET_RF_FREQUENCY 0x86
#define OP_SET_PA_CONFIG 0x95
#define OP_SET_TX_PARAMS 0x8E
#define OP_SET_BUFFER_BASE 0x8F
#define OP_SET_MOD_PARAMS 0x8B
#define OP_SET_PACKET_PARAMS 0x8C
#define OP_SET_DIO_IRQ 0x08
#define OP_WRITE_BUFFER 0x0E
#define OP_SET_TX 0x83
#define OP_GET_IRQ_STATUS 0x12
#define OP_CLEAR_IRQ_STATUS 0x02

#define IRQ_TX_DONE 0x0001

static SPISettings spiCfg(2000000, MSBFIRST, SPI_MODE0);

static void waitBusy() {
  for (int i = 0; i < 200 && digitalRead(PIN_BUSY); i++) delay(1);
}

static void cmd(uint8_t op, const uint8_t *args, size_t n) {
  waitBusy();
  SPI.beginTransaction(spiCfg);
  digitalWrite(PIN_NSS, LOW);
  SPI.transfer(op);
  for (size_t i = 0; i < n; i++) SPI.transfer(args[i]);
  digitalWrite(PIN_NSS, HIGH);
  SPI.endTransaction();
}

static void readCmd(uint8_t op, const uint8_t *args, size_t n,
                    uint8_t *out, size_t outLen) {
  waitBusy();
  SPI.beginTransaction(spiCfg);
  digitalWrite(PIN_NSS, LOW);
  SPI.transfer(op);
  for (size_t i = 0; i < n; i++) SPI.transfer(args[i]);
  for (size_t i = 0; i < outLen; i++) out[i] = SPI.transfer(0x00);
  digitalWrite(PIN_NSS, HIGH);
  SPI.endTransaction();
}

static uint16_t getIrq() {
  uint8_t r[3];
  readCmd(OP_GET_IRQ_STATUS, NULL, 0, r, 3);
  return ((uint16_t)r[1] << 8) | r[2];
}

static void clearIrq() {
  uint8_t a[2] = {0xFF, 0xFF};
  cmd(OP_CLEAR_IRQ_STATUS, a, 2);
}

static void radioInit() {
  uint8_t stby = 0x00;
  cmd(OP_SET_STANDBY, &stby, 1);
  uint8_t pt = 0x01; // LoRa
  cmd(OP_SET_PACKET_TYPE, &pt, 1);
  // 868.1 MHz: freq * 2^25 / 32e6
  uint32_t fr = (uint32_t)(((uint64_t)868100000ull << 25) / 32000000ull);
  uint8_t f[4] = {(uint8_t)(fr >> 24), (uint8_t)(fr >> 16), (uint8_t)(fr >> 8), (uint8_t)fr};
  cmd(OP_SET_RF_FREQUENCY, f, 4);
  uint8_t pa[4] = {0x04, 0x07, 0x00, 0x01};
  cmd(OP_SET_PA_CONFIG, pa, 4);
  uint8_t tp[2] = {0x16, 0x04};
  cmd(OP_SET_TX_PARAMS, tp, 2);
  uint8_t base[2] = {0x00, 0x80};
  cmd(OP_SET_BUFFER_BASE, base, 2);
  uint8_t mp[4] = {0x07, 0x04, 0x01, 0x00}; // SF7 BW125 CR4/5
  cmd(OP_SET_MOD_PARAMS, mp, 4);
  uint8_t pp[6] = {0x00, 0x08, 0x00, 0x00, 0x01, 0x00}; // payloadLen set per packet
  cmd(OP_SET_PACKET_PARAMS, pp, 6);
  // irqMask all, DIO1 = TX_DONE for this board
  uint8_t irq[8] = {0xFF, 0xFF, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00};
  cmd(OP_SET_DIO_IRQ, irq, 8);
}

static void sendPacket(const char *msg) {
  uint8_t len = (uint8_t)strlen(msg);
  uint8_t pp[6] = {0x00, 0x08, 0x00, len, 0x01, 0x00};
  cmd(OP_SET_PACKET_PARAMS, pp, 6);

  waitBusy();
  SPI.beginTransaction(spiCfg);
  digitalWrite(PIN_NSS, LOW);
  SPI.transfer(OP_WRITE_BUFFER);
  SPI.transfer(0x00);
  for (uint8_t i = 0; i < len; i++) SPI.transfer((uint8_t)msg[i]);
  digitalWrite(PIN_NSS, HIGH);
  SPI.endTransaction();

  uint8_t t[3] = {0x00, 0x00, 0x00}; // no timeout
  cmd(OP_SET_TX, t, 3);
}

static uint32_t counter = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_NSS, OUTPUT);
  digitalWrite(PIN_NSS, HIGH);
  pinMode(PIN_BUSY, INPUT);
  pinMode(PIN_DIO1, INPUT);
  SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_NSS);
  delay(50);
  radioInit();
  clearIrq();
  Serial.println("boardA: sx1262 ready, sending");
}

void loop() {
  char msg[32];
  counter++;
  snprintf(msg, sizeof msg, "xkoin ping %lu", (unsigned long)counter);
  sendPacket(msg);

  unsigned long t0 = millis();
  while (digitalRead(PIN_DIO1) == LOW && millis() - t0 < 3000) delay(1);
  uint16_t irq = getIrq();
  if (irq & IRQ_TX_DONE) {
    Serial.print("boardA: sent \"");
    Serial.print(msg);
    Serial.println("\"");
  } else {
    Serial.println("boardA: TX_DONE not seen");
  }
  clearIrq();
  delay(2000);
}
