"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ChevronRight,
  Check,
  Scale,
  Sparkles,
  ShieldCheck,
  Gem,
  AlertTriangle,
  Video,
  Wand2,
  ArrowRight,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { ALL_PRODUCTS, Product, getEffectiveProducts } from "@/lib/products/data";
import { fetchProductsFromSupabase } from "@/lib/supabase/products";
import { computeProductPrice } from "@/lib/pricing/computePrice";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [added, setAdded] = useState(false);
  const [effectiveProducts, setEffectiveProducts] = useState<Product[]>([]);

  React.useEffect(() => {
    setEffectiveProducts(getEffectiveProducts());
    fetchProductsFromSupabase().then((sbProducts) => {
      if (sbProducts && sbProducts.length > 0) {
        setEffectiveProducts(sbProducts);
      }
    });
  }, []);

  const slug = params?.slug?.toLowerCase();
  const productList = effectiveProducts.length > 0 ? effectiveProducts : ALL_PRODUCTS;
  const product = productList.find((p) => p.slug.toLowerCase() === slug) || ALL_PRODUCTS.find((p) => p.slug.toLowerCase() === slug);

  if (!product) {
    notFound();
  }

  // Combine images + optional attached video
  const galleryImages = product.images || [];
  const hasVideo = !!product.videoUrl;
  const isVideoSelected = hasVideo && selectedMediaIndex === galleryImages.length;

  // Pre-select variant
  const activeVariant =
    product.variants?.find((v) => v.id === selectedVariantId) ||
    product.variants?.find((v) => v.inStock) ||
    product.variants?.[0];

  const calculatedPrice = computeProductPrice(product);

  const handleAddToCart = () => {
    setAdded(true);
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.selectedSize === activeVariant?.name
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === activeVariant?.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: calculatedPrice,
          quantity: 1,
          image: product.images[0],
          category: product.categoryLabel,
          selectedSize: activeVariant?.name,
        },
      ];
    });
    setIsCartOpen(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar onOpenCart={() => setIsCartOpen(true)} cartCount={totalCartCount} />

      {/* Breadcrumb Trail */}
      <div className="bg-[#EFEAE1]/60 py-3 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-stone-600">
          <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link href="/shop" className="hover:text-stone-900 transition-colors">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <Link href={`/category/${product.category}`} className="hover:text-stone-900 transition-colors capitalize">
            {product.categoryLabel}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Product Detail Main Section */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Media Showcase Column (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-[4/4] rounded-2xl overflow-hidden bg-stone-900 border border-stone-300 shadow-sm">
              
              {isVideoSelected ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video
                    src={product.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <Image
                  src={galleryImages[selectedMediaIndex] || galleryImages[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center transition-all duration-300"
                />
              )}

              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {product.collection === "silver" ? (
                  <span className="bg-[#1C2B26] text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                    <Sparkles className="w-4 h-4 text-[#C9A45C]" />
                    Purity: 925 Sterling Silver
                  </span>
                ) : (
                  <span className="bg-amber-900/90 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                    <Gem className="w-4 h-4 text-[#C9A45C]" />
                    Artificial / Fashion Jewellery
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 backdrop-blur-md shadow-md transition-transform active:scale-90 z-10"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "text-red-600 fill-red-600" : ""}`} />
              </button>
            </div>

            {/* Thumbnail Strip (Photos + Video Badge) */}
            {(galleryImages.length > 1 || hasVideo) && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMediaIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedMediaIndex === idx && !isVideoSelected
                        ? "border-[#1C2B26] ring-2 ring-[#1C2B26]/20"
                        : "border-stone-300 hover:border-stone-400"
                    }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" loading="lazy" className="object-cover" />
                  </button>
                ))}

                {hasVideo && (
                  <button
                    onClick={() => setSelectedMediaIndex(galleryImages.length)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-[#1C2B26] flex flex-col items-center justify-center text-white ${
                      isVideoSelected
                        ? "border-[#C9A45C] ring-2 ring-[#C9A45C]/40"
                        : "border-stone-700 hover:border-stone-500"
                    }`}
                  >
                    <Video className="w-6 h-6 text-[#C9A45C] mb-1" />
                    <span className="text-[9px] font-bold tracking-widest uppercase">360° VIDEO</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Product Purchasing Info Column (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-[#EFEAE1]/60 p-6 sm:p-8 rounded-2xl border border-stone-300">
            
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                <span>{product.categoryLabel}</span>
                <span className="text-[#1C2B26] font-semibold">{product.tag}</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price & Weight Calculation */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-stone-900">
                  ₹{calculatedPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-stone-500 font-medium">Inclusive of all taxes</span>
              </div>

              {product.pricingType === "weight_based" && (
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-700">
                  <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                    <Scale className="w-4 h-4 text-[#1C2B26]" />
                    Weight: {product.weightGrams}g Silver
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Making Charge: ₹{product.makingCharge}
                  </span>
                </div>
              )}
            </div>

            {/* Size Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
                  <span>Select Size:</span>
                  {activeVariant && <span className="text-[#1C2B26]">{activeVariant.name}</span>}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = (activeVariant?.id || product.variants![0].id) === variant.id;
                    return (
                      <button
                        key={variant.id}
                        disabled={!variant.inStock}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`py-2.5 px-3 rounded-xl font-semibold text-xs border text-center transition-all ${
                          !variant.inStock
                            ? "bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-[#1C2B26] text-white border-[#1C2B26] shadow-xs"
                            : "bg-white text-stone-800 border-stone-300 hover:border-stone-400"
                        }`}
                      >
                        {variant.name} {!variant.inStock ? "(Out of Stock)" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-4 px-6 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                !product.inStock
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : added
                  ? "bg-emerald-800 text-white"
                  : "bg-[#1C2B26] text-white hover:bg-stone-800"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ADDED TO BAG</span>
                </>
              ) : !product.inStock ? (
                <span>CURRENTLY OUT OF STOCK</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO SHOPPING BAG</span>
                </>
              )}
            </button>

            {/* CUSTOMIZATION CTA (Part 36) */}
            <div className="p-5 rounded-2xl bg-[#1C2B26] text-white space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#C9A45C]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A45C]">
                  WANT TO MAKE IT YOURS?
                </span>
              </div>

              <p className="text-xs text-stone-200 leading-relaxed font-serif italic">
                "Customize this jewellery design and request a personalized merchant quote from AT Ornaments."
              </p>

              <Link
                href={`/customize/${product.id}`}
                className="w-full bg-[#C9A45C] hover:bg-amber-500 text-stone-950 font-extrabold text-xs tracking-widest uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>✨ CUSTOMIZE & GET ESTIMATE</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Return Policy Highlight Callout */}
            {product.collection === "silver" ? (
              <div className="p-4 rounded-xl bg-amber-900/10 border border-amber-800/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-800 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <span className="font-bold block uppercase text-[10px] tracking-wider text-amber-900">
                    Silver Policy Notice
                  </span>
                  925 Sterling Silver Jewellery is <strong>Final Sale: No Return / No Exchange</strong> due to daily silver valuation and purity rules.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-emerald-800 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block uppercase text-[10px] tracking-wider text-emerald-900">
                    Artificial Policy Notice
                  </span>
                  Artificial & Fashion Jewellery is eligible for <strong>7-Day Return / Exchange</strong> in original condition with tags intact.
                </div>
              </div>
            )}

            {/* Shipping & Trust Badges */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-stone-700 pt-2 border-t border-stone-300">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-stone-200">
                <Truck className="w-4 h-4 text-[#1C2B26]" />
                <span>Free Express Shipping</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-stone-200">
                <ShieldCheck className="w-4 h-4 text-[#1C2B26]" />
                <span>GST Tax Invoice Included</span>
              </div>
            </div>

            {/* Description & Specifications */}
            <div className="space-y-3 pt-2 text-xs text-stone-700">
              <h3 className="font-serif font-bold text-stone-900 text-sm uppercase">Product Description</h3>
              <p className="leading-relaxed">{product.description}</p>

              <div className="pt-2">
                <h4 className="font-bold text-stone-900 uppercase text-[10px] tracking-wider mb-2">Specifications</h4>
                <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Material</span>
                    <span className="font-bold text-stone-800">{product.specifications.material}</span>
                  </div>
                  {product.purity && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Purity</span>
                      <span className="font-bold text-stone-800">{product.purity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">Finish</span>
                    <span className="font-bold text-stone-800">{product.specifications.finish}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

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
