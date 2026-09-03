import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-3.6-flash";

export interface FunnelEventInput {
  eventType: "cart_abandoned" | "payment_failed" | "authorized_not_captured" | string;
  cartTotal: number;
  timeSinceEventHours: number;
  paymentAttemptStatus?: string;
  customerPurchaseHistoryCount?: number;
  productCategory?: string;
  rawContext?: Record<string, any>;
}

export const STAGE1_DIAGNOSIS_SYSTEM_PROMPT = `You are a specialized E-commerce Behavioral Diagnostic Analyst for AT Ornaments (premium silver & fashion jewelry store). Your single task is to analyze checkout & cart event signals to diagnose the customer's true friction point or behavioral motivation.

STRICT ROLE CONSTRAINTS:
1. You are a diagnostic analyst ONLY. Do NOT propose recovery actions (such as retry, remind, or discount).
2. Do NOT mention specific discount percentages or monetary offers.
3. Do NOT address or write message copy to the customer. Write purely analytical notes for the merchant/system.

DIAGNOSTIC FRAMEWORK:
Evaluate the input event against five behavioral profiles:
- Price-Sensitivity Friction: High cart total relative to category, long hesitation, no payment attempted.
- Payment-Friction / Technical Glitch: Payment attempt made but failed (e.g. gateway error, bank decline, OTP timeout).
- First-Time Visitor Caution: Zero prior purchases (purchase_history_count = 0), abandoning low/medium cart value, requiring trust nudges rather than aggressive incentives.
- Repeat-Customer Hesitation: High prior purchases, familiar with brand, needing gentle operational reminder.
- Simple Indecision / Browsing: Recent activity (< 1-2 hours), moderate cart total, evaluating product details.

Cite the specific input values (cart_total, event_type, time_since_event_hours, payment_attempt_status, purchase_history_count) in your reasoning.

OUTPUT FORMAT:
Output 3 to 5 concise, highly specific analytical sentences explaining the root cause of hesitation. Output free-text ONLY (do NOT output JSON or bullet lists).`;

/**
 * Executes Stage 1 LLM Call: Behavioral & Root-Cause Diagnosis
 */
export async function diagnoseRecoveryEvent(
  event: FunnelEventInput
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const historyCount = event.customerPurchaseHistoryCount ?? 0;
  const category = event.productCategory || "jewellery";
  const status = event.paymentAttemptStatus || "unpaid";

  // Deterministic Fallback Analysis if API Key unavailable
  const ruleAnalysis = getRuleBasedDiagnosis(event);

  if (!apiKey || apiKey.includes("your-gemini-api-key")) {
    return ruleAnalysis;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this checkout event for AT Ornaments:
- Event Type: ${event.eventType}
- Cart Total: ₹${event.cartTotal}
- Time Since Event: ${event.timeSinceEventHours} hours
- Payment Attempt Status: ${status}
- Customer Purchase History Count: ${historyCount} prior purchase(s)
- Product Category: ${category}
- Raw Context Details: ${JSON.stringify(event.rawContext || {})}

Provide your 3-5 sentence behavioral diagnostic analysis citing these specific input values. Do NOT propose actions or discounts.`;

    const generatePromise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: STAGE1_DIAGNOSIS_SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Stage 1 Gemini API call timed out after 12000ms")), 12000)
    );

    const res = await Promise.race([generatePromise, timeoutPromise]);

    const text = res.text?.trim();
    if (text && text.length > 20) {
      return text;
    }
  } catch (err: any) {
    console.warn("[Stage 1 Diagnosis] Gemini call notice, using rule diagnosis fallback:", err?.message || err);
  }

  return ruleAnalysis;
}

function getRuleBasedDiagnosis(event: FunnelEventInput): string {
  const status = (event.paymentAttemptStatus || "").toLowerCase();
  const history = event.customerPurchaseHistoryCount ?? 0;

  if (status === "failed" || event.eventType === "payment_failed") {
    return `Payment-Friction Read: The customer attempted payment for ₹${event.cartTotal} worth of ${event.productCategory || "items"} but encountered a transaction failure (${status}). This indicates technical or banking friction during checkout rather than price resistance. With ${history} prior purchases, the customer has purchase intent but was blocked by gateway issues.`;
  }

  if (history === 0 && event.cartTotal < 2500) {
    return `First-Time Visitor Caution: A new customer with 0 prior purchases abandoned a ₹${event.cartTotal} cart after ${event.timeSinceEventHours} hours. For first-time visitors on lower-priced items, hesitation is driven by brand trust and delivery assurance rather than price objection. An informational reminder is appropriate before offering financial incentives.`;
  }

  if (event.cartTotal >= 4000) {
    return `Price-Sensitivity Read: High cart total of ₹${event.cartTotal} for ${event.productCategory || "jewelry"} abandoned after ${event.timeSinceEventHours} hours without a payment attempt. The high transaction value combined with extended idle time indicates budget consideration and price sensitivity. Financial incentive or promotional support may help convert this high-value opportunity.`;
  }

  return `Simple Indecision Read: Customer abandoned a ₹${event.cartTotal} cart ${event.timeSinceEventHours} hours ago with ${history} prior purchases. The transaction shows mild hesitation or distraction during multi-item selection. A standard operational checkout reminder will encourage session completion.`;
}
