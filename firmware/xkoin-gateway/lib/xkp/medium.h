// Medium selection + quarantine, port of the proven sim policy (spec s1).
#ifndef XKP_MEDIUM_H
#define XKP_MEDIUM_H
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct {
    const char *name;
    uint32_t bps;
    uint16_t mtu;
    bool up;
    float loss_ewma;
    uint8_t fail_streak;
    uint32_t quarantine_until_ms;
} xkp_medium_t;

#define XKP_QUARANTINE_MS 2000
#define XKP_QUARANTINE_STREAK 3

bool xkp_medium_live(const xkp_medium_t *m, uint32_t now_ms);
float xkp_medium_score(const xkp_medium_t *m);
xkp_medium_t *xkp_medium_best(xkp_medium_t *arr, size_t n, uint32_t now_ms);
void xkp_medium_observe(xkp_medium_t *m, bool success, uint32_t now_ms);
#endif
