"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, ShoppingBag, Check, SlidersHorizontal, ArrowUpDown, Sparkles, Gem } from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { ALL_PRODUCTS, Product, getEffectiveProducts } from "@/lib/products/data";
import { fetchProductsFromSupabase } from "@/lib/supabase/products";
import { computeProductPrice } from "@/lib/pricing/computePrice";

export default function ShopPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<"all" | "silver" | "artificial">("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState<number>(4500);
  const [sortBy, setSortBy] = useState<"featured" | "low-high" | "high-low">("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [wishlistIds, setWishlistIds] = useState<Record<string, boolean>>({});
  const [productsList, setProductsList] = useState<Product[]>(ALL_PRODUCTS);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProductsList(getEffectiveProducts());
      fetchProductsFromSupabase().then((sbProducts) => {
        if (sbProducts && sbProducts.length > 0) {
          setProductsList(sbProducts);
        }
      });
    }
  }, []);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // Collection filter (silver vs artificial vs all)
      if (selectedCollection !== "all" && product.collection !== selectedCollection) {
        return false;
      }
      // Category filter (AND logic)
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
        return false;
      }
      // Price filter
      const price = computeProductPrice(product);
      if (price > priceMax) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.categoryLabel.toLowerCase().includes(query) ||
          product.tag.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => {
      const priceA = computeProductPrice(a);
      const priceB = computeProductPrice(b);
      if (sortBy === "low-high") return priceA - priceB;
      if (sortBy === "high-low") return priceB - priceA;
      if (sortBy === "featured") return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
      return 0;
    });
  }, [productsList, selectedCollection, selectedCategories, priceMax, sortBy, searchQuery]);

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

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setWishlistIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar onOpenCart={() => setIsCartOpen(true)} cartCount={totalCartCount} />

      {/* Header Banner */}
      <section className="bg-[#EFEAE1] py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase">
            AYUSH TRADERS COMPLETE CATALOG
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-wider uppercase mt-1">
            Shop All Jewellery ({productsList.length})
          </h1>
          <p className="font-serif italic text-stone-600 text-sm sm:text-base mt-2">
            Explore 925 Sterling Silver Ornaments & Fine Artificial Jewellery
          </p>
        </div>
      </section>

      {/* Main Shop Content Area */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Filter Sidebar */}
          <aside className="lg:col-span-3 bg-[#EFEAE1]/70 p-6 rounded-2xl border border-stone-300 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-300 pb-3">
              <span className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#1C2B26]" />
                Filter Catalog
              </span>
              {(selectedCollection !== "all" || selectedCategories.length > 0 || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCollection("all");
                    setSelectedCategories([]);
                    setSearchQuery("");
                    setPriceMax(4500);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-900 underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Collection Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block mb-2">
                Collection Material
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCollection("all")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    selectedCollection === "all"
                      ? "bg-[#1C2B26] text-white"
                      : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-300"
                  }`}
                >
                  <span>All Collections</span>
                  <span className="text-[10px] opacity-80">({productsList.length})</span>
                </button>

                <button
                  onClick={() => setSelectedCollection("silver")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    selectedCollection === "silver"
                      ? "bg-[#1C2B26] text-white"
                      : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-300"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
                    925 Sterling Silver
                  </span>
                  <span className="text-[10px] opacity-80">
                    ({productsList.filter((p) => p.collection === "silver").length})
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCollection("artificial")}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    selectedCollection === "artificial"
                      ? "bg-[#1C2B26] text-white"
                      : "bg-white text-stone-700 hover:bg-stone-200 border border-stone-300"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-[#C9A45C]" />
                    Artificial Jewellery
                  </span>
                  <span className="text-[10px] opacity-80">
                    ({productsList.filter((p) => p.collection === "artificial").length})
                  </span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
                Search Products
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search anklet, ring, chain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-[#1C2B26]"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
                Jewellery Category
              </label>
              <div className="space-y-2">
                {[
                  { id: "anklet", name: "Anklets (Payal)" },
                  { id: "chain", name: "Chains" },
                  { id: "bracelet", name: "Bracelets & Kada" },
                  { id: "ring", name: "Rings" },
                ].map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="accent-[#1C2B26] w-4 h-4 rounded"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Max Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                <span>Max Price</span>
                <span className="text-[#1C2B26]">₹{priceMax}</span>
              </div>
              <input
                type="range"
                min="300"
                max="4500"
                step="100"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-[#1C2B26]"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                <span>₹300</span>
                <span>₹4,500</span>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Top Bar Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#EFEAE1]/70 p-4 rounded-2xl border border-stone-300">
              <span className="text-xs font-bold tracking-wider text-stone-700 uppercase">
                Showing {filteredProducts.length} of {productsList.length} Products
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-stone-500" />
                <span className="text-xs text-stone-600 font-medium">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-stone-300 rounded-xl text-xs font-semibold px-3 py-1.5 focus:outline-none focus:border-[#1C2B26]"
                >
                  <option value="featured">Featured Bestsellers</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-[#EFEAE1]/40 rounded-2xl border border-dashed border-stone-300">
                <h3 className="font-serif text-xl font-bold text-stone-800 mb-2">No Products Match Your Filters</h3>
                <p className="text-xs text-stone-500 mb-4">Try adjusting your collection or category filters.</p>
                <button
                  onClick={() => {
                    setSelectedCollection("all");
                    setSelectedCategories([]);
                    setPriceMax(4500);
                    setSearchQuery("");
                  }}
                  className="bg-[#1C2B26] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const isAdded = addedIds[product.id];
                  const isWishlisted = wishlistIds[product.id];
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
                        <button
                          onClick={(e) => toggleWishlist(product.id, e)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 backdrop-blur-md shadow-sm z-10"
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? "text-red-500 fill-red-500" : ""}`} />
                        </button>
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
            )}
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
