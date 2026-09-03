# 💎 AT Ornaments — Autonomous AI-Powered Jewelry E-Commerce Platform

> **A production-ready, solo-built e-commerce storefront for authentic silver ornaments with an autonomous two-stage AI checkout recovery pipeline.**

---

## 🌟 Overview & Key Highlights

**AT Ornaments** is a full-featured e-commerce platform built for high-touch silver jewelry retail. In addition to a customer storefront (dynamic silver pricing, custom size selectors, guest checkout, GST invoice generation, and order tracking), it features an **Autonomous AI Recovery Pipeline** designed to diagnose and recover abandoned carts and failed payment attempts without risking unconstrained discount margin loss.

### 🏆 Benchmark Evaluation Highlights (EPIC-6)
* **Precision**: **91.7%**
* **Recall**: **100.0%**
* **Overall Accuracy**: **93.3%**
* **Code Policy Gate Intervention Rate**: **15.6%** (Blocks improper discounts on payment friction or non-price hesitation)

---

## 🧠 Two-Stage AI Recovery Architecture

Rather than relying on a single unconstrained LLM call or brittle static rules, AT Ornaments implements a **Two-Stage Diagnose-Then-Decide Pipeline**:

```
Recovery Event + Context
          ↓
[Stage 1: Gemini Diagnostic Analyst]
  ↳ Evaluates customer behavior, cart total, time elapsed, purchase history
  ↳ Outputs qualitative free-text diagnosis (e.g. "Payment friction: authorized pending capture")
          ↓
[Stage 2: Gemini Decision Engine]
  ↳ Consumes Stage 1 diagnosis text + raw event metrics
  ↳ Recommends action (remind, retry_link, offer_discount) & proposed discount
          ↓
[Deterministic Code Policy Gate]
  ↳ Clamps max discount (10%), enforces daily budget ceiling (₹5,000), blocks discounts on payment friction
          ↓
Final Safe Action & Audit Log
```

---

## 🛠️ Core Application Features

1. **Storefront & Catalog**:
   - Dynamic live price calculation: `(Weight in grams × Live Silver Rate/g) + Making Charges`.
   - Category filtering for Chains, Anklets, Rings, and Bracelets.
   - Interactive customization selectors (length/size options) that update price live.

2. **Cart & Wishlist**:
   - Slide-over cart drawer with client-side state hydration (prevents SSR mismatch).
   - persistent wishlist via LocalStorage / Supabase.

3. **Checkout & Razorpay Payments**:
   - Unblocked guest checkout.
   - Razorpay standard checkout integration with webhook verification.
   - Handling of payment failures (`authorized_not_captured`, gateway timeouts).

4. **GST Invoice & Order Tracking**:
   - Automated 5-stage order status visual tracking bar (`Order Placed` → `Processing` → `Shipped` → `Out for Delivery` → `Delivered`).
   - Dynamic server-side GST invoice PDF generation (CGST 1.5% + SGST 1.5% = 3% GST).

5. **AI Stylist & Custom Design Studio**:
   - Natural language AI stylist interface for jewelry recommendations.
   - Interactive custom jewelry design request submission.

6. **Admin Audit Dashboard**:
   - Live monitoring of AI recovery interventions, decision logs, and budget utilization.
   - Automated daily discount budget ceiling override triggers for live demonstration (`scripts/trigger_budget_exhaustion.mjs`).

---

## 📐 Technology Stack

* **Framework**: Next.js 14 (App Router, Server & Client Components)
* **Language**: TypeScript (`tsc --noEmit` clean type safety)
* **Styling**: Tailwind CSS + Lucide Icons + Framer Motion
* **Database & Auth**: Supabase (Postgres, Row Level Security, Auth)
* **AI Engine**: Google Gemini 3.6 Flash API
* **Payment Gateway**: Razorpay Payments & Webhooks
* **PDF Engine**: PDFKit / Server-side Buffer rendering

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Priyanshisahu058/Ayush-Traders.git
cd Ayush-Traders
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# AI Engine
GEMINI_API_KEY=your_gemini_api_key

# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxx

# Optional Cron Security
CRON_SECRET=your_cron_secret
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## 🧪 Verification & Benchmark Commands

```bash
# Type Safety Verification
npx tsc --noEmit

# EPIC-2 Two-Stage Pipeline Test
npx tsx scripts/test_two_stage_pipeline.ts

# EPIC-6 Held-Out Evaluation Benchmark (45 Cases)
npx tsx scripts/test_epic6_evaluation.ts

# EPIC-8 Security & Fallback Test
npx tsx scripts/test_epic8_security.ts

# EPIC-9 Budget Ceiling Override Live Demo
node scripts/trigger_budget_exhaustion.mjs

# Full 10-Module Platform End-to-End Suite
node scripts/platform_e2e_verification.mjs
```

---

## 📄 License

This project is open-source under the MIT License.