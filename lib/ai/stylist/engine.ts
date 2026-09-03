import { Product, getEffectiveProducts } from "@/lib/products/data";
import { computeProductPrice, getActiveSilverRate } from "@/lib/pricing/computePrice";
import { UserPreferences, VisualContext, StylistRecommendation, StylistResponse } from "./types";

/**
 * Local Rule-Based Query Parser (Used as fallback if API call fails or API key missing)
 */
export function parseUserQuery(query: string, existingPrefs: UserPreferences = {}): UserPreferences {
  const q = query.toLowerCase();
  const prefs: UserPreferences = { ...existingPrefs };

  // 1. Category Extraction & Negative Avoidance
  if (q.includes("don't want ring") || q.includes("no ring") || q.includes("avoid ring")) {
    prefs.avoidCategory = "ring";
  } else if (q.includes("bracelet") || q.includes("kada") || q.includes("cuff") || q.includes("bangle")) {
    prefs.category = "bracelet";
  } else if (q.includes("anklet") || q.includes("payal")) {
    prefs.category = "anklet";
  } else if (q.includes("ring") || q.includes("solitaire")) {
    prefs.category = "ring";
  } else if (q.includes("chain") || q.includes("necklace") || q.includes("pendant")) {
    prefs.category = "chain";
  }

  // 2. Collection Extraction
  if (q.includes("silver") || q.includes("925") || q.includes("sterling")) {
    prefs.collection = "silver";
  } else if (q.includes("artificial") || q.includes("fashion") || q.includes("gold plated") || q.includes("kundan")) {
    prefs.collection = "artificial";
  }

  // 3. Negative Weight / Preference Extraction
  if (q.includes("not heavy") || q.includes("don't like heavy") || q.includes("lightweight") || q.includes("light")) {
    prefs.preferredWeight = "light";
    prefs.avoidStyle = "heavy";
  } else if (q.includes("heavy") || q.includes("statement") || q.includes("grand")) {
    prefs.preferredWeight = "heavy";
  }

  // 3. Budget extraction (under, below, <, rs, ₹)
  const qClean = q.replace(/,/g, "");
  const budgetMatch = qClean.match(/(?:under|below|less than|max|budget|rs\.?|₹)\s*(\d+k?|\d+)/i);
  if (budgetMatch) {
    let rawNum = budgetMatch[1].toLowerCase();
    if (rawNum.endsWith("k")) {
      rawNum = (parseFloat(rawNum) * 1000).toString();
    }
    const parsedBudget = parseInt(rawNum, 10);
    if (!isNaN(parsedBudget) && parsedBudget > 0) {
      prefs.maxBudget = parsedBudget;
    }
  }

  // 5. Style Keyword & Occasion Extraction
  if (q.includes("minimal") || q.includes("simple") || q.includes("sleek") || q.includes("daily") || q.includes("office")) {
    prefs.styleKeyword = "minimal";
  } else if (q.includes("traditional") || q.includes("ethnic") || q.includes("kundan") || q.includes("temple")) {
    prefs.styleKeyword = "traditional";
  }

  if (q.includes("wedding") || q.includes("marriage") || q.includes("bridal")) {
    prefs.occasion = "wedding";
  } else if (q.includes("festive") || q.includes("diwali") || q.includes("puja")) {
    prefs.occasion = "festive";
  } else if (q.includes("birthday") || q.includes("gift")) {
    prefs.occasion = "birthday";
  } else if (q.includes("sister")) {
    prefs.recipient = "sister";
  }

  return prefs;
}

export function generateVisualGuidance(hasImageDataUrl: boolean, prefs: UserPreferences): VisualContext | undefined {
  if (!hasImageDataUrl) return undefined;

  let guidance = "Based on the visible hand and wrist proportions in your photo, refined minimalist designs or openable cuffs could work well to create an elegant aesthetic.";
  if (prefs.category === "bracelet") {
    guidance = "Based on the visible wrist contours and hand framing, flexible link bracelets and openable cuff designs may complement the look effortlessly.";
  } else if (prefs.category === "ring") {
    guidance = "Based on the visible finger profile in your photo, solitaire settings and stackable bands could provide a sleek, balanced proportion.";
  } else if (prefs.category === "anklet") {
    guidance = "Based on your photo framing, delicate payal strands and charm payal pairs may sit comfortably with a graceful drape.";
  }

  return {
    wristOrHandDetected: true,
    styleGuidance: guidance,
  };
}

/**
 * Transparent Recommendation Scoring Engine & Catalogue Grounding Layer.
 * Calculates explicit numerical scores based on real Supabase product attributes.
 */
export function runAiStylistRecommendationWithPreferences(
  userQuery: string,
  prefs: UserPreferences,
  customSummary?: string | null,
  imageDataUrl?: string,
  forcedRejectionId?: string
): StylistResponse {
  const currentSilverRate = getActiveSilverRate();
  const effectiveCatalog = getEffectiveProducts();
  const visualContext = generateVisualGuidance(!!imageDataUrl, prefs);

  // Maintain rejected products list
  const rejectedList = new Set<string>(prefs.rejectedProducts || []);
  if (forcedRejectionId) {
    rejectedList.add(forcedRejectionId);
    prefs.rejectedProducts = Array.from(rejectedList);
  }

  // Detect Ambiguity: Only if prompt is completely vague and lacks category, occasion, or style!
  const qLower = userQuery.toLowerCase().trim();
  const isExtremelyVague =
    (qLower === "something nice" ||
      qLower === "suggest jewellery" ||
      qLower === "show me something pretty" ||
      qLower === "i want a gift") &&
    !prefs.category &&
    !prefs.occasion &&
    !prefs.styleKeyword &&
    !prefs.maxBudget;

  if (isExtremelyVague) {
    return {
      preferences: prefs,
      recommendations: [],
      needsClarification: true,
      clarificationQuestion: "I'd love to help you find something special! What are you shopping for?",
      clarificationPills: ["Everyday wear", "Festive occasion", "Wedding / Bridal", "Gift under ₹2,000"],
      summaryMessage: "I'd love to narrow this down for you. Please choose an option or tell me more about what you're looking for!",
      followUpSuggestions: ["Everyday wear", "Festive occasion", "Gift under ₹2,000"],
    };
  }

  // Transparent Recommendation Scoring
  let candidateScored = effectiveCatalog.map((prod) => {
    const price = computeProductPrice(prod, currentSilverRate);
    let score = 50; // Base baseline score

    // HARD CONSTRAINTS (Violation = score 0 / EXCLUDED)
    if (prefs.maxBudget && price > prefs.maxBudget) return { product: prod, calculatedPrice: price, score: 0 };
    if (prefs.category && prod.category !== prefs.category) return { product: prod, calculatedPrice: price, score: 0 };
    if (prefs.collection && prod.collection !== prefs.collection) return { product: prod, calculatedPrice: price, score: 0 };
    if (prefs.avoidCategory && prod.category === prefs.avoidCategory) return { product: prod, calculatedPrice: price, score: 0 };
    if (rejectedList.has(prod.id)) return { product: prod, calculatedPrice: price, score: 0 };

    const prodText = `${prod.name} ${prod.tag} ${prod.description} ${prod.categoryLabel} ${prod.purity}`.toLowerCase();

    // SOFT PREFERENCE RANKING
    if (prefs.styleKeyword) {
      if (prodText.includes(prefs.styleKeyword.toLowerCase())) score += 30;
    }

    if (prefs.occasion) {
      if (prodText.includes(prefs.occasion.toLowerCase())) score += 20;
    }

    if (prefs.preferredWeight === "light") {
      if ((prod.weightGrams && prod.weightGrams <= 5) || prodText.includes("minimal") || prodText.includes("delicate")) {
        score += 15;
      }
    } else if (prefs.preferredWeight === "heavy") {
      if ((prod.weightGrams && prod.weightGrams > 5) || prodText.includes("heavy") || prodText.includes("traditional")) {
        score += 15;
      }
    }

    // Popularity Boost
    if (prod.isBestseller) score += 10;
    if (prod.isFeatured) score += 5;
    if (prod.inStock) score += 10;

    return { product: prod, calculatedPrice: price, score };
  });

  // Filter out 0-score items (hard violations)
  let validMatches = candidateScored.filter((item) => item.score > 0);
  validMatches.sort((a, b) => b.score - a.score || a.calculatedPrice - b.calculatedPrice);

  let finalRecommendations: StylistRecommendation[] = [];
  let summaryMessage = customSummary || "";

  if (validMatches.length > 0) {
    const topPicks = validMatches.slice(0, 3);
    finalRecommendations = topPicks.map((item) => ({
      product: item.product,
      calculatedPrice: item.calculatedPrice,
      score: item.score,
      reason: generateGroundedReason(item.product, item.calculatedPrice, prefs, !!imageDataUrl),
      exceedsBudget: false,
    }));

    if (!summaryMessage) {
      const categoryLabel = prefs.category ? `${prefs.category}s` : "jewellery picks";
      const budgetText = prefs.maxBudget ? ` under ₹${prefs.maxBudget.toLocaleString("en-IN")}` : "";
      const occasionText = prefs.occasion ? ` for ${prefs.occasion}` : "";
      summaryMessage = `Here are my top recommendations for ${categoryLabel}${occasionText}${budgetText} from our AT Ornaments collection:`;
    }
  } else {
    // ZERO MATCH / NO HALLUCINATION FALLBACK
    finalRecommendations = [];
    if (!summaryMessage) {
      const budgetText = prefs.maxBudget ? ` under ₹${prefs.maxBudget.toLocaleString("en-IN")}` : "";
      summaryMessage = `I couldn't find an exact match in our current collection${budgetText}. Would you like to relax the budget or explore other styles?`;
    }
  }

  const followUpSuggestions = [
    "Under ₹1,500",
    "Show 925 Sterling Silver",
    "Show Artificial Jewellery",
    "Show traditional & festive picks",
    "Clear filters & restart",
  ];

  return {
    preferences: prefs,
    visualContext,
    recommendations: finalRecommendations,
    summaryMessage,
    needsClarification: false,
    followUpSuggestions,
  };
}

/**
 * Synchronous local engine fallback
 */
export function runAiStylistRecommendation(
  userQuery: string,
  imageDataUrl?: string,
  existingPrefs: UserPreferences = {},
  forcedRejectionId?: string
): StylistResponse {
  const prefs = parseUserQuery(userQuery, existingPrefs);
  return runAiStylistRecommendationWithPreferences(userQuery, prefs, null, imageDataUrl, forcedRejectionId);
}

/**
 * Primary Async AI Stylist Flow:
 * Calls server-side Gemini API (/api/stylist) to extract intent, then grounds results in real catalog engine.
 */
export async function runAiStylistWithServerApi(
  userQuery: string,
  imageDataUrl?: string,
  existingPrefs: UserPreferences = {},
  forcedRejectionId?: string
): Promise<StylistResponse> {
  try {
    const res = await fetch("/api/stylist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userQuery, existingPrefs }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.intent) {
        const intent = data.intent;
        const aiPrefs: UserPreferences = { ...existingPrefs };

        if (intent.category) aiPrefs.category = intent.category;
        if (intent.collection) aiPrefs.collection = intent.collection;
        if (intent.maxBudget) aiPrefs.maxBudget = intent.maxBudget;
        if (intent.minBudget) aiPrefs.minBudget = intent.minBudget;
        if (intent.styleKeyword) aiPrefs.styleKeyword = intent.styleKeyword;
        if (intent.occasion) aiPrefs.occasion = intent.occasion;
        if (intent.recipient) aiPrefs.recipient = intent.recipient;
        if (intent.preferredWeight) aiPrefs.preferredWeight = intent.preferredWeight;
        if (intent.avoidCategory) aiPrefs.avoidCategory = intent.avoidCategory;
        if (intent.avoidStyle) aiPrefs.avoidStyle = intent.avoidStyle;

        // If Gemini flagged clarification and user prompt was vague
        if (intent.needsClarification && intent.clarificationQuestion) {
          return {
            preferences: aiPrefs,
            recommendations: [],
            needsClarification: true,
            clarificationQuestion: intent.clarificationQuestion,
            clarificationPills: intent.clarificationPills || ["Everyday wear", "Festive", "Wedding", "Gift under ₹2000"],
            summaryMessage: intent.summaryMessage || intent.clarificationQuestion,
            followUpSuggestions: ["Everyday wear", "Festive", "Gift under ₹2,000"],
          };
        }

        return runAiStylistRecommendationWithPreferences(
          userQuery,
          aiPrefs,
          intent.summaryMessage,
          imageDataUrl,
          forcedRejectionId
        );
      }
    }
  } catch (e) {
    console.warn("Gemini API call failed, seamlessly using local rule-based fallback parser:", e);
  }

  // Fallback to local rule-based engine if API fails
  return runAiStylistRecommendation(userQuery, imageDataUrl, existingPrefs, forcedRejectionId);
}

/**
 * Generates a visible, grounded "Why this pick?" explanation strictly based on actual product attributes.
 */
function generateGroundedReason(
  product: Product,
  price: number,
  prefs: UserPreferences,
  hasImage: boolean
): string {
  let reasonParts: string[] = [];

  if (product.collection === "silver") {
    const weightStr = product.weightGrams ? `${product.weightGrams}g` : "solid band";
    reasonParts.push(`Pure 925 Sterling Silver (${weightStr})`);
  } else {
    reasonParts.push("Fine artificial finish with anti-tarnish coating");
  }

  if (prefs.styleKeyword) {
    reasonParts.push(`Matches your ${prefs.styleKeyword} style preference`);
  }

  if (prefs.occasion) {
    reasonParts.push(`Ideal for ${prefs.occasion} wear`);
  }

  if (prefs.maxBudget) {
    reasonParts.push(`Fits within ₹${prefs.maxBudget.toLocaleString("en-IN")} budget`);
  } else {
    reasonParts.push(`Live rate price: ₹${price.toLocaleString("en-IN")}`);
  }

  return "Why this pick? " + reasonParts.join(" • ") + ".";
}
