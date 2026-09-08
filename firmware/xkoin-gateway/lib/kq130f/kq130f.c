#include "kq130f.h"
#include <string.h>

int kq130f_send(const kq130f_hal_t *hal, const xkp_frame_t *f) {
    if (f->payload_len > KQ130F_MTU) return -1;
    uint8_t out[KQ130F_BUF];
    size_t n = xkp_pack(f, out, sizeof out);
    if (!n) return -2;
    hal->uart_write(hal->ctx, out, n);
    return 0;
}

// Streaming reassembly with 1-byte resync: scan for magic, wait for a full
// candidate, CRC-validate, otherwise shift and rescan. Survives garbage,
// split delivery, and mid-stream corruption (fed by fuzz-shaped tests).
void kq130f_rx_feed(kq130f_rx_t *rx, const uint8_t *data, size_t n) {
    while (n) {
        size_t take = sizeof rx->buf - rx->fill;
        if (take > n) take = n;
        memcpy(rx->buf + rx->fill, data, take);
        rx->fill += take;
        data += take;
        n -= take;
        for (;;) {
            if (rx->fill < XKP_OVERHEAD) break;
            if (!(rx->buf[0] == (XKP_MAGIC & 0xFF) && rx->buf[1] == (XKP_MAGIC >> 8))) {
                memmove(rx->buf, rx->buf + 1, --rx->fill);
                continue;
            }
            uint16_t plen = (uint16_t)(rx->buf[25] | (rx->buf[26] << 8));
            size_t need = (size_t)XKP_OVERHEAD + plen;
            if (plen > KQ130F_MTU || need > sizeof rx->buf) {
                memmove(rx->buf, rx->buf + 1, --rx->fill);
                continue;
            }
            if (rx->fill < need) break;
            xkp_frame_t f;
            if (xkp_unpack(rx->buf, need, &f) == XKP_OK) {
                if (rx->on_frame) rx->on_frame(&f, rx->user);
                rx->fill -= need;
                memmove(rx->buf, rx->buf + need, rx->fill);
            } else {
                memmove(rx->buf, rx->buf + 1, --rx->fill);
            }
        }
    }
}
