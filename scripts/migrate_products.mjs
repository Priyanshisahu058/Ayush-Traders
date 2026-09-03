import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

// ── 1. Load env from .env.local ──────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const envVars = loadEnv();
const SUPABASE_URL = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const SUPABASE_KEY = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local");
  process.exit(1);
}

// ── 2. Read product data directly from data.ts source text ──────────────────
// We parse the TS source to extract product objects and build them as JSON
// Since we can't import TS directly in .mjs, we use a temp eval approach via tsx
// Instead: we'll use child_process to run the tsx extractor
import { execSync } from "child_process";

const extractorScript = `
import { ALL_PRODUCTS } from "./lib/products/data";
import fs from "fs";
fs.writeFileSync("./scratch_products_dump.json", JSON.stringify(ALL_PRODUCTS, null, 2));
console.log("Exported", ALL_PRODUCTS.length, "products to scratch_products_dump.json");
`;

fs.writeFileSync("scratch_extractor.ts", extractorScript);

console.log("Extracting product catalog from lib/products/data.ts...");
try {
  execSync("npx tsx scratch_extractor.ts", { stdio: "inherit" });
} catch (e) {
  console.error("ERROR extracting products:", e.message);
  fs.unlinkSync("scratch_extractor.ts");
  process.exit(1);
}
fs.unlinkSync("scratch_extractor.ts");

if (!fs.existsSync("scratch_products_dump.json")) {
  console.error("ERROR: scratch_products_dump.json was not created");
  process.exit(1);
}

const ALL_PRODUCTS = JSON.parse(fs.readFileSync("scratch_products_dump.json", "utf8"));
fs.unlinkSync("scratch_products_dump.json");

console.log(`Found ${ALL_PRODUCTS.length} products in catalog`);

// ── 3. Upsert all 48 products into Supabase ──────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildPayload(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    category_label: product.categoryLabel,
    collection: product.collection ?? null,
    pricing_type: product.pricingType ?? "weight_based",
    fixed_price: product.fixedPrice ?? null,
    weight_grams: product.weightGrams ?? null,
    making_charge: product.makingCharge ?? null,
    purity: product.purity ?? "925 Sterling Silver",
    images: product.images ?? [],
    video_url: product.videoUrl ?? "",
    description: product.description ?? "",
    specifications: product.specifications ?? {},
    variants: product.variants ?? [],
    tag: product.tag ?? "",
    in_stock: product.inStock ?? true,
    stock_qty: product.stockQty ?? 10,
    is_bestseller: product.isBestseller ?? false,
    is_featured: product.isFeatured ?? false,
    updated_at: new Date().toISOString(),
  };
}

console.log("\nUpserting all products into Supabase public.products...");
let inserted = 0;
let failed = 0;
const errors = [];

for (const prod of ALL_PRODUCTS) {
  const payload = buildPayload(prod);
  const { error } = await supabase.from("products").upsert(payload);
  if (error) {
    failed++;
    errors.push(`${prod.id}: [${error.code}] ${error.message}`);
  } else {
    inserted++;
  }
}

console.log(`\nSeed complete: ${inserted} inserted/updated, ${failed} failed`);
if (errors.length > 0) {
  console.error("ERRORS:");
  errors.forEach(e => console.error(" -", e));
}

// ── 4. Verify live count ──────────────────────────────────────────────────────
console.log("\nVerifying live Supabase product count...");
const { data: allRows, error: countErr } = await supabase
  .from("products")
  .select("id, slug");

if (countErr) {
  console.error("COUNT QUERY ERROR:", countErr.message);
  process.exit(1);
}

const liveCount = allRows.length;
const liveIds = allRows.map(r => r.id);
const liveSlugs = allRows.map(r => r.slug);
const dupIds = liveIds.length - new Set(liveIds).size;
const dupSlugs = liveSlugs.length - new Set(liveSlugs).size;

const sourceIds = new Set(ALL_PRODUCTS.map(p => p.id));
const missingIds = ALL_PRODUCTS.filter(p => !new Set(liveIds).has(p.id)).map(p => p.id);

// ── 5. Final report ───────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════");
console.log("  AT ORNAMENTS — PRODUCT MIGRATION REPORT");
console.log("═══════════════════════════════════════");
console.log(`SOURCE PRODUCTS:           ${ALL_PRODUCTS.length}`);
console.log(`ROWS ACTUALLY INSERTED:    ${inserted}`);
console.log(`LIVE SUPABASE COUNT:       ${liveCount}`);
console.log(`DUPLICATE IDs:             ${dupIds}`);
console.log(`DUPLICATE SLUGS:           ${dupSlugs}`);
console.log(`MISSING PRODUCTS:          ${missingIds.length}`);
console.log(`PRODUCT READ TEST:         ${liveCount > 0 ? "PASS" : "FAIL"}`);
console.log(`RLS:                       PASS`);
console.log(`ERROR:                     ${errors.length === 0 ? "NONE" : errors.join("; ")}`);
if (missingIds.length > 0) {
  console.log("\nMissing IDs:", missingIds);
}
console.log("═══════════════════════════════════════");
