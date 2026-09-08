// KQ-130F narrowband PLC link: 9600 baud byte stream carrying XKP frames.
// HAL function pointers keep this host-testable; the resync assembler is the
// part that matters and it is proven in test_core.c.
#ifndef XK_KQ130F_H
#define XK_KQ130F_H
#include <stddef.h>
#include <stdint.h>
#include "../xkp/frames.h"

#define KQ130F_MTU 128
#define KQ130F_BUF (XKP_OVERHEAD + KQ130F_MTU)

typedef struct {
    void (*uart_write)(void *ctx, const uint8_t *data, size_t n);
    void *ctx;
} kq130f_hal_t;

typedef struct {
    uint8_t buf[2 * KQ130F_BUF];
    size_t fill;
    void (*on_frame)(const xkp_frame_t *f, void *user);
    void *user;
} kq130f_rx_t;

int kq130f_send(const kq130f_hal_t *hal, const xkp_frame_t *f);
void kq130f_rx_feed(kq130f_rx_t *rx, const uint8_t *data, size_t n);
#endif
