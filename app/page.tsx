"use client";

import React, { useState } from "react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import BestsellerGrid from "@/components/home/BestsellerGrid";
import TrustStrip from "@/components/layout/TrustStrip";
import AboutSection from "@/components/home/AboutSection";
import Footer from "@/components/layout/Footer";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { ALL_PRODUCTS } from "@/lib/products/data";
import { computeProductPrice } from "@/lib/pricing/computePrice";

export default function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("at_cart_items");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const updated = parsed.map((item: any) => {
              const match = ALL_PRODUCTS.find((p) => p.id === item.id);
              const livePrice = match ? computeProductPrice(match) : item.price;
              return { ...item, price: livePrice };
            });
            setCartItems(updated);
            return;
          }
        } catch (e) {}
      }
      setCartItems([]);
    }
  }, []);

  const handleAddToCart = (product: any) => {
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
          price: product.price,
          quantity: 1,
          image: product.image,
          category: product.category,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900 selection:bg-[#1C2B26] selection:text-white">
      {/* 1. Thin Announcement Bar */}
      <MarqueeBar />

      {/* 2. Navbar + Actual Logo (Upper Left) */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={totalCartCount}
      />

      {/* 3. Full-Screen Hero Image + Shop Now Button */}
      <HeroSection />

      {/* 4. OUR CATEGORIES (ANKLETS | CHAIN | BRACELET | RING) */}
      <CategoryGrid />

      {/* 5. BESTSELLERS */}
      <BestsellerGrid onAddToCart={handleAddToCart} />

      {/* 6. TRUST • PURITY • ELEGANCE */}
      <TrustStrip />

      {/* 7. ABOUT */}
      <AboutSection />

      {/* 8. FOOTER */}
      <Footer />

      {/* Slide-in Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </main>
  );
}
