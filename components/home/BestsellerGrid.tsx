"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Heart, Check, Sparkles, Gem } from "lucide-react";
import { ALL_PRODUCTS, Product, getEffectiveProducts } from "@/lib/products/data";
import { fetchProductsFromSupabase } from "@/lib/supabase/products";
import { computeProductPrice } from "@/lib/pricing/computePrice";

interface BestsellerGridProps {
  onOpenCart?: () => void;
  onAddToCart?: (item: any) => void;
}

export default function BestsellerGrid({ onOpenCart, onAddToCart }: BestsellerGridProps) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [wishlistIds, setWishlistIds] = useState<Record<string, boolean>>({});
  const [productsList, setProductsList] = useState<Product[]>(ALL_PRODUCTS);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setProductsList(getEffectiveProducts());
      fetchProductsFromSupabase().then((sbProducts) => {
        if (sbProducts && sbProducts.length > 0) {
          setProductsList(sbProducts);
        }
      });
    }
  }, []);

  // Exactly 6 curated bestsellers
  const bestsellers = productsList.filter((p) => p.isBestseller).slice(0, 6);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));

    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: computeProductPrice(product),
        quantity: 1,
        image: product.images[0],
        category: product.categoryLabel,
      });
    }

    if (onOpenCart) {
      onOpenCart();
    }

    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setWishlistIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="bestsellers" className="py-20 bg-[#F7F5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-stone-300 pb-6">
          <div>
            <span className="text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase">
              HANDPICKED FAVORITES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-wide uppercase mt-1">
              Curated Bestsellers (6)
            </h2>
          </div>
          <Link
            href="/shop"
            className="mt-4 md:mt-0 text-xs font-bold uppercase tracking-widest text-[#1C2B26] hover:underline flex items-center gap-1"
          >
            <span>VIEW ALL 48 PRODUCTS</span>
            <span>→</span>
          </Link>
        </div>

        {/* Grid of 6 Bestsellers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bestsellers.map((product) => {
            const isAdded = addedIds[product.id];
            const isWishlisted = wishlistIds[product.id];
            const calculatedPrice = computeProductPrice(product);

            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group rounded-2xl bg-[#EFEAE1]/80 border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/4] bg-stone-200 overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 backdrop-blur-md shadow-sm z-10 transition-colors"
                    aria-label="Save to Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isWishlisted ? "text-red-500 fill-red-500" : "hover:text-stone-900"
                      }`}
                    />
                  </button>

                  {/* Material Collection Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {product.collection === "silver" ? (
                      <span className="bg-[#1C2B26] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-[#C9A45C]" />
                        925 Silver
                      </span>
                    ) : (
                      <span className="bg-amber-900/90 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Gem className="w-3 h-3 text-[#C9A45C]" />
                        Artificial
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3 flex-1 justify-between bg-[#EFEAE1]">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">
                      <span>{product.categoryLabel}</span>
                      <span className="text-stone-400 font-semibold">{product.tag}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-[#1C2B26] transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-300/60 mt-1">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-stone-900">
                        ₹{calculatedPrice.toLocaleString("en-IN")}
                      </span>
                      {product.pricingType === "weight_based" ? (
                        <span className="text-[10px] text-stone-500 font-medium">
                          {product.weightGrams}g Silver
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-medium">
                          Fixed Price
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-all ${
                        isAdded
                          ? "bg-emerald-800 text-white"
                          : "bg-[#1C2B26] text-white hover:bg-stone-800"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ADDED</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>ADD TO BAG</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
