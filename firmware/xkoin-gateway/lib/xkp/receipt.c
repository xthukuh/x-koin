#include "receipt.h"
#include <string.h>
#include "../crypto/sha256.h"
#include "../ed25519/ed25519.h"

void xkp_node_id(const uint8_t vk[32], uint8_t out[8]) {
    uint8_t digest[32];
    xk_sha256(vk, 32, digest);
    memcpy(out, digest, 8);
}

int xkp_receipt_verify(const uint8_t wire[XKP_RECEIPT_WIRE],
                       const uint8_t client_vk[32], xkp_receipt_t *out) {
    if (!ed25519_verify(wire + XKP_RECEIPT_SIZE, wire, XKP_RECEIPT_SIZE, client_vk))
        return -1;
    memcpy(out->client_id, wire, 8);
    memcpy(out->node_id, wire + 8, 8);
    memcpy(out->session, wire + 16, 16);
    uint64_t c = 0;
    for (int i = 7; i >= 0; i--) c = (c << 8) | wire[32 + i];
    out->cumulative_bytes = c;
    out->seq = (uint32_t)wire[40] | ((uint32_t)wire[41] << 8) |
               ((uint32_t)wire[42] << 16) | ((uint32_t)wire[43] << 24);
    uint8_t expect[8];
    xkp_node_id(client_vk, expect);
    if (memcmp(expect, out->client_id, 8) != 0) return -2;
    return 0;
}
