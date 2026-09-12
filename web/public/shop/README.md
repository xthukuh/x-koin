# Shopping list

`parts.json` is the hardware shopping list for the pilot build. It is a JSON
array, served as-is and read by the `/shop` route. An empty array is the
"not compiled yet" state, which is what it holds now.

JSON carries no comments, so the schema is documented here instead.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable key for the line, unique in the file |
| `role` | string | What the part does in the build, for example `gateway-mcu` |
| `name` | string | Product name as the store lists it |
| `spec` | string | The one detail that makes this part the right one |
| `qty` | number | How many to buy |
| `unit_price_kes` | number | Price per unit in KES, exclusive of shipping |
| `url` | string | Direct product link |
| `store` | string | Where it is bought, for example `Jumia` |
| `images` | string[] | Product image URLs, first one is the thumbnail |

One entry looks like this.

    [
      {
        "id": "gw-mcu-01",
        "role": "gateway-mcu",
        "name": "ESP32-S3-DevKitC-1",
        "spec": "N16R8, 16 MB flash and 8 MB PSRAM",
        "qty": 2,
        "unit_price_kes": 3500,
        "url": "https://example.com/esp32-s3-devkitc-1",
        "store": "Jumia",
        "images": ["https://example.com/img/esp32-s3.jpg"]
      }
    ]
