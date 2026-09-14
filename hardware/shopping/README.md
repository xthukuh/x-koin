# Shopping list sources

One JSON file per part line under `parts/`, written by the sourcing scouts from live AliExpress listings (scripts/scout/ali.mjs). The shopping page in the web app compiles these files. Prices are in KES as AliExpress shows them to a Kenyan visitor on the day recorded; shipping is what the listing page displayed without a login.

Beside the part files, from 2026-09-14:

- `mvp-sourcing.md`: the per-device budgets for the bare minimum investor kit, the ranked shop-count options, and the Nairobi store findings.
- `mvp-kit.json`: which lines each device needs, and the stage two list.
- `mvp-checkout.json`: one verified checkout link per line with the variant to select, the price, the shipping line and the delivery window to Kenya.
- `local-vendors.json`: every Nairobi candidate examined, with a verdict.
- `scripts/scout/local.mjs`: the Nairobi store scout (plain fetch, six stores).

Schema of `parts/<id>.json`:

    {
      "id": "esp32-s3-devkitc-n16r8",
      "line": "ESP32-S3-DevKitC-1 N16R8",
      "role": "xKoin-Node, xKoin-Node-Satellite",
      "spec": "what must be true of the part",
      "qty": 2,
      "why": "one sentence on what it does in the kit",
      "recorded": "2026-09-12",
      "chosen": "<url of the chosen candidate>",
      "candidates": [
        {
          "url": "https://www.aliexpress.com/item/....html",
          "title": "listing title",
          "price_kes": 1107,
          "price_note": "variant or bundle chosen, coupons seen",
          "shipping": "Free shipping | KSh 250 | not shown",
          "sold": "3,000+",
          "rating": "4.8",
          "reviews": 470,
          "store": "store name",
          "store_url": "https://www.aliexpress.com/store/....",
          "images": ["...jpg"],
          "verdict": "chosen | runner-up | rejected",
          "notes": "why, including any authenticity check made on the photos"
        }
      ]
    }
