// Minimal SX1262 stand-in for Wokwi driver bring-up: answers GetStatus (0xC0)
// and holds BUSY low so the SPI driver's init handshake can be exercised.
// UNVERIFIED against wokwi.com build (host unreachable from dev sandbox).
#include "wokwi-api.h"
#include <stdlib.h>

typedef struct { pin_t busy; pin_t dio1; uint8_t last; } chip_t;

static void on_spi_done(void *user_data, uint8_t *buf, uint32_t count) {
  chip_t *chip = (chip_t *)user_data;
  for (uint32_t i = 0; i < count; i++) {
    uint8_t cmd = buf[i];
    buf[i] = (chip->last == 0xC0) ? 0x22 : 0x00; // STDBY_RC status
    chip->last = cmd;
  }
}

void chip_init(void) {
  chip_t *chip = malloc(sizeof(chip_t));
  chip->last = 0;
  chip->busy = pin_init("BUSY", OUTPUT);
  chip->dio1 = pin_init("DIO1", OUTPUT);
  pin_write(chip->busy, LOW);
  pin_write(chip->dio1, LOW);
  spi_config_t cfg = {
    .sck = pin_init("SCK", INPUT), .mosi = pin_init("MOSI", INPUT),
    .miso = pin_init("MISO", INPUT), .done = on_spi_done, .user_data = chip,
  };
  spi_init(&cfg);
}
