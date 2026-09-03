# Epics & User Stories
## AT Ornaments — E-Commerce Platform

Format per story: **ID | As a / I want / So that | Acceptance Criteria**. Story point estimates are rough (S/M/L) for solo-dev planning, not team velocity.

---

## Epic 1 — Product Catalog

**Goal:** Support fixed-price and weight-based products across four categories with imagery for the hover-swap effect.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| CAT-1 | As a customer, I want to browse products by category (Chain, Anklet, Ring, Bracelet) so I can find what I'm looking for. | Category pages list only active products in that category; empty category shows a friendly empty state. | M |
| CAT-2 | As a customer, I want to filter the Shop page by category and price so I can narrow results. | Filters combine (AND logic); URL reflects filter state (shareable link); result count updates live. | M |
| CAT-3 | As a customer, I want to see a second product image on hover/tap so I can preview another angle before opening the product. | Card crossfades to `product_images` row with `sort_order = 2` on hover (desktop) / tap (mobile); falls back gracefully if only 1 image exists. | S |
| CAT-4 | As a customer, I want weight-based silver items priced using today's rate so the price I see is accurate. | Price = `weight_grams * today_silver_rate_per_gram + making_charge`, computed server-side at request time. | M |
| CAT-5 | As a customer, I want to select a size on ring (and applicable anklet) products so I order the right fit. | Size selector renders only when `product_variants` exist for the product; out-of-stock sizes are disabled, not hidden. | M |
| CAT-6 | As an admin, I want to mark a product as hallmarked and enter its HUID so the PDP shows a trust badge. | HUID field validated as 6-char alphanumeric; badge renders on PDP only when `is_hallmarked = true`. | S |

---

## Epic 2 — Cart & Checkout

**Goal:** Fast, animated cart experience with accurate live pricing and a low-friction checkout.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| CART-1 | As a customer, I want to add/remove/update items in a slide-in cart drawer so I don't lose my place on the page. | Drawer slides in from right with backdrop fade; items stagger-fade in; quantity changes update subtotal without full reload. | M |
| CART-2 | As a customer, I want to see progress toward the free-gift threshold so I know how much more to add. | Progress bar and copy (`"Add ₹X more..."` / `"unlocked"`) update live as cart subtotal changes. | S |
| CART-3 | As a customer, I want to enter my shipping address at checkout, reusing a saved address if I'm logged in. | Logged-in users see saved addresses (default pre-selected) with an "add new" option; guests get a fresh form and are prompted to create an account before payment. | M |
| CART-4 | As a customer, I want the order total I see at checkout to be trustworthy and correct. | Total is recomputed server-side from current product/settings data at `create-order`, not taken from client cart state. | M |
| CART-5 | As a customer, I want free shipping on every order so there's no surprise fee at checkout. | No shipping line item is added regardless of order value. | S |

---

## Epic 3 — Free Surprise Gift

**Goal:** Drive average order value with a threshold-based surprise gift, without dedicated inventory tracking.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| GIFT-1 | As an admin, I want to manage a pool of possible gift names so I can rotate what's offered. | CRUD on `gift_pool` (name, `is_active`); inactive entries are excluded from random selection. | S |
| GIFT-2 | As an admin, I want to set the free-gift ₹ threshold so I can tune the promo. | Updating `settings.free_gift_threshold` immediately affects the live progress bar calculation. | S |
| GIFT-3 | As a customer, when my order qualifies, I want a random gift assigned and shown at checkout and on my confirmation page. | On `create-order`, if subtotal ≥ threshold, one active `gift_pool` row is randomly selected and its name snapshotted onto `orders.free_gift_name`; same value later shown at both surfaces, immune to later pool edits. | M |

---

## Epic 4 — Payments (Razorpay)

**Goal:** Secure, verified payment capture using hosted checkout.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| PAY-1 | As a customer, I want to pay via a trusted hosted checkout so I feel safe entering payment details. | Razorpay Standard Checkout widget invoked with server-created `razorpay_order_id`; no card data touches AT Ornaments' own servers. | M |
| PAY-2 | As the business, I want payment confirmation to be verified server-side so fraudulent client-side "success" can't fake an order. | Webhook signature is verified via HMAC using the webhook secret before any `orders.status` transition; unverified requests are rejected and logged. | M |
| PAY-3 | As the business, I want duplicate webhook deliveries to not cause duplicate invoices or shipments. | Handler checks current order status before acting; a second `payment.captured` delivery for an already-`paid` order is a no-op. | S |

---

## Epic 5 — Shipping (Shiprocket)

**Goal:** Automated shipment creation and customer-facing tracking.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| SHIP-1 | As the business, I want a shipment auto-created once an order is paid so I don't manually enter orders into Shiprocket. | On `orders.status = 'paid'`, server calls Shiprocket create-shipment and stores `shiprocket_order_id`/`awb_code`. | M |
| SHIP-2 | As a customer, I want to track my order so I know when it will arrive. | Track Order page and My Account → Orders show live status via `GET /api/shipping/track/[awb]`, proxied server-side (Shiprocket keys never exposed to client). | M |
| SHIP-3 | As a customer, I want to see an estimated delivery window at checkout and confirmation. | "5–7 days" delivery estimate shown on both Checkout summary and Order Confirmation. | S |

---

## Epic 6 — Hallmark & Certification

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| HALL-1 | As a customer, I want to see a BIS Hallmarked badge with HUID on silver product pages so I trust the purity claim. | Badge + HUID render on PDP only for products with `is_hallmarked = true`; artificial jewellery never shows the badge. | S |
| HALL-2 | As a customer, I want a general "Trusted Since 2006 / BIS Hallmarked Silver" trust strip on Home/About. | Brand-level trust strip renders independent of individual product data. | S |

---

## Epic 7 — GST Invoicing

**Goal:** Every paid order produces a compliant, downloadable GST invoice.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| INV-1 | As the business, I want a sequential GST invoice generated automatically on payment success. | Invoice PDF includes business name, GSTIN, sequential invoice number, order date, itemized products with HSN/qty/price, correct tax split, and total. | L |
| INV-2 | As the business, I want the correct tax split (CGST+SGST vs IGST) applied automatically. | Split determined by comparing buyer's address state to `settings.business_registered_address` state. | M |
| INV-3 | As a customer, I want to download my invoice from the confirmation page and later from my order history. | Invoice is linked on Order Confirmation and downloadable anytime from My Account → Order History via a signed URL. | S |
| INV-4 | As an admin, I want to set my GSTIN, business address, and invoice number prefix once. | `settings` fields editable via `/admin/settings`; used by all subsequent invoice generations. | S |

---

## Epic 8 — Accounts

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| ACC-1 | As a customer, I want to sign up / log in with email+password (or Google) so I can check out and track orders. | Supabase Auth handles both flows; session persists via HTTP-only cookie. | M |
| ACC-2 | As a customer, I want to save multiple addresses with one marked default. | Address CRUD; exactly one address can be default at a time; default pre-selected at checkout. | M |
| ACC-3 | As a customer, I want to view my past orders and re-download invoices. | Order History lists all orders for the logged-in user with status and invoice download link. | S |
| ACC-4 | As a customer, I want a wishlist so I can save products for later. | Add/remove from wishlist on PDP and cards; wishlist page lists saved products. | S |

---

## Epic 9 — Admin Dashboard

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| ADM-1 | As an admin, I want full product CRUD (images, pricing, weight, making charge, stock, variants, category, hallmark). | All fields editable; changes reflected immediately on storefront reads. | L |
| ADM-2 | As an admin, I want to update today's silver rate in one place and have it cascade everywhere. | Single `settings` update; no per-product batch edit needed since price is computed at read time. | S |
| ADM-3 | As an admin, I want an order list and detail view with status, tracking, and invoice re-download. | List filterable by status; detail view shows items, address, payment id, AWB, gift assigned. | M |
| ADM-4 | As an admin, I want all admin routes protected so only I can access them. | Middleware + per-handler role check reject non-admin sessions with 403. | M |

---

## Epic 10 — Motion & Micro-interactions

**Goal:** Premium, animation-forward feel per PRD §8, without harming performance or accessibility.

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| MOT-1 | As a customer, I want a scrolling announcement marquee that pauses on hover so I can read a message fully. | Continuous scroll, rotates 3 messages, pauses on hover/tap. | S |
| MOT-2 | As a customer, I want smooth hover/scroll animations on category tiles and product grids. | Scale+shadow on hover; fade/slide-up on scroll-into-view, staggered ~80ms per item. | M |
| MOT-3 | As a customer, I want a satisfying add-to-cart interaction so the action feels confirmed. | Button micro-bounce + cart badge pop animation on successful add. | S |
| MOT-4 | As a customer, I want animated stat counters on Home that count up once, not every scroll. | Counters trigger once via intersection observer, guarded against re-trigger on scroll-up. | S |
| MOT-5 | As a customer scrolling a PDP on mobile, I want a sticky "Add to Cart" bar so I don't have to scroll back up. | Bar fades in once the primary CTA scrolls out of view. | S |
| MOT-6 | As a customer with reduced-motion OS settings, I want instant state changes instead of animations. | All motion components respect `prefers-reduced-motion` and fall back to instant transitions. | M |

---

## Epic 11 — Policies & Support

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| POL-1 | As a customer, I want to read Return/Exchange, Shipping, Privacy, and Terms policies before buying. | Four static policy pages published, linked in footer. | S |
| POL-2 | As a customer, I want an easy way to contact support via email or WhatsApp. | Contact page shows both, with a WhatsApp click-to-chat deep link. | S |

---

## Epic 12 — Domain & Deployment

| ID | User Story | Acceptance Criteria | Size |
|---|---|---|---|
| DOM-1 | As the business, I want to launch on a free Vercel subdomain with zero upfront cost. | Site live and fully functional at `ayushtraders.vercel.app` with SSL. | S |
| DOM-2 | As the business, I want to attach a real domain later without a rebuild or downtime. | Domain added via Vercel → Settings → Domains + DNS update only; `.vercel.app` keeps working as fallback. | S |
