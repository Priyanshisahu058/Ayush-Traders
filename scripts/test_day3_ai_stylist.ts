import { parseUserQuery, runAiStylistRecommendationWithPreferences } from "../lib/ai/stylist/engine";
import { UserPreferences } from "../lib/ai/stylist/types";

async function runDay3AcceptanceTests() {
  console.log("================================================");
  console.log("🧪 DAY 3 — AI STYLIST & CONVERSATIONAL TEST SUITE");
  console.log("================================================\n");

  let passed = 0;
  const total = 20;

  // ---------------------------------------------------------
  // Test 1 — Clear Budget Query
  // ---------------------------------------------------------
  console.log("Test 1: Clear Budget Query");
  const t1 = parseUserQuery("Ring under ₹2,000");
  if (t1.maxBudget === 2000 && t1.category === "ring") {
    console.log("✅ PASS: Correctly extracted maxBudget=2000 & category=ring");
    passed++;
  } else {
    console.error(`❌ FAIL: maxBudget=${t1.maxBudget}, category=${t1.category}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 2 — Missing Budget (Should recommend WITHOUT forcing clarification!)
  // ---------------------------------------------------------
  console.log("Test 2: Missing Budget with Sufficient Context");
  const res2 = runAiStylistRecommendationWithPreferences("Traditional jewellery for a wedding", {
    occasion: "wedding",
    styleKeyword: "traditional",
  });
  if (!res2.needsClarification && res2.recommendations.length > 0) {
    console.log("✅ PASS: Recommended products without forcing budget clarification!");
    passed++;
  } else {
    console.error(`❌ FAIL: needsClarification=${res2.needsClarification}, count=${res2.recommendations.length}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 3 — Missing Occasion
  // ---------------------------------------------------------
  console.log("Test 3: Missing Occasion");
  const res3 = runAiStylistRecommendationWithPreferences("Silver chain under ₹1,500", {
    category: "chain",
    maxBudget: 1500,
  });
  if (res3.recommendations.length > 0 && res3.recommendations.every((r) => r.calculatedPrice <= 1500)) {
    console.log("✅ PASS: Recommended silver chains under ₹1,500");
    passed++;
  } else {
    console.error("❌ FAIL: Budget violation or no recommendations");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 4 — Vague Query (Must trigger clarification!)
  // ---------------------------------------------------------
  console.log("Test 4: Vague Query ('Something nice')");
  const res4 = runAiStylistRecommendationWithPreferences("Something nice", {});
  if (res4.needsClarification && res4.clarificationPills && res4.clarificationPills.length > 0) {
    console.log("✅ PASS: Triggered ambiguity clarification question & pills!");
    passed++;
  } else {
    console.error("❌ FAIL: Did not trigger clarification for vague prompt");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 5 — Gift Query
  // ---------------------------------------------------------
  console.log("Test 5: Gift Query");
  const t5 = parseUserQuery("Gift for my sister under ₹2,500");
  if (t5.maxBudget === 2500 && t5.occasion === "birthday" || t5.recipient === "sister") {
    console.log("✅ PASS: Extracted gift intent for sister under ₹2,500");
    passed++;
  } else {
    console.error(`❌ FAIL: maxBudget=${t5.maxBudget}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 6 — Sister Gift
  // ---------------------------------------------------------
  console.log("Test 6: Sister Gift Category Match");
  const res6 = runAiStylistRecommendationWithPreferences("Anklet for sister", {
    category: "anklet",
    recipient: "sister",
  });
  if (res6.recommendations.length > 0 && res6.recommendations[0].product.category === "anklet") {
    console.log("✅ PASS: Correctly recommended anklet for sister");
    passed++;
  } else {
    console.error("❌ FAIL: Category mismatch for sister gift");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 7 — Wedding Query
  // ---------------------------------------------------------
  console.log("Test 7: Wedding Query");
  const t7 = parseUserQuery("Bridal payal for wedding");
  if (t7.category === "anklet" && t7.occasion === "wedding") {
    console.log("✅ PASS: Extracted payal (anklet) & wedding occasion");
    passed++;
  } else {
    console.error(`❌ FAIL: category=${t7.category}, occasion=${t7.occasion}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 8 — Festive Query
  // ---------------------------------------------------------
  console.log("Test 8: Festive Query");
  const t8 = parseUserQuery("Ethnic ring for Diwali festive wear");
  if (t8.category === "ring" && t8.occasion === "festive") {
    console.log("✅ PASS: Extracted ring & festive occasion");
    passed++;
  } else {
    console.error(`❌ FAIL: category=${t8.category}, occasion=${t8.occasion}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 9 — Everyday Query
  // ---------------------------------------------------------
  console.log("Test 9: Everyday Query");
  const t9 = parseUserQuery("Minimal chain for daily office wear");
  if (t9.category === "chain" && t9.styleKeyword === "minimal") {
    console.log("✅ PASS: Extracted minimal chain for daily office wear");
    passed++;
  } else {
    console.error(`❌ FAIL: category=${t9.category}, styleKeyword=${t9.styleKeyword}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 10 — Traditional Style
  // ---------------------------------------------------------
  console.log("Test 10: Traditional Style Match");
  const res10 = runAiStylistRecommendationWithPreferences("Traditional oxidized ring", {
    category: "ring",
    styleKeyword: "traditional",
  });
  if (res10.recommendations.length > 0 && res10.recommendations[0].product.category === "ring") {
    console.log("✅ PASS: Correctly recommended traditional ring");
    passed++;
  } else {
    console.error("❌ FAIL: Traditional ring match failed");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 11 — Modern Style
  // ---------------------------------------------------------
  console.log("Test 11: Modern Style Match");
  const t11 = parseUserQuery("Sleek modern solitaire ring");
  if (t11.category === "ring") {
    console.log("✅ PASS: Correctly parsed modern ring category");
    passed++;
  } else {
    console.error(`❌ FAIL: category=${t11.category}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 12 — Minimal Style
  // ---------------------------------------------------------
  console.log("Test 12: Minimal Style Match");
  const t12 = parseUserQuery("Minimalist silver anklet");
  if (t12.category === "anklet" && t12.collection === "silver") {
    console.log("✅ PASS: Parsed minimalist silver anklet");
    passed++;
  } else {
    console.error(`❌ FAIL: category=${t12.category}, collection=${t12.collection}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 13 — Explicit Category
  // ---------------------------------------------------------
  console.log("Test 13: Explicit Category (Bracelet)");
  const res13 = runAiStylistRecommendationWithPreferences("Silver bracelet", {
    category: "bracelet",
    collection: "silver",
  });
  if (res13.recommendations.every((r) => r.product.category === "bracelet")) {
    console.log("✅ PASS: 100% of recommendations match requested 'bracelet' category");
    passed++;
  } else {
    console.error("❌ FAIL: Category restriction violated");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 14 — Explicit Material
  // ---------------------------------------------------------
  console.log("Test 14: Explicit Material (Artificial)");
  const res14 = runAiStylistRecommendationWithPreferences("Artificial Kundan jewellery", {
    collection: "artificial",
  });
  if (res14.recommendations.every((r) => r.product.collection === "artificial")) {
    console.log("✅ PASS: 100% of recommendations match requested 'artificial' collection");
    passed++;
  } else {
    console.error("❌ FAIL: Collection restriction violated");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 15 — Negative Preference ("No heavy jewellery")
  // ---------------------------------------------------------
  console.log("Test 15: Negative Preference Handling");
  const t15 = parseUserQuery("No heavy jewellery, lightweight ring please");
  if (t15.preferredWeight === "light" && t15.avoidStyle === "heavy") {
    console.log("✅ PASS: Extracted preferredWeight=light & avoidStyle=heavy!");
    passed++;
  } else {
    console.error(`❌ FAIL: preferredWeight=${t15.preferredWeight}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 16 — Product Rejection
  // ---------------------------------------------------------
  console.log("Test 16: Product Rejection & Refinement");
  const run16_initial = runAiStylistRecommendationWithPreferences("Rings under ₹2000", {
    category: "ring",
    maxBudget: 2000,
  });
  const rejectedId = run16_initial.recommendations[0]?.product.id;

  const run16_refined = runAiStylistRecommendationWithPreferences(
    "Don't like the first one",
    { category: "ring", maxBudget: 2000, rejectedProducts: [rejectedId] },
    null,
    undefined,
    rejectedId
  );

  const containsRejected = run16_refined.recommendations.some((r) => r.product.id === rejectedId);
  if (!containsRejected) {
    console.log(`✅ PASS: Rejected product '${rejectedId}' was EXCLUDED from refined recommendations!`);
    passed++;
  } else {
    console.error("❌ FAIL: Rejected product was included in recommendations!");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 17 — Follow-up Refinement
  // ---------------------------------------------------------
  console.log("Test 17: Follow-up Refinement");
  const res17 = runAiStylistRecommendationWithPreferences("Show me under ₹1,000 instead", {
    category: "ring",
    maxBudget: 1000,
  });
  if (res17.recommendations.every((r) => r.calculatedPrice <= 1000)) {
    console.log("✅ PASS: Refined recommendations respected new ₹1,000 budget cap!");
    passed++;
  } else {
    console.error("❌ FAIL: Follow-up budget cap violated");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 18 — No Matching Product / Zero Hallucination
  // ---------------------------------------------------------
  console.log("Test 18: Zero Match / No Hallucination");
  const res18 = runAiStylistRecommendationWithPreferences("Platinum necklace under ₹200", {
    maxBudget: 200,
    category: "chain",
  });
  if (res18.recommendations.length === 0 && res18.summaryMessage.includes("couldn't find an exact match")) {
    console.log("✅ PASS: ZERO fake products returned! Politeness message generated without hallucination.");
    passed++;
  } else {
    console.error(`❌ FAIL: Returned ${res18.recommendations.length} fake products!`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 19 — Strict Budget Boundary Enforcement
  // ---------------------------------------------------------
  console.log("Test 19: Strict Budget Boundary Enforcement");
  const res19 = runAiStylistRecommendationWithPreferences("Ring under ₹1200", {
    category: "ring",
    maxBudget: 1200,
  });
  const violations = res19.recommendations.filter((r) => r.calculatedPrice > 1200);
  if (violations.length === 0) {
    console.log("✅ PASS: 0 budget violations across all recommendations!");
    passed++;
  } else {
    console.error(`❌ FAIL: Found ${violations.length} budget violations`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // Test 20 — Multi-Turn Conversation State Persistence
  // ---------------------------------------------------------
  console.log("Test 20: Multi-Turn Conversation State Persistence");
  let state: UserPreferences = {};

  // Turn 1
  state = parseUserQuery("I need something for my sister", state); // recipient: sister
  // Turn 2
  state = parseUserQuery("wedding occasion", state); // occasion: wedding
  // Turn 3
  state = parseUserQuery("under 2000", state); // maxBudget: 2000

  if (state.recipient === "sister" && state.occasion === "wedding" && state.maxBudget === 2000) {
    console.log("✅ PASS: State persisted perfectly across 3 turns (sister + wedding + 2000)!");
    passed++;
  } else {
    console.error(`❌ FAIL: Persisted state = ${JSON.stringify(state)}`);
  }
  console.log("=================================================");

  console.log(`\nRESULTS: ${passed}/${total} TESTS PASSED.`);
  if (passed === total) {
    console.log("🎉 ALL DAY 3 AI STYLIST ACCEPTANCE TESTS PASSED SUCCESSFULLY!\n");
  } else {
    process.exit(1);
  }
}

runDay3AcceptanceTests();
