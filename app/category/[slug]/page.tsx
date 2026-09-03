"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ShoppingBag, Check, Sparkles, Gem, SlidersHorizontal, ArrowRight, Wand2, ShieldCheck, CheckCircle2 } from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { ALL_PRODUCTS, Product, getEffectiveProducts } from "@/lib/products/data";
import { fetchProductsFromSupabase } from "@/lib/supabase/products";
import { computeProductPrice } from "@/lib/pricing/computePrice";

const CATEGORY_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    categoryKey: "chain" | "anklet" | "ring" | "bracelet";
    bannerImg: string;
    customTitle: string;
    customSubtitle?: string;
    customDesc: string;
    customCta: string;
  }
> = {
  anklet: {
    title: "Silver & Fine Payal Collection",
    subtitle: "Discover handcrafted 925 sterling payals and traditional artificial anklets",
    categoryKey: "anklet",
    bannerImg: "/anklet.category.png",
    customTitle: "✨ CREATE YOUR OWN ANKLET",
    customDesc: "Create an anklet with the style, charms and details you want.",
    customCta: "✨ DESIGN MY ANKLET",
  },
  chain: {
    title: "Chains & Necklaces Collection",
    subtitle: "Pure 925 sterling silver chains and elegant artificial pendant strands",
    categoryKey: "chain",
    bannerImg: "/chain.category.png",
    customTitle: "✨ CREATE YOUR OWN CHAIN",
    customDesc: "Choose your chain style, length, material and details.",
    customCta: "✨ DESIGN MY CHAIN",
  },
  bracelet: {
    title: "Bracelets & Kada Collection",
    subtitle: "Dainty sterling silver charms, heavy kadas, and fashion bangle cuffs",
    categoryKey: "bracelet",
    bannerImg: "/bracelet.category.png",
    customTitle: "✨ CREATE YOUR OWN BRACELET",
    customSubtitle: "Don't find the perfect one? Design your own.",
    customDesc: "Tell us what you want, let AI bring your idea to life, then send the final design to AT Ornaments for a feasibility review.",
    customCta: "✨ DESIGN MY BRACELET",
  },
  ring: {
    title: "Rings & Solitaires Collection",
    subtitle: "925 sterling silver solitaire bands, oxidized rings, and Kundan statement picks",
    categoryKey: "ring",
    bannerImg: "/ring.category.png",
    customTitle: "✨ CREATE YOUR OWN RING",
    customDesc: "Design a ring around your style, stone and preferences.",
    customCta: "✨ DESIGN MY RING",
  },
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [collectionFilter, setCollectionFilter] = useState<"all" | "silver" | "artificial">("all");
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

  const slug = params?.slug?.toLowerCase();
  const categoryMeta = CATEGORY_META[slug];

  if (!categoryMeta) {
    notFound();
  }

  const categoryProducts = productsList.filter(
    (p) => p.category === categoryMeta.categoryKey
  );

  const filteredProducts = categoryProducts.filter((p) => {
    if (collectionFilter === "silver") return p.collection === "silver";
    if (collectionFilter === "artificial") return p.collection === "artificial";
    return true;
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: computeProductPrice(product),
          quantity: 1,
          image: product.images[0],
          category: product.categoryLabel,
        },
      ];
    });
    setIsCartOpen(true);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar onOpenCart={() => setIsCartOpen(true)} cartCount={totalCartCount} />

      {/* Hero Category Banner */}
      <section className="relative bg-[#EFEAE1] border-b border-stone-200 py-16 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <span className="text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase">
              AYUSH TRADERS • {categoryMeta.categoryKey}S
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-wide uppercase">
              {categoryMeta.title}
            </h1>
            <p className="font-serif italic text-stone-600 text-sm sm:text-base">
              {categoryMeta.subtitle}
            </p>
          </div>

          <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-md border border-stone-300">
            <Image
              src={categoryMeta.bannerImg}
              alt={categoryMeta.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* CATEGORY CUSTOM DESIGN HERO SECTION (Part 7) */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-[#1C2B26] text-white p-6 sm:p-10 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <span className="bg-[#C9A45C]/20 border border-[#C9A45C]/40 text-[#C9A45C] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                AI CUSTOM JEWELLERY STUDIO
              </span>

              <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-wide uppercase text-stone-100">
                {categoryMeta.customTitle}
              </h2>

              {categoryMeta.customSubtitle && (
                <p className="font-serif italic text-[#C9A45C] text-sm sm:text-base">
                  "{categoryMeta.customSubtitle}"
                </p>
              )}

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {categoryMeta.customDesc}
              </p>
            </div>

            <Link
              href={`/custom-design/${categoryMeta.categoryKey}`}
              className="bg-[#C9A45C] hover:bg-amber-500 text-stone-950 font-extrabold text-xs tracking-widest uppercase px-6 py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <span>{categoryMeta.customCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 4-Step Explanation Bar */}
          <div className="pt-6 border-t border-stone-700/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-bold text-[#C9A45C]">1.</span>
              <span className="text-stone-300 text-[11px] font-semibold uppercase">AI GENERATED DESIGN</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-bold text-[#C9A45C]">2.</span>
              <span className="text-stone-300 text-[11px] font-semibold uppercase">EDIT & CUSTOMIZE</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-bold text-[#C9A45C]">3.</span>
              <span className="text-stone-300 text-[11px] font-semibold uppercase">MERCHANT REVIEW</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-bold text-[#C9A45C]">4.</span>
              <span className="text-stone-300 text-[11px] font-semibold uppercase">FINAL PRICE & WEIGHT</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Header Controls */}
      <section className="py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#EFEAE1]/70 p-4 rounded-2xl border border-stone-300">
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#1C2B26]" />
            <span className="text-xs font-bold uppercase text-stone-800">
              {categoryMeta.categoryKey} Catalog:
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setCollectionFilter("all")}
              className={`px-4 py-2 rounded-xl transition-all ${
                collectionFilter === "all"
                  ? "bg-[#1C2B26] text-white shadow-sm"
                  : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-300"
              }`}
            >
              All {categoryMeta.categoryKey}s ({categoryProducts.length})
            </button>

            <button
              onClick={() => setCollectionFilter("silver")}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                collectionFilter === "silver"
                  ? "bg-[#1C2B26] text-white shadow-sm"
                  : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
              925 Silver (6)
            </button>

            <button
              onClick={() => setCollectionFilter("artificial")}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                collectionFilter === "artificial"
                  ? "bg-[#1C2B26] text-white shadow-sm"
                  : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-300"
              }`}
            >
              <Gem className="w-3.5 h-3.5 text-[#C9A45C]" />
              Artificial (6)
            </button>
          </div>

        </div>
      </section>

      {/* Category Products Grid */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isAdded = addedIds[product.id];
            const price = computeProductPrice(product);

            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group rounded-2xl bg-[#EFEAE1]/80 border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[4/4] bg-stone-200 overflow-hidden">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    {product.collection === "silver" ? (
                      <span className="bg-[#1C2B26] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C9A45C]" />
                        925 Silver
                      </span>
                    ) : (
                      <span className="bg-amber-900/90 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Gem className="w-3 h-3 text-[#C9A45C]" />
                        Artificial
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1 justify-between bg-[#EFEAE1]">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-0.5">
                      <span>{product.categoryLabel}</span>
                      <span className="text-stone-400 font-semibold">{product.tag}</span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-1 group-hover:text-[#1C2B26] transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-300/60 mt-1">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-stone-900">
                        ₹{price.toLocaleString("en-IN")}
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
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs tracking-wider uppercase transition-all ${
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
                          <span>ADD</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Footer />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(id, delta) =>
          setCartItems((prev) =>
            prev
              .map((item) =>
                item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
              )
              .filter((i) => i.quantity > 0)
          )
        }
        onRemoveItem={(id) => setCartItems((prev) => prev.filter((i) => i.id !== id))}
      />
    </main>
  );
}
