// SX1262 driver: LoRa SF7/BW125/CR4:5 @ 868.1 MHz plus GFSK 150 kbps adaptive
// mode (MVP decision 2026-09-08). HAL is a function-pointer table so the
// command sequencing is host-testable against a recording mock; the same code
// runs on ESP-IDF with an spi_master-backed HAL (see src/main.c).
//
// Opcodes per Semtech DS.SX1261-2. Values marked VERIFY are to be confirmed
// against datasheet tables during hardware bring-up.
#ifndef XK_SX1262_H
#define XK_SX1262_H
#include <stddef.h>
#include <stdint.h>

typedef struct {
    void (*spi_txrx)(void *ctx, const uint8_t *tx, uint8_t *rx, size_t n);
    void (*gpio_write)(void *ctx, int pin, int level);
    int (*gpio_read)(void *ctx, int pin);
    void (*delay_ms)(void *ctx, uint32_t ms);
    void *ctx;
    int pin_reset;
    int pin_busy;
} sx1262_hal_t;

typedef enum { SX_MODE_LORA_SF7_868 = 0, SX_MODE_GFSK_150K = 1 } sx1262_mode_t;

int sx1262_init(const sx1262_hal_t *hal, sx1262_mode_t mode);
int sx1262_set_mode(const sx1262_hal_t *hal, sx1262_mode_t mode);
int sx1262_tx(const sx1262_hal_t *hal, const uint8_t *data, uint8_t len);
int sx1262_rx_start(const sx1262_hal_t *hal);
uint32_t sx1262_freq_reg(uint32_t freq_hz);
void sx1262_gfsk_bitrate_bytes(uint32_t bitrate_bps, uint8_t out[3]);

#endif
#ifdef SX1262_IMPL
#include <string.h>

#define OP_SET_STANDBY 0x80
#define OP_SET_PACKET_TYPE 0x8A
#define OP_SET_RF_FREQUENCY 0x86
#define OP_SET_PA_CONFIG 0x95
#define OP_SET_TX_PARAMS 0x8E
#define OP_SET_BUFFER_BASE 0x8F
#define OP_SET_MOD_PARAMS 0x8B
#define OP_SET_PACKET_PARAMS 0x8C
#define OP_SET_DIO_IRQ 0x08
#define OP_SET_DIO2_RFSW 0x9D
#define OP_WRITE_BUFFER 0x0E
#define OP_SET_TX 0x83
#define OP_SET_RX 0x82

#define PACKET_TYPE_GFSK 0x00
#define PACKET_TYPE_LORA 0x01

static void wait_busy(const sx1262_hal_t *h) {
    for (int i = 0; i < 1000 && h->gpio_read(h->ctx, h->pin_busy); i++)
        h->delay_ms(h->ctx, 1);
}

static void cmd(const sx1262_hal_t *h, uint8_t op, const uint8_t *args, size_t n) {
    uint8_t tx[16];
    uint8_t rx[16];
    tx[0] = op;
    if (n) memcpy(tx + 1, args, n);
    wait_busy(h);
    h->spi_txrx(h->ctx, tx, rx, n + 1);
}

uint32_t sx1262_freq_reg(uint32_t freq_hz) {
    // freq_reg = freq * 2^25 / 32 MHz (13.4.1)
    return (uint32_t)(((uint64_t)freq_hz << 25) / 32000000u);
}

void sx1262_gfsk_bitrate_bytes(uint32_t bitrate_bps, uint8_t out[3]) {
    // BR = 32 * Fxtal / bitrate (13.4.5.1); 150 kbps -> 6827 = 0x001AAB
    uint32_t br = (uint32_t)((32ull * 32000000u + bitrate_bps / 2) / bitrate_bps);
    out[0] = (uint8_t)(br >> 16);
    out[1] = (uint8_t)(br >> 8);
    out[2] = (uint8_t)br;
}

static void set_frequency(const sx1262_hal_t *h, uint32_t hz) {
    uint32_t r = sx1262_freq_reg(hz);
    uint8_t a[4] = {(uint8_t)(r >> 24), (uint8_t)(r >> 16), (uint8_t)(r >> 8), (uint8_t)r};
    cmd(h, OP_SET_RF_FREQUENCY, a, 4);
}

int sx1262_set_mode(const sx1262_hal_t *h, sx1262_mode_t mode) {
    uint8_t standby_rc = 0x00;
    cmd(h, OP_SET_STANDBY, &standby_rc, 1);
    if (mode == SX_MODE_LORA_SF7_868) {
        uint8_t pt = PACKET_TYPE_LORA;
        cmd(h, OP_SET_PACKET_TYPE, &pt, 1);
        set_frequency(h, 868100000u);
        // SF7, BW 125 kHz (0x04), CR 4/5 (0x01), LDRO off
        uint8_t mp[4] = {0x07, 0x04, 0x01, 0x00};
        cmd(h, OP_SET_MOD_PARAMS, mp, 4);
        // preamble 8, explicit header, max len 255, CRC on, IQ standard
        uint8_t pp[6] = {0x00, 0x08, 0x00, 0xFF, 0x01, 0x00};
        cmd(h, OP_SET_PACKET_PARAMS, pp, 6);
    } else {
        uint8_t pt = PACKET_TYPE_GFSK;
        cmd(h, OP_SET_PACKET_TYPE, &pt, 1);
        set_frequency(h, 868100000u);
        uint8_t mp[8];
        sx1262_gfsk_bitrate_bytes(150000u, mp);       // BR
        mp[3] = 0x09;                                 // Gaussian BT 0.5
        mp[4] = 0x0A;                                 // RX_BW_234300: Carson 2*(37.5k+75k)=225 kHz; DS tbl 13-45 verified 2026-09-09 (0x0B is 117.3 kHz)
        // Fdev = 37.5 kHz (h = 0.5): reg = fdev * 2^25 / 32 MHz
        uint32_t fd = (uint32_t)(((uint64_t)37500u << 25) / 32000000u);
        mp[5] = (uint8_t)(fd >> 16);
        mp[6] = (uint8_t)(fd >> 8);
        mp[7] = (uint8_t)fd;
        cmd(h, OP_SET_MOD_PARAMS, mp, 8);
    }
    return 0;
}

int sx1262_init(const sx1262_hal_t *h, sx1262_mode_t mode) {
    h->gpio_write(h->ctx, h->pin_reset, 0);
    h->delay_ms(h->ctx, 2);
    h->gpio_write(h->ctx, h->pin_reset, 1);
    h->delay_ms(h->ctx, 10);
    uint8_t standby_rc = 0x00;
    cmd(h, OP_SET_STANDBY, &standby_rc, 1);
    uint8_t rfsw = 0x01;
    cmd(h, OP_SET_DIO2_RFSW, &rfsw, 1);  // DIO2 drives the RF switch
    uint8_t pa[4] = {0x04, 0x07, 0x00, 0x01};  // +22 dBm PA (13.1.14)
    cmd(h, OP_SET_PA_CONFIG, pa, 4);
    uint8_t txp[2] = {0x16, 0x04};  // 22 dBm, 200 us ramp
    cmd(h, OP_SET_TX_PARAMS, txp, 2);
    uint8_t base[2] = {0x00, 0x80};  // tx base 0x00, rx base 0x80
    cmd(h, OP_SET_BUFFER_BASE, base, 2);
    uint8_t irq[8] = {0x02, 0x62, 0x00, 0x02, 0, 0, 0, 0};  // TXDONE|RXDONE... on DIO1
    cmd(h, OP_SET_DIO_IRQ, irq, 8);
    return sx1262_set_mode(h, mode);
}

int sx1262_tx(const sx1262_hal_t *h, const uint8_t *data, uint8_t len) {
    uint8_t buf[258];
    buf[0] = OP_WRITE_BUFFER;
    buf[1] = 0x00;  // offset
    memcpy(buf + 2, data, len);
    uint8_t rx[258];
    wait_busy(h);
    h->spi_txrx(h->ctx, buf, rx, (size_t)len + 2);
    uint8_t t[3] = {0xFF, 0xFF, 0xFF};  // no timeout
    cmd(h, OP_SET_TX, t, 3);
    return 0;
}

int sx1262_rx_start(const sx1262_hal_t *h) {
    uint8_t t[3] = {0xFF, 0xFF, 0xFF};  // continuous rx
    cmd(h, OP_SET_RX, t, 3);
    return 0;
}
#endif
