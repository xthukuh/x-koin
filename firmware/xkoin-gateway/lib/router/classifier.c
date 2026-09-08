#include "classifier.h"

bool xkp_ip_is_lan(uint32_t ip) {
    if ((ip >> 24) == 10) return true;                       // 10/8
    if ((ip >> 24) == 127) return true;                      // loopback
    if ((ip >> 20) == 0xAC1) return true;                    // 172.16/12
    if ((ip >> 16) == 0xC0A8) return true;                   // 192.168/16
    if ((ip >> 16) == 0xA9FE) return true;                   // 169.254/16 link-local
    if ((ip >> 28) == 0xE) return true;                      // 224/4 multicast
    if (ip == 0xFFFFFFFFu) return true;                      // broadcast
    return false;
}

bool xkp_gate_allow_wan(const xkp_session_t *s) {
    if (!s->admitted) return false;
    uint64_t unproven = s->delivered_bytes - s->proven_bytes;
    return unproven <= (uint64_t)2 * s->receipt_interval;
}
