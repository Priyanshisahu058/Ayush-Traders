import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { recordStylistEvent } from "@/lib/supabase/stylist";

const GEMINI_MODEL = "gemini-3.6-flash";

const intentResponseSchema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "Must be 'bracelet', 'anklet', 'chain', 'ring', or null",
      nullable: true,
    },
    collection: {
      type: Type.STRING,
      description: "Must be 'silver', 'artificial', or null",
      nullable: true,
    },
    minBudget: {
      type: Type.NUMBER,
      description: "Minimum budget in INR if specified, else null",
      nullable: true,
    },
    maxBudget: {
      type: Type.NUMBER,
      description: "Maximum budget in INR if specified, else null",
      nullable: true,
    },
    styleKeyword: {
      type: Type.STRING,
      description: "Style keyword: 'minimal', 'traditional', 'heavy', 'daily', 'statement', 'modern', 'bridal'",
      nullable: true,
    },
    occasion: {
      type: Type.STRING,
      description: "Occasion: 'wedding', 'birthday', 'anniversary', 'festival', 'daily'",
      nullable: true,
    },
    recipient: {
      type: Type.STRING,
      description: "Recipient: 'sister', 'mother', 'wife', 'friend', 'self'",
      nullable: true,
    },
    preferredWeight: {
      type: Type.STRING,
      description: "'light' if customer prefers delicate/lightweight, 'heavy' if statement/heavy",
      nullable: true,
    },
    avoidCategory: {
      type: Type.STRING,
      description: "Category user wants to avoid (e.g. 'ring' if 'I don't want rings')",
      nullable: true,
    },
    avoidStyle: {
      type: Type.STRING,
      description: "Style user wants to avoid (e.g. 'heavy' if 'I don't like heavy jewellery')",
      nullable: true,
    },
    isRejectionQuery: {
      type: Type.BOOLEAN,
      description: "True if user rejects previous pick (e.g., 'don't like the first one', 'show alternatives')",
    },
    needsClarification: {
      type: Type.BOOLEAN,
      description: "True ONLY if prompt is extremely vague (e.g. 'something nice', 'suggest jewellery'). Do NOT set true if prompt has occasion/style even if budget is missing!",
    },
    clarificationQuestion: {
      type: Type.STRING,
      description: "Friendly clarification question if needsClarification is true",
      nullable: true,
    },
    clarificationPills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 quick choice option pills for user if needsClarification is true",
    },
    summaryMessage: {
      type: Type.STRING,
      description: "Polite 1-sentence response explaining what intent was understood.",
      nullable: true,
    },
  },
  required: ["needsClarification", "isRejectionQuery"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, existingPrefs } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("your-gemini-api-key")) {
      return NextResponse.json(
        { success: false, fallback: true, source: "FALLBACK_NO_KEY" },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
User Query: "${query.trim()}"
Existing Conversation Context: ${JSON.stringify(existingPrefs || {})}

Instructions:
1. Extract customer shopping intent for AT Ornaments (category: bracelet, anklet, chain, ring | collection: silver, artificial).
2. Extract numeric budget bounds accurately (e.g. "under ₹2000" -> maxBudget: 2000).
3. Detect negative preferences (e.g. "no heavy jewellery" -> preferredWeight: "light", avoidStyle: "heavy" | "no rings" -> avoidCategory: "ring").
4. Detect rejection signals (e.g. "don't like the first one" -> isRejectionQuery: true).
5. AMBIGUITY RULE: Set needsClarification=true ONLY if prompt is completely vague ("something nice", "suggest jewellery", "I want a gift").
   DO NOT force clarification if prompt has style, category, or occasion (e.g. "traditional jewellery for a wedding" has enough context -> needsClarification: false).
`.trim();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: promptText,
      config: {
        systemInstruction: "You are the expert conversational AI Stylist for AT Ornaments. Output strictly valid JSON matching the schema. Never invent products, prices, or inventory.",
        responseMimeType: "application/json",
        responseSchema: intentResponseSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const intent = JSON.parse(responseText);
    const sessionId = body.sessionId || "session_anon";

    if (intent.needsClarification) {
      await recordStylistEvent(sessionId, "clarification_asked");
    } else if (intent.isRejectionQuery) {
      await recordStylistEvent(sessionId, "refinement_requested");
    } else {
      await recordStylistEvent(sessionId, "recommendation_generated");
    }

    return NextResponse.json({
      success: true,
      source: "GEMINI_API",
      model: GEMINI_MODEL,
      intent,
    });
  } catch (err: any) {
    console.warn("Gemini Stylist Route Exception:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        source: "FALLBACK_TRIGGERED",
        error: err?.message || "Gemini API request failed",
        fallback: true,
      },
      { status: 200 }
    );
  }
}
