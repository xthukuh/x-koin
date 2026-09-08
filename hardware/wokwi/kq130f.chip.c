// KQ-130F stand-in: 9600-baud UART loopback, so PLC framing code can be
// exercised end to end in simulation. UNVERIFIED against wokwi.com build.
#include "wokwi-api.h"
#include <stdlib.h>

typedef struct { uart_dev_t uart; } chip_t;

static void on_rx(void *user_data, uint8_t byte) {
  chip_t *chip = (chip_t *)user_data;
  uart_write(chip->uart, &byte, 1); // powerline echo back to the bus
}

void chip_init(void) {
  chip_t *chip = malloc(sizeof(chip_t));
  uart_config_t cfg = {
    .rx = pin_init("RX", INPUT), .tx = pin_init("TX", OUTPUT),
    .baud_rate = 9600, .rx_data = on_rx, .user_data = chip,
  };
  chip->uart = uart_init(&cfg);
}
