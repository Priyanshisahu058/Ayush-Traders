import { Product, TODAY_SILVER_RATE_PER_GRAM } from "@/lib/products/data";

let cachedSilverRate: number | null = null;

export function getActiveSilverRate(customRate?: number): number {
  if (customRate && customRate > 0) return customRate;
  if (cachedSilverRate !== null) return cachedSilverRate;

  if (typeof window !== "undefined") {
    const savedRate = localStorage.getItem("at_silver_rate");
    if (savedRate) {
      const parsed = parseFloat(savedRate);
      if (!isNaN(parsed) && parsed > 0) {
        cachedSilverRate = parsed;
        return parsed;
      }
    }
  }

  cachedSilverRate = TODAY_SILVER_RATE_PER_GRAM;
  return TODAY_SILVER_RATE_PER_GRAM;
}

export function updateCachedSilverRate(newRate: number) {
  cachedSilverRate = newRate;
  if (typeof window !== "undefined") {
    localStorage.setItem("at_silver_rate", newRate.toString());
  }
}

const priceCache = new Map<string, number>();

export function computeProductPrice(
  product: Product,
  customSilverRate?: number
): number {
  if (product.pricingType === "fixed") {
    return product.fixedPrice || 0;
  }

  const silverRate = getActiveSilverRate(customSilverRate);
  const cacheKey = `${product.id}_${silverRate}_${product.weightGrams}_${product.makingCharge}`;
  
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!;
  }

  const weight = product.weightGrams || 0;
  const makingCharge = product.makingCharge || 0;
  const calculated = Math.round(weight * silverRate + makingCharge);
  
  priceCache.set(cacheKey, calculated);
  return calculated;
}
