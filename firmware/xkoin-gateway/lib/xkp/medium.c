#include "medium.h"

bool xkp_medium_live(const xkp_medium_t *m, uint32_t now_ms) {
    return m->up && now_ms >= m->quarantine_until_ms;
}

float xkp_medium_score(const xkp_medium_t *m) {
    float loss = m->loss_ewma > 0.99f ? 0.99f : m->loss_ewma;
    return (float)m->bps * (1.0f - loss);
}

xkp_medium_t *xkp_medium_best(xkp_medium_t *arr, size_t n, uint32_t now_ms) {
    xkp_medium_t *best = 0;
    for (size_t i = 0; i < n; i++) {
        if (!xkp_medium_live(&arr[i], now_ms)) continue;
        if (!best || xkp_medium_score(&arr[i]) > xkp_medium_score(best)) best = &arr[i];
    }
    return best;
}

void xkp_medium_observe(xkp_medium_t *m, bool success, uint32_t now_ms) {
    m->loss_ewma = 0.85f * m->loss_ewma + 0.15f * (success ? 0.0f : 1.0f);
    if (success) {
        m->fail_streak = 0;
        return;
    }
    if (++m->fail_streak >= XKP_QUARANTINE_STREAK) {
        m->quarantine_until_ms = now_ms + XKP_QUARANTINE_MS;
        m->fail_streak = 0;
    }
}
