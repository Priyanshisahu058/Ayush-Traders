"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, Check, Sparkles, ArrowRight } from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { ALL_PRODUCTS, Product, getEffectiveProducts } from "@/lib/products/data";
import { fetchProductsFromSupabase } from "@/lib/supabase/products";
import { computeProductPrice } from "@/lib/pricing/computePrice";

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let ids: string[] = [];
      const saved = localStorage.getItem("at_wishlist_ids");
      if (saved) {
        try {
          ids = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }

      // If no saved items, load 3 sample items for demonstration
      if (ids.length === 0) {
        ids = ["at-a201", "at-b401", "at-r301"];
        localStorage.setItem("at_wishlist_ids", JSON.stringify(ids));
      }

      const activeProducts = getEffectiveProducts();
      const filtered = activeProducts.filter((p) => ids.includes(p.id));
      setWishlistProducts(filtered);

      fetchProductsFromSupabase().then((sbProducts) => {
        if (sbProducts && sbProducts.length > 0) {
          setWishlistProducts(sbProducts.filter((p) => ids.includes(p.id)));
        }
      });

      // Pre-select first available variant for items
      const initialVariants: Record<string, string> = {};
      filtered.forEach((p) => {
        if (p.variants && p.variants.length > 0) {
          const firstInStock = p.variants.find((v) => v.inStock);
          if (firstInStock) initialVariants[p.id] = firstInStock.id;
        }
      });
      setSelectedVariants(initialVariants);
      setIsLoaded(true);
    }
  }, []);

  const handleRemoveFromWishlist = (id: string) => {
    const updated = wishlistProducts.filter((p) => p.id !== id);
    setWishlistProducts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("at_wishlist_ids", JSON.stringify(updated.map((p) => p.id)));
    }
  };

  const handleAddToCart = (product: Product) => {
    const selectedVariantId = selectedVariants[product.id];
    const selectedVariantName = product.variants?.find((v) => v.id === selectedVariantId)?.name;
    const price = computeProductPrice(product);

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.selectedSize === selectedVariantName);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === selectedVariantName
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: price,
          quantity: 1,
          image: product.images[0],
          category: product.categoryLabel,
          selectedSize: selectedVariantName,
        },
      ];
    });
    setIsCartOpen(true);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!isLoaded) return null;

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar onOpenCart={() => setIsCartOpen(true)} cartCount={totalCartCount} />

      {/* Header Banner */}
      <section className="bg-[#EFEAE1] py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase">
            YOUR SAVED SELECTIONS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-wider uppercase mt-1">
            My Wishlist ({wishlistProducts.length})
          </h1>
          <p className="font-serif italic text-stone-600 text-sm sm:text-base mt-2">
            Save your favorite 925 sterling silver pieces and move them to cart anytime.
          </p>
        </div>
      </section>

      {/* Wishlist Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {wishlistProducts.length === 0 ? (
          <div className="p-16 text-center bg-[#EFEAE1]/40 rounded-2xl border border-dashed border-stone-300 space-y-4 max-w-lg mx-auto">
            <Heart className="w-12 h-12 text-stone-400 stroke-[1.2] mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-stone-800">Your Wishlist is Empty</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore our handcrafted payals, chains, bracelets, and solitaire rings to save your favorite items.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#1C2B26] text-white text-xs font-bold px-6 py-3.5 rounded-xl hover:bg-stone-800 transition-colors uppercase tracking-widest"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistProducts.map((product) => {
              const isAdded = addedIds[product.id];
              const price = computeProductPrice(product);

              return (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-[#EFEAE1]/80 border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/4] bg-stone-200 overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      loading="lazy"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Trash Remove Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 backdrop-blur-md shadow-sm z-10 transition-colors"
                      aria-label="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4 text-stone-600 hover:text-red-600" />
                    </button>

                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-[#1C2B26] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C9A45C]" />
                        {product.purity}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex flex-col gap-3 flex-1 justify-between bg-[#EFEAE1]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        {product.categoryLabel}
                      </span>
                      <Link href={`/product/${product.slug}`}>
                        <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-1 hover:text-[#1C2B26] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Size Selector (If Variants Exist) */}
                    {product.variants && product.variants.length > 0 && (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                          Select Size:
                        </label>
                        <select
                          value={selectedVariants[product.id] || ""}
                          onChange={(e) =>
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-white border border-stone-300 rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-none focus:border-[#1C2B26]"
                        >
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id} disabled={!v.inStock}>
                              {v.name} {!v.inStock ? "(Out of Stock)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pricing & Move to Cart Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-300/60 mt-1">
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-stone-900">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        {product.pricingType === "weight_based" && (
                          <span className="text-[10px] text-stone-500 font-medium">
                            {product.weightGrams}g Silver
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs tracking-wider uppercase transition-all ${
                          !product.inStock
                            ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                            : isAdded
                            ? "bg-emerald-800 text-white"
                            : "bg-[#1C2B26] text-white hover:bg-stone-800"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>ADDED</span>
                          </>
                        ) : !product.inStock ? (
                          <span>OUT OF STOCK</span>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>MOVE TO CART</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
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
