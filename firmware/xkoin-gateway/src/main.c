// xKoin-Gateway entrypoint. Portable core (lib/xkp, lib/router, lib/crypto,
// lib/kq130f, lib/sx1262 logic) is host-proven by test/host; this file is the
// ESP-IDF wiring per the doc 02 pinout. COMPILE-UNTESTED in sandbox.
#ifdef ESP_PLATFORM
#include "driver/gpio.h"
#include "driver/spi_master.h"
#include "driver/uart.h"
#include "esp_event.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"

#include "kq130f/kq130f.h"
#include "wifi_ap/captive_portal.h"
#define SX1262_IMPL
#include "sx1262/sx1262.h"

static const char *TAG = "xkoin-gw";

// doc 02 fixed pins
#define PIN_LORA_SCK 12
#define PIN_LORA_MISO 13
#define PIN_LORA_MOSI 11
#define PIN_LORA_CS 10
#define PIN_LORA_DIO1 14
#define PIN_LORA_BUSY 21
#define PIN_LORA_RESET 9  // proposed; not fixed by doc 02
#define PIN_PLC_TX 17
#define PIN_PLC_RX 18

static spi_device_handle_t s_lora_spi;

static void hal_spi_txrx(void *ctx, const uint8_t *tx, uint8_t *rx, size_t n) {
    (void)ctx;
    spi_transaction_t t = {.length = n * 8, .tx_buffer = tx, .rx_buffer = rx};
    spi_device_transmit(s_lora_spi, &t);
}
static void hal_gpio_write(void *c, int pin, int lvl) { (void)c; gpio_set_level(pin, lvl); }
static int hal_gpio_read(void *c, int pin) { (void)c; return gpio_get_level(pin); }
static void hal_delay(void *c, uint32_t ms) { (void)c; vTaskDelay(pdMS_TO_TICKS(ms)); }

static void lora_init(void) {
    spi_bus_config_t bus = {.sclk_io_num = PIN_LORA_SCK, .miso_io_num = PIN_LORA_MISO,
                            .mosi_io_num = PIN_LORA_MOSI, .quadwp_io_num = -1,
                            .quadhd_io_num = -1};
    spi_bus_initialize(SPI2_HOST, &bus, SPI_DMA_CH_AUTO);
    spi_device_interface_config_t dev = {.mode = 0, .clock_speed_hz = 8000000,
                                         .spics_io_num = PIN_LORA_CS, .queue_size = 4};
    spi_bus_add_device(SPI2_HOST, &dev, &s_lora_spi);
    gpio_set_direction(PIN_LORA_RESET, GPIO_MODE_OUTPUT);
    gpio_set_direction(PIN_LORA_BUSY, GPIO_MODE_INPUT);
    gpio_set_direction(PIN_LORA_DIO1, GPIO_MODE_INPUT);
    sx1262_hal_t hal = {hal_spi_txrx, hal_gpio_write, hal_gpio_read, hal_delay,
                        NULL, PIN_LORA_RESET, PIN_LORA_BUSY};
    sx1262_init(&hal, SX_MODE_LORA_SF7_868);
    sx1262_rx_start(&hal);
    ESP_LOGI(TAG, "SX1262 up: LoRa SF7 868.1 MHz (GFSK 150k switchable)");
}

static void plc_uart_write(void *ctx, const uint8_t *data, size_t n) {
    (void)ctx;
    uart_write_bytes(UART_NUM_2, (const char *)data, n);
}

static kq130f_rx_t s_plc_rx;

static void on_plc_frame(const xkp_frame_t *f, void *user) {
    (void)user;
    ESP_LOGI(TAG, "PLC frame type=%d len=%d from=%02x%02x..", f->ftype,
             f->payload_len, f->src[0], f->src[1]);
    // TODO(phase 1.3): dispatch into router / receipt store
}

static void plc_task(void *arg) {
    (void)arg;
    uart_config_t uc = {.baud_rate = 9600, .data_bits = UART_DATA_8_BITS,
                        .parity = UART_PARITY_DISABLE, .stop_bits = UART_STOP_BITS_1};
    uart_param_config(UART_NUM_2, &uc);
    uart_set_pin(UART_NUM_2, PIN_PLC_TX, PIN_PLC_RX, -1, -1);
    uart_driver_install(UART_NUM_2, 1024, 1024, 0, NULL, 0);
    s_plc_rx.on_frame = on_plc_frame;
    uint8_t buf[64];
    for (;;) {
        int n = uart_read_bytes(UART_NUM_2, buf, sizeof buf, pdMS_TO_TICKS(50));
        if (n > 0) kq130f_rx_feed(&s_plc_rx, buf, (size_t)n);
    }
}

void app_main(void) {
    nvs_flash_init();
    esp_event_loop_create_default();
    captive_portal_start();
    lora_init();
    xTaskCreate(plc_task, "plc", 4096, NULL, 10, NULL);
    ESP_LOGI(TAG, "xKoin gateway skeleton up");
}
#endif
