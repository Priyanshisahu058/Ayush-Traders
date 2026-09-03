# Product Requirements Document
## Ayush Traders Ornaments — E-Commerce Website

**Version:** 2.0
**Prepared for:** Solo founder-developer build
**Last updated:** August 2026
**Changes from v1.0:** Categories updated (Chain, Anklet, Ring, Bracelet — Earring removed), free surprise-gift promo added, animation/motion spec added (visual reference: modernseries.in look-and-feel, adapted to AT Ornaments brand)

---

## 1. Overview

Ayush Traders Ornaments ("AT Ornaments") is a direct-to-consumer e-commerce brand selling silver and artificial jewellery, unisex, positioned as elegant and premium. Tagline: **"Trust · Purity · Elegance."**

Custom-built (not Shopify/no-code) e-commerce site, built solo, on entirely free-tier infrastructure until the business generates revenue.

### 1.1 Goals
- Full online store: browse → cart → pay → order → ship
- Zero upfront hosting/infra cost (domain purchased later, once revenue starts — free `*.vercel.app` at launch, real domain attached later with no rebuild)
- Support fixed-price (artificial) and weight-based (silver) pricing in one catalog
- A polished, **motion-driven** shopping experience that feels premium despite a small (~20 product) catalog — modern jewellery-brand feel, not a static catalog page
- Full founder ownership of the codebase

### 1.2 Non-goals (v1)
- Cash on Delivery
- Multi-vendor / marketplace features
- Native mobile app
- Product reviews/ratings (v2)
- Coupon/discount engine beyond the free-gift threshold (v2)

---

## 2. Brand Identity

| Element | Value |
|---|---|
| Brand name | Ayush Traders Ornaments (AT Ornaments) |
| Tagline | Trust · Purity · Elegance |
| Established | 2006 — family business, registered under GST; e-commerce site brings it online |
| Target audience | Unisex, elegant/premium positioning |
| Logo | Monogram "AT" with Ganesh motif + jhumka charm (silver metallic) — *asset to be dropped into project once supplied* |
| Hero image | *Asset to be dropped into project once supplied* |
| Primary color | Deep green (#2C4A3E approx) |
| Accent color | Gold (#C9A45C approx) |
| Neutral/background | Warm cream/off-white (#F5F1EA approx) |
| Product accent | Silver tones (product photography) |
| Headline font | Elegant serif (Playfair Display / Cormorant) |
| Body font | Clean sans-serif (Inter / Poppins) |
| Trust badges | Trust (shield), Purity (droplet), Elegance (diamond) |

*Exact hex codes to be color-picked from final logo/hero files once supplied.*

---

## 3. Design & Motion Reference

Look-and-feel target is a modern, animation-forward jewellery storefront (reference: modernseries.in) — **restyled entirely in AT Ornaments' own green/gold/cream palette and "AT" branding, not a copy of their content or assets.** The patterns worth adopting structurally:

- Scrolling marquee announcement bar at the very top (rotates through: free gift line, free shipping line, tagline)
- Large hero banner with a linked category-grid directly beneath it
- Hover image-swap on product cards (first image → alternate angle on hover/tap)
- Horizontal "Shop by Look" section using short muted autoplay video/reels with a linked product tag
- Animated stat counters (e.g. Happy Customers / Orders Delivered / Cities Covered) that count up when scrolled into view
- A strip of trust/feature icons above the footer — for AT Ornaments this should lead with **"Trusted Since 2006"** and **"BIS Hallmarked Silver"**, alongside Fast Delivery and Skin-Safe equivalents
- Slide-in cart drawer instead of full navigation to a cart page
- Sticky mobile "Add to Cart" bar on the Product Detail Page

---

## 4. Tech Stack

| Layer | Choice | Cost |
|---|---|---|
| Frontend + Backend | Next.js (App Router, Route Handlers as backend) | Free |
| Hosting | Vercel (free tier); real domain attached later, no rebuild required | Free |
| Database, Auth, Image storage | Supabase (free tier) | Free |
| Payments | Razorpay Standard Checkout | Free to integrate; ~2% per transaction |
| Shipping | Shiprocket API | Free account; pay per shipment |
| **Animation** | **Framer Motion** (React) for scroll-reveals, hover states, page/cart transitions; **Embla Carousel** for horizontal product/reel scrollers; **react-intersection-observer** for scroll-triggered counters | Free (open-source) |
| Admin | Protected `/admin` route within the same app | Free |
| Domain | Deferred — see domain notes in Section 11 | ~₹700–1000/yr, only once live |

---

## 5. User Roles

1. **Guest / Customer** — browse, add to cart, must create account or log in to checkout
2. **Registered Customer** — order history, saved addresses, wishlist
3. **Admin (founder)** — manage products, update daily silver rate, manage gift pool, view/manage orders

---

## 6. Site Map / Pages

| Page | Purpose |
|---|---|
| Home | Marquee bar, hero banner, animated category tiles, bestsellers, animated trust counters, Shop by Look video strip, trust badges, newsletter |
| Shop | All products, filterable by category and price |
| Category page | Chain / Anklet / Ring / Bracelet |
| Product Detail Page (PDP) | Image gallery with hover-swap, price/weight breakdown, size selector where applicable, sticky mobile add-to-cart, add-to-cart micro-animation |
| Cart (slide-in drawer) | Line items, quantity edit, subtotal, free-gift progress indicator |
| Checkout | Address form, order summary, Razorpay payment |
| Order Confirmation | Order number, summary, estimated delivery, surprise gift reveal |
| My Account | Login/signup, order history, saved addresses, wishlist |
| About Us | Brand story |
| Contact Us | Email + WhatsApp |
| Track Order | Shiprocket tracking |
| Policy pages | Return/Exchange, Shipping, Privacy, Terms |
| Admin Dashboard | Product CRUD, silver rate update, gift pool management, order management |

---

## 7. Core Features (v1 Scope)

### 7.1 Product Catalog
- **Categories: Chain, Anklet, Ring, Bracelet** (Earring fully removed from schema)
- Collections: tag-based curated groupings (2–3 to start)
- Each product supports:
  - `pricing_type`: `fixed` or `weight_based`
  - For `weight_based`: weight (grams) × today's silver rate (admin-set daily) + making charge
  - For `fixed`: flat price
  - Size variants where applicable (rings; optionally anklets if not one-size)
  - Multiple images — **first two used for the hover-swap effect on cards**
  - Stock quantity

### 7.2 Cart & Checkout
- Add/remove/update quantity, in a slide-in drawer
- Live progress bar toward the ₹499 free-gift threshold ("Add ₹120 more for a free surprise gift 🎁")
- Address form (saved addresses for logged-in users)
- Order summary with computed total, including weight-based recalculation at day's rate
- Free shipping on all orders (no threshold)

### 7.3 Free Surprise Gift
- Threshold: order subtotal ≥ **₹499**
- Gift is a **surprise** — not customer-selected
- Admin maintains a simple pool of possible gift names/SKUs (no dedicated stock tracking)
- At order creation, if threshold is met, one gift is randomly selected from the pool and **snapshotted** onto the order (`order.free_gift_name`) — same snapshot pattern as `price_snapshot`, so what's recorded matches what shipped even if the pool changes later
- Applied regardless of any individual gift's real-world stock (no substitution/blocking logic in v1)
- Surfaced: cart drawer (progress bar), checkout summary, order confirmation ("reveal") page

### 7.4 Payments — Razorpay
- Standard Checkout (hosted payment page)
- Webhook signature verification (never trust client-side success alone)
- Live mode requires Razorpay KYC (GST/Udyam registered)

### 7.5 Shipping — Shiprocket
- Auto-create shipment on `paid` status
- AWB/tracking stored against the order
- Delivery estimate shown: **5–7 days**

### 7.6 Hallmark & Certification (Silver Products)
- Every silver product carries a **BIS Hallmark** — the field is stored per-product (`hallmark_number` or `huid` — Hallmark Unique ID, the 6-character alphanumeric code BIS now assigns per piece)
- PDP displays a small "BIS Hallmarked" badge with the HUID shown alongside weight/purity details, next to the trust badges
- Artificial jewellery (non-silver) does not carry a hallmark — the badge only renders for `category` items marked as silver/hallmarked in the product record
- About/Home trust strip carries a general "BIS Hallmarked Silver" badge (brand-level, not tied to one product)

### 7.7 GST Invoice / Proper Bill
- Business is GST-registered — every order needs a **proper GST invoice**, not just an order confirmation
- On payment success, generate a PDF invoice containing: business name, GSTIN, invoice number (sequential), order date, itemized products with HSN code/quantity/price, tax breakdown (CGST+SGST or IGST depending on buyer's state vs business's home state), and total
- Invoice PDF is:
  - Attached/linked on the Order Confirmation page
  - Downloadable anytime from My Account → Order History
- `settings` table stores the business GSTIN and registered address once, used on every generated invoice

### 7.8 Accounts
- Supabase Auth (email/password; Google OAuth optional)
- Order history, saved addresses (multiple, one default), wishlist

### 7.9 Admin Dashboard
- Product CRUD (images, pricing type, weight, making charge, stock, variants, category, hallmark/HUID)
- Update "today's silver rate" (cascades to all weight-based prices)
- Manage free-gift pool (add/remove gift names) and threshold amount
- Manage GSTIN/business details used on invoices
- Order list, status, tracking, invoice re-download

### 7.10 Policies
- Return/Exchange: 7-day exchange only (no cash refunds), excludes earrings *(now moot — category removed; re-check exclusion wording once product line is finalized)*
- Shipping: Free, 5–7 days
- Privacy Policy & Terms of Service: standard India e-commerce templates

### 7.11 Support
- Email + WhatsApp click-to-chat link

---

## 8. Animation & Micro-interaction Spec

| Element | Behavior |
|---|---|
| Announcement marquee | Continuous horizontal scroll, pauses on hover/tap; rotates free-gift, free-shipping, and tagline messages |
| Category tiles (Home) | Subtle scale + shadow lift on hover; fade/slide-up on initial scroll into view |
| Product cards | Primary image → secondary image crossfade on hover (desktop) / tap (mobile); "Add to Cart" button slides up from bottom on hover |
| Add-to-cart action | Button micro-bounce + cart icon badge increments with a small pop animation |
| Cart drawer | Slides in from the right, backdrop fade-in, items stagger-fade on open |
| Stat counters | Count from 0 to final value once scrolled into viewport (one-time trigger) |
| Shop by Look | Horizontal swipeable video strip, muted autoplay with tap-for-sound, snap-scroll on mobile |
| Page/section reveals | Fade-up on scroll for section headers and product grids, staggered by ~80ms per item |
| PDP gallery | Swipeable image gallery with dot indicators; zoom-on-tap for detail shots |
| Sticky mobile CTA | "Add to Cart" bar fades in once the primary button scrolls out of view |

All animations should be built with `prefers-reduced-motion` respected (fall back to instant state changes for users with that OS setting).

---

## 9. Database Schema (Supabase / Postgres — high level)

**products**
`id, name, slug, description, category (chain/anklet/ring/bracelet), pricing_type (fixed/weight_based), fixed_price, weight_grams, making_charge, stock, is_active, is_hallmarked, huid (hallmark unique ID, silver items only), created_at`

**product_images**
`id, product_id, image_url, sort_order` *(sort_order 1 & 2 used for hover-swap)*

**product_variants** (optional, for sizing)
`id, product_id, variant_label, stock`

**collections** / **product_collections** — unchanged from v1

**users / addresses / wishlists** — unchanged from v1

**orders**
`id, user_id, status, subtotal, total, razorpay_order_id, razorpay_payment_id, shipping_address_id, shiprocket_order_id, awb_code, free_gift_name, invoice_number, invoice_pdf_url, created_at`

**order_items**
`id, order_id, product_id, product_name_snapshot, price_snapshot, quantity, variant_label, hsn_code_snapshot` *(HSN code added for GST invoice line items)*

**settings**
`key, value, updated_at` — includes `today_silver_rate_per_gram`, `free_gift_threshold` (default 499), `business_gstin`, `business_registered_address`, `invoice_number_prefix`

**gift_pool** *(new)*
`id, name, is_active` — admin-managed list the order-creation logic randomly picks from

---

## 10. API Routes (Next.js Route Handlers)

Unchanged from v1, plus:

| Route | Purpose |
|---|---|
| `POST /api/admin/gift-pool` | Admin CRUD for surprise-gift pool entries (auth-gated) |
| `POST /api/admin/gift-threshold` | Update the ₹ threshold (auth-gated) |
| `GET /api/orders/[id]/invoice` | Generate/fetch the GST invoice PDF for an order (logged-in owner or admin) |
| `POST /api/admin/gst-settings` | Update GSTIN / registered address / invoice number prefix (auth-gated) |

Gift selection logic lives inside `POST /api/checkout/create-order`: if `subtotal >= free_gift_threshold`, pick a random active `gift_pool` entry and store its name on the order.

Invoice generation runs right after the Razorpay webhook marks an order `paid`: assign the next sequential `invoice_number`, render a GST-compliant PDF (business details from `settings`, itemized `order_items` with HSN codes, CGST+SGST or IGST split based on buyer state vs. business home state), store it, and link it on the confirmation page and My Account.

---

## 11. Domain Plan (deferred, zero upfront cost)

- **Launch:** free `ayushtraders.vercel.app` — fully functional (SSL included, no watermark)
- **Post-revenue:** buy `ayushtraders.in` or `atornaments.com` (~₹700–1000/yr) from any registrar, attach it in Vercel → Settings → Domains, update DNS records at the registrar. No redeploy, no data migration, no downtime — the `.vercel.app` URL keeps working as a fallback.
- Avoid free country-code TLDs (`.tk`/`.ml`/etc.) for a commercial storefront — they carry commercial-use restrictions and look unprofessional next to Razorpay/Shiprocket KYC checks.

---

## 12. Non-Functional Requirements
- Mobile-first responsive design
- Animations must not block perceived load — use skeleton loaders while data fetches, lazy-load below-the-fold video/reel content
- Optimized images (Next.js Image component), lazy loading
- Secure payment verification (server-side signature check)
- HTTPS everywhere (Vercel default)
- Basic SEO: meta tags, product structured data, sitemap

---

## 13. Pre-Launch Checklist (Business Side)
- [ ] Razorpay live mode KYC approved (GST/Udyam docs — already registered since 2006, should be straightforward)
- [ ] GSTIN and registered business address entered into admin settings for invoice generation
- [ ] BIS Hallmark / HUID details on hand for each silver product, entered per-product
- [ ] Shiprocket account set up with verified pickup address
- [ ] Real product photography for all ~20 products (2 images minimum per product, for hover-swap)
- [ ] Logo and hero assets received and integrated
- [ ] Policy pages written and published (Return/Exchange wording re-checked post earring removal)
- [ ] Support email and WhatsApp active
- [ ] Domain purchased and connected (optional at soft-launch)

---

## 14. Suggested Build Order (Milestones)

1. **Foundation** — Next.js + Supabase + Vercel skeleton, base design tokens/palette
2. **Catalog & Motion Baseline** — Product schema, admin CRUD, Home/Shop/PDP with core layout + hover-swap/reveal animations
3. **Cart & Auth** — Cart drawer with animation, Supabase Auth, My Account pages
4. **Free Gift Logic** — `gift_pool` + threshold logic wired into cart drawer progress bar and checkout
5. **Checkout & Payments** — Razorpay integration end-to-end (test mode)
6. **Shipping** — Shiprocket integration, tracking display
7. **Admin polish** — Silver rate control, gift pool manager, order dashboard
8. **Motion polish pass** — Shop by Look video strip, stat counters, marquee, reduced-motion fallback
9. **Content & Policies** — About, Contact, static policy pages, real photography swap-in
10. **Pre-launch QA** — Full test-mode purchase flow, mobile testing, KYC approvals
11. **Go live** — Live mode payments/shipping, domain connected, launch

---

## 15. Open Items
- Final product list (names, weights, making charges, descriptions) per the 4 categories
- Real product photography (2 shots/product minimum, for the hover-swap effect)
- Logo and hero image files (to be dropped in once supplied)
- Gift pool contents (what the surprise items actually are)
- Whether anklets need ring-style size variants or are one-size
- Final policy copy
- Final domain name choice
- Exact brand hex codes (pick from final assets)
