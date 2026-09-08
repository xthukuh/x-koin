#include "captive_portal.h"
#ifdef ESP_PLATFORM
#include <string.h>
#include "esp_http_server.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "lwip/sockets.h"

#define PORTAL_IP "192.168.4.1"

static void dns_hijack_task(void *arg) {
    // Answer every A query with 192.168.4.1 so any probe lands on the portal.
    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    struct sockaddr_in addr = {.sin_family = AF_INET, .sin_port = htons(53),
                               .sin_addr.s_addr = htonl(INADDR_ANY)};
    bind(sock, (struct sockaddr *)&addr, sizeof addr);
    uint8_t buf[512];
    for (;;) {
        struct sockaddr_in from;
        socklen_t flen = sizeof from;
        int n = recvfrom(sock, buf, sizeof buf, 0, (struct sockaddr *)&from, &flen);
        if (n < 12) continue;
        buf[2] |= 0x80;               // response
        buf[3] = 0x00;
        buf[7] = 1;                   // one answer
        uint8_t ans[16] = {0xC0, 0x0C, 0, 1, 0, 1, 0, 0, 0, 60, 0, 4, 192, 168, 4, 1};
        if (n + (int)sizeof ans <= (int)sizeof buf) {
            memcpy(buf + n, ans, sizeof ans);
            sendto(sock, buf, n + sizeof ans, 0, (struct sockaddr *)&from, flen);
        }
    }
}

static esp_err_t root_get(httpd_req_t *req) {
    httpd_resp_sendstr(req,
        "<html><body><h1>xKoin Mesh</h1><p>Buy Gas Voucher: 20 / 50 / 100 KES"
        "</p><p>Pay via M-Pesa or Equitel. Portal wiring to gateway-api "
        "/buy-gas lands with kiosk-web.</p></body></html>");
    return ESP_OK;
}

void captive_portal_start(void) {
    esp_netif_create_default_wifi_ap();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);
    wifi_config_t ap = {0};
    strcpy((char *)ap.ap.ssid, "xKoin-Community-Mesh");
    ap.ap.max_connection = 8;
    ap.ap.authmode = WIFI_AUTH_OPEN;
    esp_wifi_set_mode(WIFI_MODE_AP);
    esp_wifi_set_config(WIFI_IF_AP, &ap);
    esp_wifi_start();
    httpd_handle_t server = NULL;
    httpd_config_t hc = HTTPD_DEFAULT_CONFIG();
    httpd_start(&server, &hc);
    httpd_uri_t root = {.uri = "/", .method = HTTP_GET, .handler = root_get};
    httpd_register_uri_handler(server, &root);
    xTaskCreate(dns_hijack_task, "dns_hijack", 4096, NULL, 5, NULL);
}
#endif
