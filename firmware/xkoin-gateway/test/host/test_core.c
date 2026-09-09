// Host-native proof of the portable firmware core. Every Law with edge-side
// enforcement is exercised here in C, against vectors signed by the Python
// reference, before any hardware exists.
//   make && ./test_core
#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "../../lib/xkp/frames.h"
#include "../../lib/xkp/receipt.h"
#include "../../lib/xkp/medium.h"
#include "../../lib/router/classifier.h"
#include "../../lib/kq130f/kq130f.h"
#include "../../lib/xkcrypto/sha256.h"
#define SX1262_IMPL
#include "../../lib/sx1262/sx1262.h"
#include "vectors.h"

static int checks = 0;
#define CHECK(cond, msg) do { assert((cond) && msg); checks++; } while (0)

static void test_crc_and_sha(void) {
    CHECK(xkp_crc16((const uint8_t *)"123456789", 9) == 0x29B1, "CRC16-CCITT vector");
    static const uint8_t abc[32] = {
        0xba,0x78,0x16,0xbf,0x8f,0x01,0xcf,0xea,0x41,0x41,0x40,0xde,0x5d,0xae,0x22,0x23,
        0xb0,0x03,0x61,0xa3,0x96,0x17,0x7a,0x9c,0xb4,0x10,0xff,0x61,0xf2,0x00,0x15,0xad};
    uint8_t out[32];
    xk_sha256((const uint8_t *)"abc", 3, out);
    CHECK(memcmp(out, abc, 32) == 0, "SHA-256 FIPS vector");
}

static void test_frames_cross_impl(void) {
    // Python bytes -> C fields
    xkp_frame_t f;
    CHECK(xkp_unpack(V_FRAME, sizeof V_FRAME, &f) == XKP_OK, "unpack python frame");
    CHECK(f.ftype == XKP_RECEIPT && f.flags == 1 && f.ttl == 6, "frame fields");
    CHECK(f.seq == V_FRAME_SEQ, "frame seq");
    CHECK(f.payload_len == 11 && memcmp(f.payload, "hello xkoin", 11) == 0, "payload");
    // C fields -> bytes identical to Python (byte-exact both directions)
    uint8_t repacked[256];
    size_t n = xkp_pack(&f, repacked, sizeof repacked);
    CHECK(n == sizeof V_FRAME && memcmp(repacked, V_FRAME, n) == 0, "repack byte-exact");
    // Law 8 sweep: every single-byte corruption must be rejected
    for (size_t i = 0; i < sizeof V_FRAME; i++) {
        uint8_t mut[sizeof V_FRAME];
        memcpy(mut, V_FRAME, sizeof V_FRAME);
        mut[i] ^= 0xA5;
        xkp_frame_t g;
        CHECK(xkp_unpack(mut, sizeof mut, &g) != XKP_OK, "corruption rejected");
    }
}

static void test_receipts(void) {
    xkp_receipt_t r;
    CHECK(xkp_receipt_verify(V_RECEIPT_WIRE, V_CLIENT_VK, &r) == 0, "python-signed receipt verifies in C");
    CHECK(r.cumulative_bytes == V_RECEIPT_CUMULATIVE && r.seq == V_RECEIPT_SEQ, "receipt fields");
    uint8_t nid[8];
    xkp_node_id(V_CLIENT_VK, nid);
    CHECK(memcmp(nid, V_CLIENT_ID, 8) == 0, "node id matches python");
    // Law 4: any counter tamper is a broken signature
    uint8_t bad[XKP_RECEIPT_WIRE];
    memcpy(bad, V_RECEIPT_WIRE, sizeof bad);
    bad[32] ^= 1;  // bump cumulative_bytes low byte
    CHECK(xkp_receipt_verify(bad, V_CLIENT_VK, &r) == -1, "tampered counter rejected");
    uint8_t wrong_vk[32] = {0};
    CHECK(xkp_receipt_verify(V_RECEIPT_WIRE, wrong_vk, &r) != 0, "wrong key rejected");
}

static void test_medium_policy(void) {
    xkp_medium_t ms[3] = {
        {"homeplug", 10000000, 1400, true, 0.001f, 0, 0},
        {"kq130f", 7680, 128, true, 0.05f, 0, 0},
        {"lora", 5468, 226, true, 0.02f, 0, 0},
    };
    CHECK(xkp_medium_best(ms, 3, 0) == &ms[0], "fastest medium wins");
    xkp_medium_observe(&ms[0], false, 100);
    xkp_medium_observe(&ms[0], false, 100);
    xkp_medium_observe(&ms[0], false, 100);
    CHECK(!xkp_medium_live(&ms[0], 101), "3 failures quarantine");
    CHECK(xkp_medium_best(ms, 3, 101) == &ms[1], "failover to next best");
    CHECK(xkp_medium_best(ms, 3, 100 + XKP_QUARANTINE_MS) == &ms[0], "quarantine expires");
    ms[0].up = false;
    ms[1].up = false;
    CHECK(xkp_medium_best(ms, 3, 99999) == &ms[2], "grid failure leaves LoRa");
}

static void test_classifier(void) {
    CHECK(xkp_ip_is_lan(0xC0A80401u), "192.168.4.1 is LAN");
    CHECK(xkp_ip_is_lan(0x0A000001u), "10.0.0.1 is LAN");
    CHECK(xkp_ip_is_lan(0xAC100001u), "172.16.0.1 is LAN");
    CHECK(!xkp_ip_is_lan(0x08080808u), "8.8.8.8 is WAN");
    CHECK(!xkp_ip_is_lan(0xAC200001u), "172.32.0.1 is WAN (outside /12)");
    xkp_session_t s = {.admitted = true, .delivered_bytes = 0, .proven_bytes = 0,
                       .receipt_interval = 100000};
    CHECK(xkp_gate_allow_wan(&s), "fresh session allowed");
    s.delivered_bytes = 200000;
    CHECK(xkp_gate_allow_wan(&s), "at 2x interval still allowed");
    s.delivered_bytes = 200001;
    CHECK(!xkp_gate_allow_wan(&s), "Law 3: over 2x unproven credit blocked");
    s.proven_bytes = 100001;
    CHECK(xkp_gate_allow_wan(&s), "receipt restores service");
    s.admitted = false;
    CHECK(!xkp_gate_allow_wan(&s), "unadmitted never routes WAN");
}

static int rx_frames = 0;
static void on_frame(const xkp_frame_t *f, void *user) {
    (void)user;
    if (f->seq == V_FRAME_SEQ) rx_frames++;
}

static void test_kq130f_resync(void) {
    kq130f_rx_t rx = {0};
    rx.on_frame = on_frame;
    // garbage prefix, then the frame split across three feeds, then a
    // corrupted copy, then a clean copy again
    uint8_t junk[7] = {0x00, 0x58, 0xFF, 0x4B, 0x58, 0x01, 0x02};
    kq130f_rx_feed(&rx, junk, sizeof junk);
    kq130f_rx_feed(&rx, V_FRAME, 5);
    kq130f_rx_feed(&rx, V_FRAME + 5, 20);
    kq130f_rx_feed(&rx, V_FRAME + 25, sizeof V_FRAME - 25);
    uint8_t bad[sizeof V_FRAME];
    memcpy(bad, V_FRAME, sizeof bad);
    bad[30] ^= 0xFF;
    kq130f_rx_feed(&rx, bad, sizeof bad);
    kq130f_rx_feed(&rx, V_FRAME, sizeof V_FRAME);
    CHECK(rx_frames == 2, "resync assembler: 2 clean frames out, junk and corruption dropped");
}

// -- SX1262 mock: record every SPI transaction --------------------------------
static uint8_t spi_log[4096];
static size_t spi_len = 0;
static void mock_spi(void *c, const uint8_t *tx, uint8_t *rx, size_t n) {
    (void)c;
    memset(rx, 0, n);
    if (spi_len + n + 1 < sizeof spi_log) {
        spi_log[spi_len++] = (uint8_t)n;
        memcpy(spi_log + spi_len, tx, n);
        spi_len += n;
    }
}
static void mock_gpio_w(void *c, int p, int l) { (void)c; (void)p; (void)l; }
static int mock_gpio_r(void *c, int p) { (void)c; (void)p; return 0; }
static void mock_delay(void *c, uint32_t ms) { (void)c; (void)ms; }

static int spi_log_has(const uint8_t *pat, size_t n) {
    for (size_t i = 0; i + n <= spi_len; i++)
        if (memcmp(spi_log + i, pat, n) == 0) return 1;
    return 0;
}

static void test_sx1262_sequences(void) {
    sx1262_hal_t hal = {mock_spi, mock_gpio_w, mock_gpio_r, mock_delay, 0, 1, 2};
    spi_len = 0;
    sx1262_init(&hal, SX_MODE_LORA_SF7_868);
    uint8_t lora_pt[2] = {0x8A, 0x01};
    CHECK(spi_log_has(lora_pt, 2), "init sets packet type LoRa");
    uint8_t lora_mp[5] = {0x8B, 0x07, 0x04, 0x01, 0x00};
    CHECK(spi_log_has(lora_mp, 5), "LoRa SF7/BW125/CR4:5 mod params");
    uint32_t fr = sx1262_freq_reg(868100000u);
    CHECK(fr == (uint32_t)(((unsigned long long)868100000u << 25) / 32000000u),
          "frequency register math");
    uint8_t freq_cmd[5] = {0x86, (uint8_t)(fr >> 24), (uint8_t)(fr >> 16),
                           (uint8_t)(fr >> 8), (uint8_t)fr};
    CHECK(spi_log_has(freq_cmd, 5), "868.1 MHz programmed");

    spi_len = 0;
    sx1262_set_mode(&hal, SX_MODE_GFSK_150K);
    uint8_t gfsk_pt[2] = {0x8A, 0x00};
    CHECK(spi_log_has(gfsk_pt, 2), "adaptive switch to GFSK");
    uint8_t br[3];
    sx1262_gfsk_bitrate_bytes(150000u, br);
    CHECK(br[0] == 0x00 && br[1] == 0x1A && br[2] == 0xAB, "GFSK 150 kbps BR = 0x001AAB");
    uint8_t gfsk_mp[4] = {0x8B, br[0], br[1], br[2]};
    CHECK(spi_log_has(gfsk_mp, 4), "GFSK mod params carry the 150k bitrate");
}

int main(void) {
    test_crc_and_sha();
    test_frames_cross_impl();
    test_receipts();
    test_medium_policy();
    test_classifier();
    test_kq130f_resync();
    test_sx1262_sequences();
    printf("HOST CORE PROOF: %d checks passed\n", checks);
    return 0;
}
