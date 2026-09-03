import { getSupabaseClient } from "./client";
import { Product, ALL_PRODUCTS, setEffectiveProductsCache } from "../products/data";

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from("products").select("*");
    if (error || !data || data.length === 0) {
      return null;
    }

    const mapped: Product[] = data.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      categoryLabel: row.category_label || "Jewellery",
      collection: row.collection,
      pricingType: row.pricing_type || "weight_based",
      fixedPrice: row.fixed_price ? parseFloat(row.fixed_price) : undefined,
      weightGrams: row.weight_grams ? parseFloat(row.weight_grams) : undefined,
      makingCharge: row.making_charge ? parseFloat(row.making_charge) : undefined,
      purity: row.purity || "925 Sterling Silver",
      images: Array.isArray(row.images) ? row.images : JSON.parse(row.images || "[]"),
      videoUrl: row.video_url || "",
      description: row.description || "",
      specifications: typeof row.specifications === "object" ? row.specifications : JSON.parse(row.specifications || "{}"),
      variants: Array.isArray(row.variants) ? row.variants : JSON.parse(row.variants || "[]"),
      tag: row.tag || "",
      inStock: row.in_stock ?? true,
      stockQty: row.stock_qty ?? 10,
      isBestseller: row.is_bestseller ?? false,
      isFeatured: row.is_featured ?? false,
    }));

    setEffectiveProductsCache(mapped);
    return mapped;
  } catch (err) {
    console.warn("Supabase fetchProducts failed, falling back to local dataset:", err);
    return null;
  }
}

export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      category_label: product.categoryLabel,
      collection: product.collection,
      pricing_type: product.pricingType,
      fixed_price: product.fixedPrice ?? null,
      weight_grams: product.weightGrams ?? null,
      making_charge: product.makingCharge ?? null,
      purity: product.purity || "925 Sterling Silver",
      images: product.images,
      video_url: product.videoUrl || "",
      description: product.description || "",
      specifications: product.specifications || {},
      variants: product.variants || [],
      tag: product.tag || "",
      in_stock: product.inStock,
      stock_qty: product.stockQty ?? 10,
      is_bestseller: product.isBestseller ?? false,
      is_featured: product.isFeatured ?? false,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("products").upsert(payload);
    if (error) {
      console.error("Supabase upsertProduct error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase upsertProduct failed:", err);
    return false;
  }
}

export async function seedAll48ProductsToSupabase(): Promise<{ success: boolean; seededCount: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, seededCount: 0 };

  try {
    let seeded = 0;
    for (const prod of ALL_PRODUCTS) {
      const ok = await upsertProductToSupabase(prod);
      if (ok) seeded++;
    }
    return { success: true, seededCount: seeded };
  } catch (err) {
    console.error("Seed 48 products failed:", err);
    return { success: false, seededCount: 0 };
  }
}
