import { GoogleGenAI, Type } from "@google/genai";
import { classifyPaymentFailure, FailureCategory, NormalizedFailurePayload } from "./failureClassifier";
import { getSupabaseClient } from "../supabase/client";

export interface AIAnalysisResult {
  failure_category: FailureCategory;
  confidence: number;
  customer_explanation: string;
  recommended_action: string;
  retry_allowed: boolean;
  source: "gemini" | "rule_fallback" | "cached";
}

// In-memory analysis cache to prevent repeated API calls
const analysisCache = new Map<string, AIAnalysisResult>();

const GEMINI_MODEL = "gemini-3.6-flash";

const paymentAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    failure_category: {
      type: Type.STRING,
      description: "Must be one of: 'bank_declined', 'insufficient_funds', 'card_declined', 'authentication_failed', 'network_failure', 'timeout', 'payment_cancelled', 'invalid_details', or 'unknown'",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0.0 and 1.0 based strictly on provided metadata.",
    },
    customer_explanation: {
      type: Type.STRING,
      description: "Polite, empathetic 1-2 sentence explanation for the customer. Must clarify whether money was debited.",
    },
    recommended_action: {
      type: Type.STRING,
      description: "Action recommendation like 'retry_payment', 'try_another_card_or_upi', or 'contact_bank'.",
    },
    retry_allowed: {
      type: Type.BOOLEAN,
      description: "True if customer can safely attempt payment retry.",
    },
  },
  required: ["failure_category", "confidence", "customer_explanation", "recommended_action", "retry_allowed"],
};

/**
 * Analyzes payment failure using Gemini AI with DB-First Caching and Rule-Based Fallback
 */
export async function analyzePaymentFailureWithAI(
  payload: NormalizedFailurePayload
): Promise<AIAnalysisResult> {
  const eventKey = `${payload.paymentId || payload.orderId || "event"}_${payload.errorCode || "err"}_${payload.reason || "rsn"}`;

  // -------------------------------------------------------------
  // 1. CACHE CHECK: In-Memory Cache Optimization
  // -------------------------------------------------------------
  if (analysisCache.has(eventKey)) {
    const cached = analysisCache.get(eventKey)!;
    return { ...cached, source: "cached" };
  }

  // -------------------------------------------------------------
  // 2. DB-FIRST CACHE CHECK: Query payment_recovery_events table
  // -------------------------------------------------------------
  const supabase = getSupabaseClient();
  if (supabase && (payload.paymentId || payload.orderId)) {
    try {
      const { data: dbRecord } = await supabase
        .from("payment_recovery_events")
        .select("*")
        .or(`payment_id.eq.${payload.paymentId || ""},order_id.eq.${payload.orderId || ""}`)
        .maybeSingle();

      if (dbRecord && dbRecord.failure_category) {
        const cachedResult: AIAnalysisResult = {
          failure_category: dbRecord.failure_category as FailureCategory,
          confidence: parseFloat(dbRecord.ai_confidence || "0.9"),
          customer_explanation: dbRecord.customer_message,
          recommended_action: dbRecord.recommended_action,
          retry_allowed: dbRecord.retry_allowed ?? true,
          source: "cached",
        };
        analysisCache.set(eventKey, cachedResult);
        return cachedResult;
      }
    } catch (err) {
      console.warn("[Cache Check] Supabase recovery event check notice:", err);
    }
  }

  // Generate Rule-Based Baseline Fallback
  const ruleBaseline = classifyPaymentFailure(payload);
  const fallbackResult: AIAnalysisResult = {
    failure_category: ruleBaseline.category,
    confidence: 0.85,
    customer_explanation: ruleBaseline.explanation,
    recommended_action: ruleBaseline.recommendedAction,
    retry_allowed: ruleBaseline.retryAllowed,
    source: "rule_fallback",
  };

  // -------------------------------------------------------------
  // 3. GEMINI AI ANALYSIS (Server-Side Only)
  // -------------------------------------------------------------
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && !apiKey.includes("your-gemini-api-key")) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a payment recovery assistant for AT Ornaments ecommerce.
Analyze ONLY the supplied payment failure metadata.
RULES:
1. You do NOT have authority to determine if payment succeeded or mark orders as Paid.
2. Never invent or hallucinate failure reasons not supported by metadata.
3. If metadata is insufficient, set failure_category to 'unknown'.
4. Output strict structured JSON.`;

      const prompt = `Analyze this payment failure metadata:
- Payment ID: ${payload.paymentId || "N/A"}
- Error Code: ${payload.errorCode || "N/A"}
- Error Description: ${payload.errorDescription || "N/A"}
- Reason: ${payload.reason || "N/A"}
- Source: ${payload.source || "N/A"}
- Method: ${payload.method || "N/A"}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: paymentAnalysisSchema,
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);

        // Strict Confidence Threshold: If confidence < 0.60, use safe generic fallback
        const aiConfidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

        if (aiConfidence < 0.60) {
          console.log(`[AI Confidence Low] ${aiConfidence} < 0.60. Using rule-based fallback.`);
        } else {
          const aiResult: AIAnalysisResult = {
            failure_category: (parsed.failure_category as FailureCategory) || ruleBaseline.category,
            confidence: aiConfidence,
            customer_explanation: parsed.customer_explanation || ruleBaseline.explanation,
            recommended_action: parsed.recommended_action || ruleBaseline.recommendedAction,
            retry_allowed: parsed.retry_allowed ?? true,
            source: "gemini",
          };

          // Cache in memory and DB
          analysisCache.set(eventKey, aiResult);
          await saveRecoveryEventToSupabase(payload, aiResult);
          return aiResult;
        }
      }
    } catch (err: any) {
      console.warn("[Gemini AI Error] Falling back to rule-based classifier:", err?.message || err);
    }
  }

  // Cache and save fallback result
  analysisCache.set(eventKey, fallbackResult);
  await saveRecoveryEventToSupabase(payload, fallbackResult);

  return fallbackResult;
}

/**
 * Saves recovery event analysis record to Supabase
 */
async function saveRecoveryEventToSupabase(
  payload: NormalizedFailurePayload,
  result: AIAnalysisResult
) {
  const supabase = getSupabaseClient();
  if (!supabase || (!payload.paymentId && !payload.orderId)) return;

  try {
    await supabase.from("payment_recovery_events").insert({
      order_id: payload.orderId || "unknown",
      payment_id: payload.paymentId || null,
      failure_category: result.failure_category,
      ai_confidence: result.confidence,
      recommended_action: result.recommended_action,
      customer_message: result.customer_explanation,
      retry_allowed: result.retry_allowed,
      source: result.source,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Notice saving payment_recovery_event:", err);
  }
}
