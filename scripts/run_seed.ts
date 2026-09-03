import { seedAll48ProductsToSupabase, fetchProductsFromSupabase } from "../lib/supabase/products";
import { ALL_PRODUCTS } from "../lib/products/data";
import { computeProductPrice } from "../lib/pricing/computePrice";

async function runSeedAndVerification() {
  console.log("=== MIGRATING 48 AT ORNAMENTS PRODUCTS TO SUPABASE ===");

  console.log("CATALOG SOURCE FILE: lib/products/data.ts");
  console.log("PRODUCTS FOUND IN SOURCE:", ALL_PRODUCTS.length);

  if (ALL_PRODUCTS.length !== 48) {
    console.error(`WARNING: Found ${ALL_PRODUCTS.length} products instead of 48`);
  }

  // Perform idempotent seed
  console.log("\nExecuting idempotent upsert to Supabase products table...");
  const seedResult = await seedAll48ProductsToSupabase();
  console.log(`Seeding Result - Success: ${seedResult.success}, Seeded Count: ${seedResult.seededCount}`);

  // Verification 1: Query Supabase products table
  console.log("\nFetching products back from Supabase for verification...");
  const sbProducts = await fetchProductsFromSupabase();

  const supabaseCount = sbProducts ? sbProducts.length : 0;
  console.log("SUPABASE PRODUCT COUNT:", supabaseCount);

  // Check for duplicate IDs or Slugs
  const ids = (sbProducts || []).map((p) => p.id);
  const slugs = (sbProducts || []).map((p) => p.slug);
  const duplicateIdsCount = ids.length - new Set(ids).size;
  const duplicateSlugsCount = slugs.length - new Set(slugs).size;

  console.log("DUPLICATES FOUND (IDs):", duplicateIdsCount);
  console.log("DUPLICATES FOUND (Slugs):", duplicateSlugsCount);

  // Missing products check
  const fetchedIds = new Set(ids);
  const missingCount = ALL_PRODUCTS.filter((p) => !fetchedIds.has(p.id)).length;
  console.log("MISSING PRODUCTS:", missingCount);

  // Images Verification
  const allImagesValid = (sbProducts || []).every((p) => Array.isArray(p.images) && p.images.length > 0);
  console.log("IMAGES VERIFIED:", allImagesValid ? "PASS" : "FAIL");

  // Pricing & Silver Rate Engine Verification
  let pricingVerified = true;
  let silverRateEngineVerified = true;

  if (sbProducts && sbProducts.length > 0) {
    for (const sbP of sbProducts) {
      const sourceP = ALL_PRODUCTS.find((p) => p.id === sbP.id);
      if (!sourceP) {
        pricingVerified = false;
        break;
      }

      // Test computeProductPrice at silver rate = 95 INR/g
      const sourceCalcPrice = computeProductPrice(sourceP, 95);
      const sbCalcPrice = computeProductPrice(sbP, 95);

      if (sourceCalcPrice !== sbCalcPrice) {
        console.error(`Price mismatch for product ${sbP.id}: source=${sourceCalcPrice}, sb=${sbCalcPrice}`);
        pricingVerified = false;
        silverRateEngineVerified = false;
      }
    }
  } else {
    pricingVerified = false;
    silverRateEngineVerified = false;
  }

  console.log("PRICING VERIFIED:", pricingVerified ? "PASS" : "FAIL");
  console.log("SILVER RATE ENGINE:", silverRateEngineVerified ? "PASS" : "FAIL");
}

runSeedAndVerification();
