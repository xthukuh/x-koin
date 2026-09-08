// P3 proof layer: Ed25519 receipt verification at the edge (Law 4).
#ifndef XKP_RECEIPT_H
#define XKP_RECEIPT_H
#include <stdint.h>

#define XKP_RECEIPT_SIZE 44
#define XKP_RECEIPT_WIRE 108

typedef struct {
    uint8_t client_id[8], node_id[8], session[16];
    uint64_t cumulative_bytes;
    uint32_t seq;
} xkp_receipt_t;

void xkp_node_id(const uint8_t verify_key[32], uint8_t out[8]);
// 0 ok; -1 bad signature; -2 client id does not match key
int xkp_receipt_verify(const uint8_t wire[XKP_RECEIPT_WIRE],
                       const uint8_t client_vk[32], xkp_receipt_t *out);
#endif
