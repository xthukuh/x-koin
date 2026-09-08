// XKP v1 frame codec, byte-exact C port of protocol/xkp/frames.py.
// Proven against Python-generated vectors in test/host/test_core.c.
#ifndef XKP_FRAMES_H
#define XKP_FRAMES_H
#include <stddef.h>
#include <stdint.h>

#define XKP_MAGIC 0x4B58u
#define XKP_VERSION 1
#define XKP_HEADER_SIZE 27
#define XKP_CRC_SIZE 2
#define XKP_OVERHEAD (XKP_HEADER_SIZE + XKP_CRC_SIZE)

typedef enum {
    XKP_BEACON = 0, XKP_JOIN_REQ = 1, XKP_JOIN_ACK = 2, XKP_DATA = 3,
    XKP_DATA_ACK = 4, XKP_RECEIPT = 5, XKP_RECEIPT_ACK = 6,
    XKP_TELEMETRY = 7, XKP_SETTLE_NOTIFY = 8, XKP_TYPE_MAX = 8,
} xkp_type_t;

#define XKP_FLAG_ACK_REQ 0x01
#define XKP_FLAG_ENCRYPTED 0x02
#define XKP_FLAG_FRAGMENT 0x04

typedef struct {
    uint8_t ftype, flags, ttl, version;
    uint8_t src[8], dst[8];
    uint32_t seq;
    uint16_t payload_len;
    const uint8_t *payload; // borrowed pointer into the rx buffer
} xkp_frame_t;

enum { XKP_OK = 0, XKP_E_SHORT = -1, XKP_E_MAGIC = -2, XKP_E_VERSION = -3,
       XKP_E_TYPE = -4, XKP_E_LEN = -5, XKP_E_CRC = -6, XKP_E_CAP = -7 };

uint16_t xkp_crc16(const uint8_t *data, size_t len);
size_t xkp_pack(const xkp_frame_t *f, uint8_t *out, size_t cap); // 0 on error
int xkp_unpack(const uint8_t *data, size_t len, xkp_frame_t *out);
#endif
