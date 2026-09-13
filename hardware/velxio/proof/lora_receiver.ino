// xKoin velxio proof, board B: receive through the SX1262 model and print it.
//
// Same fixed gateway pin map as board A: SCK 12, MISO 13, MOSI 11, NSS 10,
// DIO1 14, BUSY 21. Board B's chip has its ANT pin on the same net as board
// A's, so anything board A transmits arrives here.

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
#define OP_SET_BUFFER_BASE 0x8F
#define OP_SET_MOD_PARAMS 0x8B
#define OP_SET_PACKET_PARAMS 0x8C
#define OP_SET_DIO_IRQ 0x08
#define OP_READ_BUFFER 0x1E
#define OP_SET_RX 0x82
#define OP_GET_IRQ_STATUS 0x12
#define OP_CLEAR_IRQ_STATUS 0x02
#define OP_GET_RX_BUFFER_STATUS 0x13
#define OP_GET_PACKET_STATUS 0x14

#define IRQ_RX_DONE 0x0002
#define IRQ_CRC_ERR 0x0040

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
  uint8_t pt = 0x01;
  cmd(OP_SET_PACKET_TYPE, &pt, 1);
  uint32_t fr = (uint32_t)(((uint64_t)868100000ull << 25) / 32000000ull);
  uint8_t f[4] = {(uint8_t)(fr >> 24), (uint8_t)(fr >> 16), (uint8_t)(fr >> 8), (uint8_t)fr};
  cmd(OP_SET_RF_FREQUENCY, f, 4);
  uint8_t base[2] = {0x00, 0x80};
  cmd(OP_SET_BUFFER_BASE, base, 2);
  uint8_t mp[4] = {0x07, 0x04, 0x01, 0x00};
  cmd(OP_SET_MOD_PARAMS, mp, 4);
  uint8_t pp[6] = {0x00, 0x08, 0x00, 0xFF, 0x01, 0x00};
  cmd(OP_SET_PACKET_PARAMS, pp, 6);
  // irqMask all, DIO1 = RX_DONE
  uint8_t irq[8] = {0xFF, 0xFF, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00};
  cmd(OP_SET_DIO_IRQ, irq, 8);
}

static void armRx() {
  uint8_t t[3] = {0xFF, 0xFF, 0xFF}; // continuous
  cmd(OP_SET_RX, t, 3);
}

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
  armRx();
  Serial.println("boardB: sx1262 ready, listening");
}

void loop() {
  if (digitalRead(PIN_DIO1) == LOW) {
    delay(2);
    return;
  }
  uint16_t irq = getIrq();
  if (irq & IRQ_RX_DONE) {
    uint8_t st[3];
    readCmd(OP_GET_RX_BUFFER_STATUS, NULL, 0, st, 3);
    uint8_t len = st[1];
    uint8_t start = st[2];

    uint8_t ps[4];
    readCmd(OP_GET_PACKET_STATUS, NULL, 0, ps, 4);
    int rssi = -((int)ps[1]) / 2;

    if (irq & IRQ_CRC_ERR) {
      Serial.println("boardB: frame with CRC error, dropped");
    } else {
      uint8_t args[2] = {start, 0x00};
      uint8_t buf[64];
      if (len > sizeof buf - 1) len = sizeof buf - 1;
      readCmd(OP_READ_BUFFER, args, 2, buf, len);
      buf[len] = 0;
      Serial.print("boardB: got \"");
      Serial.print((char *)buf);
      Serial.print("\" rssi=");
      Serial.print(rssi);
      Serial.println(" dBm");
    }
  }
  clearIrq();
  armRx();
}
