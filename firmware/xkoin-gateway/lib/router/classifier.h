// Router phase P2 gate: free LAN vs metered WAN (doc 02 phase 1.3) plus the
// Law 3 credit window (never extend more than 2x receipt interval unproven).
#ifndef XKP_CLASSIFIER_H
#define XKP_CLASSIFIER_H
#include <stdbool.h>
#include <stdint.h>

typedef struct {
    bool admitted;
    uint64_t delivered_bytes;
    uint64_t proven_bytes;
    uint32_t receipt_interval;
} xkp_session_t;

bool xkp_ip_is_lan(uint32_t ip_host_order);
bool xkp_gate_allow_wan(const xkp_session_t *s);
#endif
