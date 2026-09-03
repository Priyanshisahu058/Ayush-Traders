# Epics & User Stories — Remaining Build (Cart Recovery Agent)
Derived directly from the Build Status Audit Report. Ordered by priority — Epic 1 and 2 are safety/architecture-critical and must be done before anything else, since they're what your entire "bounded and gated" judging story depends on.

---

## EPIC 1: Code-Level Policy Gate (CRITICAL — do this first)
**Why this matters:** This is the single artifact that proves "bounded and gated" to a judge. Right now the audit confirms discount caps, budget ceilings, and the authorized-payment discount block do not exist in code — only partial rule logic inside `recoveryAgent.ts`. Without this, if a panelist asks "show me where the model is prevented from exceeding your discount cap," there is currently no answer.

### US-1.1 — As the system, I need a single dedicated gate function so every proposed action passes through one enforceable checkpoint
**Acceptance Criteria:**
- `lib/recovery/policyGate.ts` exists with an exported `applyPolicyGate(proposal, context, policyState)` function.
- It is called after every Stage 2 decision, before any action executes — verify by tracing the call site.
- It returns `{ finalAction, finalDiscountPercent, gateOverrides: string[] }`.

### US-1.2 — As the merchant, I need the agent to never propose a discount above my configured ceiling, regardless of what the model returns
**Acceptance Criteria:**
- If `proposal.discount_percent > policyState.max_discount_percent`, the gate clamps it and appends a message to `gateOverrides` (e.g. `"Clamped discount from 25% to 10%"`).
- Test: manually force a fake proposal of 25% and confirm the persisted `recovery_actions (extended).final_discount_percent` is capped at the configured max.

### US-1.3 — As the merchant, I need the agent to never discount a payment that's already authorized
**Acceptance Criteria:**
- If `context.payment_attempt_status === 'authorized_not_captured'`, the gate forces `finalAction = 'retry_payment_link'` and `finalDiscount = 0`, regardless of the model's proposal.
- Test: trigger an `authorized_not_captured` event and confirm the final action is never `offer_discount`.

### US-1.4 — As the merchant, I need a hard daily spend ceiling the agent cannot exceed
**Acceptance Criteria:**
- Gate queries `agent_policy_state.discount_spent_today` before approving any discount.
- If `discount_spent_today + proposed_spend > daily_discount_budget`, force `finalAction = 'no_action'`.
- Test: simulate enough discount-eligible events in sequence to exceed the budget, confirm the agent stops discounting once the ceiling is hit — **this is your best live demo moment, per the PRD.**

### US-1.5 — As the merchant, I need each order to receive at most one recovery action, ever
**Acceptance Criteria:**
- Before approving any action, gate checks `recovery_actions (extended)` for an existing row with the same `order_id`.
- If one exists and the count meets `max_actions_per_order`, force `no_action`.
- Note: the existing "3 retries" cap in `actionExecutor.ts` is a different rule (execution retries) — this must be a separate, explicit one-recovery-action-per-order check.

### US-1.6 — As a judge/auditor, I need to see exactly when and why the gate overrode the model
**Acceptance Criteria:**
- `gate_overrides` is a real, populated field on `recovery_actions (extended)` (not currently in schema — see Epic 3).
- Every time the gate modifies a proposal, a human-readable string is appended, not just a boolean flag.

---

## EPIC 2: Two-Stage LLM Pipeline (Diagnosis → Decision)
**Why this matters:** The audit confirms the system currently makes one combined LLM call, not the diagnose-then-decide split the PRD specifies. This split is what elevates the AI from "a classifier with 4 buttons" to genuine multi-signal reasoning — it's your strongest answer to "isn't this just a rules engine with an LLM wrapper."

### US-2.1 — As the system, I need a dedicated diagnosis step that reasons about root cause without proposing any action
**Acceptance Criteria:**
- New function `diagnoseRecoveryEvent()` in `lib/recovery/stage1Diagnosis.ts`.
- Prompt strictly forbids mentioning actions or discount percentages (verify by inspecting the system prompt string directly, not just assuming).
- Returns free-text (3-5 sentences), not JSON.

### US-2.2 — As the system, I need the decision step to receive the diagnosis as explicit input, not re-derive it from raw context
**Acceptance Criteria:**
- `evaluateRecoveryAgentDecision()` signature updated to accept `diagnosisText: string` as a parameter.
- The decision prompt references the diagnosis text directly (e.g., "Given this diagnosis: {diagnosisText}...").

### US-2.3 — As the system, I need the four hard business rules actually written into the decision prompt, not just implied
**Acceptance Criteria:**
- Prompt string explicitly states: (a) max 10% discount, (b) no discount if `authorized_not_captured`, (c) `no_action` if elapsed time < 1hr, (d) prefer reminder over discount for first-time customers with low cart value.
- Note: these are prompt-level instructions as a first line of defense — Epic 1's code gate is the real enforcement. Both must exist; the prompt rules alone are not sufficient per the original PRD design principle.

### US-2.4 — As a developer, I need the pre-gate model output preserved separately from the post-gate final output
**Acceptance Criteria:**
- `recovery_actions (extended).proposed_action` / `proposed_discount_percent` store the raw Stage 2 output, untouched.
- `recovery_actions (extended).final_action` / `final_discount_percent` store the output after Epic 1's gate runs.
- These must visibly differ in at least one test case (proof the gate is doing something).

### US-2.5 — As a developer, I need to manually verify the two-stage pipeline against real scenarios before trusting it
**Acceptance Criteria:**
- Run at least 10 manual test events through the full diagnose→decide→gate chain.
- Confirm the diagnosis text is genuinely informative (not generic filler) for at least 3 distinct scenario types (price-sensitive, payment-friction, first-time-visitor).

---

## EPIC 3: Data Model Alignment
**Why this matters:** Current tables (`checkout_events`, `recovery_opportunities`, `recovery_actions`, `payment_events`) work, but don't match the audit trail shape needed to show diagnosis → proposal → gate → final action → outcome as one traceable row. You don't need to rename existing working tables — you need the missing fields/tables added.

### US-3.1 — As a developer, I need one table capturing the full agent decision trail per event
**Acceptance Criteria:**
- Extend `recovery_actions (extended)` with: `diagnosis_text`, `proposed_action`, `proposed_discount_percent`, `final_action`, `final_discount_percent`, `gate_overrides` (jsonb array), `outcome`.
- Apply this approach consistently across the codebase.

### US-3.2 — As a developer, I need a policy state table the gate can read and update
**Acceptance Criteria:**
- `agent_policy_state` table exists with `daily_discount_budget`, `discount_spent_today`, `policy_date`, `max_discount_percent`, `max_actions_per_order`.
- A seed row exists with sensible defaults (e.g. ₹5000/day, 10% max).
- `discount_spent_today` resets when `policy_date` rolls to a new day (either via a cron reset or a check-on-read pattern).

### US-3.3 — As a developer, I need orders traceable back to the recovery action that caused them
**Acceptance Criteria:**
- `orders.recovery_action_id` FK added, pointing to the action row that led to that order (for recovered payments specifically).

### US-3.4 — As a security-conscious builder, I need RLS on every new table
**Acceptance Criteria:**
- RLS enabled on `recovery_actions (extended)` and `agent_policy_state`.
- Policies restrict write access to server-side service role only; admin read access via existing admin auth pattern.

---

## EPIC 4: Automated Event Detection
**Why this matters:** `detectCartAbandonment()` exists but requires manual invocation — meaning today, real abandoned carts are not actually being caught unless someone triggers the check. This is a real functional gap, not just a nice-to-have.

### US-4.1 — As the merchant, I need idle carts detected automatically without manual triggering
**Acceptance Criteria:**
- `/api/cron/scan-idle-carts` route exists, scheduled via Vercel Cron (or equivalent interval mechanism).
- It queries sessions idle beyond the threshold with no successful payment and invokes `detectCartAbandonment()` for each.
- Confirm via logs that it runs on a schedule, not only when manually hit.

### US-4.2 — As the system, I need webhook-sourced events (payment_failed, authorized_not_captured) to land in the same event table the agent pipeline reads from
**Acceptance Criteria:**
- Webhook handler writes into `funnel_events` (or the equivalent aligned table from Epic 3), not only `payment_events`.
- Confirm the agent pipeline actually reads from this table as its trigger source — not a separate, disconnected table.

---

## EPIC 5: Action Execution Completeness
**Why this matters:** `no_action` and `retry_payment_link` work end to end. `offer_discount` — arguably the most judge-visible action — does not yet create a real discounted Razorpay order.

### US-5.1 — As a customer, when the agent offers me a discount, I need a real, correctly-discounted payment link
**Acceptance Criteria:**
- `createDiscountedRazorpayOrder(orderId, discountPercent)` implemented, creating a Razorpay Order at `cart_total * (1 - discountPercent/100)`.
- The discount percent used is the **gated/final** value from Epic 1, never the raw model proposal.
- Test: trigger a discount-eligible event, confirm the resulting Razorpay order amount matches the expected discounted total exactly.

### US-5.2 — As the merchant, I need reminder actions to have a visible, demoable effect
**Acceptance Criteria:**
- `sendReminderNotificationStub()` implemented — minimum bar is a logged simulated dispatch, ideally a real email/SMS stub.
- Visible in the audit log as a distinct outcome from `no_action`.

---

## EPIC 6: Evaluation & Metrics
**Why this matters:** This is your evidence section for the judges. Right now: 30/60 test cases exist, no dev/held-out split, no precision/recall numbers, no latency or cost data. Per every scoring pass so far, this is one of the highest-leverage gaps to close.

### US-6.1 — As a builder, I need a properly sized and split evaluation set
**Acceptance Criteria:**
- `evaluationCases.ts` expanded from 30 to 60 labeled events.
- Explicit `DEV_DATASET_40` and `HELD_OUT_DATASET_20` exports — held-out set is never used during prompt iteration.

### US-6.2 — As a builder, I need real precision and recall numbers, not just pass/fail rates
**Acceptance Criteria:**
- `test_day5_ai_commerce.ts` (or equivalent) computes precision = TP/(TP+FP) and recall = TP/(TP+FN) against the held-out set specifically.
- Numbers are printed/logged and saved somewhere retrievable for the pitch (not just console output that's lost after running).

### US-6.3 — As a builder, I need to know how often my own safety gate actually intervenes
**Acceptance Criteria:**
- `gateInterventionRate = gateModifiedCount / totalProposals` calculated across the eval run.
- This number should be non-zero — if it's zero, either your gate rules are too loose or your eval set doesn't include edge cases that should trigger them (fix the eval set, don't just report zero).

### US-6.4 — As a builder, I need latency and cost numbers I can state confidently under questioning
**Acceptance Criteria:**
- Median and P95 latency measured end-to-end (event detection → final gated action) using timestamps around the pipeline.
- Token usage extracted from Gemini's `usageMetadata` per call, converted to an estimated ₹/event cost, and modeled at a stated volume (e.g., 1,000 events/day).

### US-6.5 — As a builder, I need one concrete example proving the diagnosis step adds value a rules engine couldn't
**Acceptance Criteria:**
- From the actual eval set, identify and document one case where Stage 1's reasoning correctly weighed conflicting signals (e.g., high cart value but first-time customer, or short elapsed time but repeat customer) in a way a single-threshold rule would have gotten wrong.
- Write this up as a one-paragraph note you can recite from memory in a panel interview.

---

## EPIC-7: Audit Trail / Admin Dashboard
**Why this matters:** A partial audit view exists embedded in the admin page, but doesn't yet show diagnosis text or gate overrides — the two fields that make the trail actually prove your bounded/gated story.

### US-7.1 — As an admin/judge, I need a dedicated, linkable audit log view
**Acceptance Criteria:**
- `app/admin/agent-log/page.tsx` exists as its own route (not only an embedded section on the main admin page).

### US-7.2 — As an admin/judge, I need to see the full causal chain per event in one place
**Acceptance Criteria:**
- Each row displays, left to right: event → diagnosis text → proposed action/discount → gate overrides (if any) → final action/discount → outcome.
- This is blocked on Epic 3's schema fields existing — sequence accordingly.

---

## EPIC 8: Reliability & Security Hardening
**Why this matters:** Mostly solid already (signature validation, idempotency, no PII to the LLM, server-side keys). Two real gaps remain.

### US-8.1 — As the system, when the LLM fails, I need this explicitly logged as an AI failure, not silently treated as a normal rule-based decision
**Acceptance Criteria:**
- Catch block in the decision step sets `source: 'llm_failure_fallback'` (not the current generic `'rule_fallback'`) when the failure is specifically an LLM/API error.
- Action defaults to `no_action` in this path, per the PRD's reliability principle — verify this is actually happening, not just a fallback to a different rule-based guess.

### US-8.2 — As the merchant, I need protection against abuse of my public-facing endpoints
**Acceptance Criteria:**
- Rate limiting added to the webhook receiver and `/api/checkout-recovery/track` (IP-based token bucket or equivalent).
- Confirm signature validation still runs first, rate limiting is a second layer, not a replacement.

---

## EPIC 9: Demo Readiness
**Why this matters:** Two of your three strongest demo beats (budget-ceiling override, recorded fallback video) are blocked entirely on Epics 1 and 3 landing first. Sequence this last, deliberately.

### US-9.1 — As a presenter, I need to trigger a budget-ceiling override live, on demand
**Acceptance Criteria:**
- Blocked on US-1.4 and US-3.2 being complete.
- `scripts/trigger_budget_exhaustion.ts` exists, simulating enough discount-eligible events to hit the daily ceiling in one run.

### US-9.2 — As a presenter, I need backup video for my two highest-risk live demo beats
**Acceptance Criteria:**
- Recorded video of the budget-ceiling override (from US-9.1).
- Recorded video of the LLM-failure graceful fallback (kill the API key, trigger an event, show `no_action` logged with `llm_failure_fallback`).

---

## Suggested Sequencing (given audit findings + remaining time)

1. **Epic 3** (schema) — unblocks almost everything else downstream.
2. **Epic 1** (policy gate) — the single highest-stakes gap; do this immediately after schema exists.
3. **Epic 2** (two-stage pipeline) — architecture upgrade, pairs naturally with Epic 1's gate consuming its output.
4. **Epic 4** (automated detection) — makes the system actually live/reactive instead of manually triggered.
5. **Epic 5** (discount order execution) — completes the action set.
6. **Epic 6** (evaluation) — run once the pipeline is stable, not before.
7. **Epic 7** (audit dashboard) — depends on Epic 3's fields existing.
8. **Epic 8** (hardening) — parallelizable with anything above once you have spare capacity.
9. **Epic 9** (demo prep) — last, since it depends on Epics 1 and 3.
