# Gemini 3 Flash Preview (2026) — Cost Estimate

> **Note:** This document summarizes the pricing assumptions provided by the user.

## Pricing Assumptions (2026)
- **Billing model:** Pay-per-token (actual usage)
- **Audio input rate:** 1 second = 32 tokens (1,920 tokens per minute)
- **Input price (Audio):** $1.00 per 1,000,000 tokens
- **Output price (Text):** $3.00 per 1,000,000 tokens
- **Output usage:** Typically low for subtitle generation

## Estimated Cost Table (Paid Tier)

| Clip Length | Estimated Processing Time | Audio Input Cost (THB) | Output Cost (THB)* | Estimated Total (THB) |
| ----------- | ------------------------: | ---------------------: | -----------------: | --------------------: |
| 1 minute    |               10 - 20 sec |                  ~0.07 |              ~0.04 |                 ~0.11 |
| 5 minutes   |               1 - 1.5 min |                  ~0.35 |              ~0.20 |                 ~0.55 |
| 10 minutes  |                 2 - 3 min |                  ~0.70 |              ~0.40 |                 ~1.10 |
| 30 minutes  |                 6 - 8 min |                  ~2.10 |              ~1.20 |                 ~3.30 |
| 1 hour      |               12 - 15 min |                  ~4.20 |              ~2.40 |                 ~6.60 |

\* Output cost varies by subtitle length and language density.

## Calculation Notes
- **Audio tokens per minute:** 1,920
- **Input cost formula:**
  - $ = (input_tokens / 1,000,000) × 1.00
- **Output cost formula:**
  - $ = (output_tokens / 1,000,000) × 3.00
- THB conversion in the table follows the values provided by the user.
