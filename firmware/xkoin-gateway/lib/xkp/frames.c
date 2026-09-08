#include "frames.h"
#include <string.h>

uint16_t xkp_crc16(const uint8_t *data, size_t len) {
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= (uint16_t)data[i] << 8;
        for (int b = 0; b < 8; b++)
            crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
    }
    return crc;
}

static void put16(uint8_t *p, uint16_t v) { p[0] = v & 0xFF; p[1] = v >> 8; }
static void put32(uint8_t *p, uint32_t v) {
    p[0] = v & 0xFF; p[1] = (v >> 8) & 0xFF; p[2] = (v >> 16) & 0xFF; p[3] = v >> 24;
}
static uint16_t get16(const uint8_t *p) { return (uint16_t)(p[0] | (p[1] << 8)); }
static uint32_t get32(const uint8_t *p) {
    return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}

size_t xkp_pack(const xkp_frame_t *f, uint8_t *out, size_t cap) {
    size_t total = XKP_OVERHEAD + f->payload_len;
    if (cap < total || f->ftype > XKP_TYPE_MAX) return 0;
    put16(out, XKP_MAGIC);
    out[2] = (uint8_t)(((f->version & 0x0F) << 4) | (f->ftype & 0x0F));
    out[3] = f->flags;
    out[4] = f->ttl;
    memcpy(out + 5, f->src, 8);
    memcpy(out + 13, f->dst, 8);
    put32(out + 21, f->seq);
    put16(out + 25, f->payload_len);
    if (f->payload_len) memcpy(out + XKP_HEADER_SIZE, f->payload, f->payload_len);
    put16(out + XKP_HEADER_SIZE + f->payload_len,
          xkp_crc16(out, XKP_HEADER_SIZE + f->payload_len));
    return total;
}

int xkp_unpack(const uint8_t *data, size_t len, xkp_frame_t *out) {
    if (len < XKP_OVERHEAD) return XKP_E_SHORT;
    if (get16(data) != XKP_MAGIC) return XKP_E_MAGIC;
    uint8_t vt = data[2];
    if ((vt >> 4) != XKP_VERSION) return XKP_E_VERSION;
    if ((vt & 0x0F) > XKP_TYPE_MAX) return XKP_E_TYPE;
    uint16_t plen = get16(data + 25);
    if (len != (size_t)XKP_HEADER_SIZE + plen + XKP_CRC_SIZE) return XKP_E_LEN;
    if (xkp_crc16(data, XKP_HEADER_SIZE + plen) != get16(data + XKP_HEADER_SIZE + plen))
        return XKP_E_CRC;
    out->version = vt >> 4;
    out->ftype = vt & 0x0F;
    out->flags = data[3];
    out->ttl = data[4];
    memcpy(out->src, data + 5, 8);
    memcpy(out->dst, data + 13, 8);
    out->seq = get32(data + 21);
    out->payload_len = plen;
    out->payload = data + XKP_HEADER_SIZE;
    return XKP_OK;
}
