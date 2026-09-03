"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, ArrowRight, Gift, Sparkles } from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category?: string;
  selectedSize?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
}

export const FREE_GIFT_THRESHOLD = 499;

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}: CartDrawerProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remainingForGift = Math.max(0, FREE_GIFT_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_GIFT_THRESHOLD) * 100);
  const isGiftUnlocked = subtotal >= FREE_GIFT_THRESHOLD;

  const handleProceedToCheckout = () => {
    // Save items to localStorage so checkout page can read live items
    if (typeof window !== "undefined") {
      localStorage.setItem("at_cart_items", JSON.stringify(items));
    }
    onClose();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F7F5F0] border-l border-stone-300 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 bg-[#EFEAE1] border-b border-stone-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-900">
              <ShoppingBag className="w-5 h-5 text-[#1C2B26]" />
              <h2 className="font-serif text-lg font-bold tracking-wider uppercase">
                Your Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Gift Progress Bar (Threshold = ₹499) */}
          <div className="bg-[#EFEAE1]/90 px-5 py-3 border-b border-stone-300">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5 text-stone-800">
                <Gift className="w-4 h-4 text-[#C9A45C]" />
                {isGiftUnlocked ? (
                  <span className="text-emerald-800 font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
                    FREE SURPRISE GIFT UNLOCKED!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#1C2B26]">₹{remainingForGift}</strong> more for FREE SURPRISE GIFT
                  </span>
                )}
              </span>
            </div>
            
            <div className="w-full bg-stone-300 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isGiftUnlocked ? "bg-emerald-700" : "bg-[#1C2B26]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 py-12">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] text-stone-400 mb-3" />
                <p className="font-serif text-base font-bold text-stone-800">Your Cart is Empty</p>
                <p className="text-xs text-stone-500 mt-1 mb-6">Discover everyday sterling silver payals, chains & rings.</p>
                <button
                  onClick={onClose}
                  className="bg-[#1C2B26] text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors"
                >
                  Explore Collections
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-[#EFEAE1]/60 p-3 rounded-2xl border border-stone-200 shadow-2xs items-center"
                >
                  {/* Item Image */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-200 flex-shrink-0 border border-stone-300">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm font-bold text-stone-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-1"
                        aria-label="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.selectedSize && (
                      <span className="text-[10px] font-semibold text-stone-500 uppercase">
                        Size: {item.selectedSize}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone-300 rounded-lg bg-white px-2 py-1 gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="text-stone-600 hover:text-black font-bold text-xs px-1"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-stone-900 w-3 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="text-stone-600 hover:text-black font-bold text-xs px-1"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal Price */}
                      <span className="text-sm font-bold text-stone-900">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 bg-[#EFEAE1] border-t border-stone-300 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-600 font-semibold uppercase tracking-wider">
                <span>Shipping</span>
                <span className="text-emerald-800 font-bold">FREE (₹0)</span>
              </div>

              <div className="flex items-center justify-between text-base font-extrabold text-stone-900 border-t border-stone-300 pt-2">
                <span>Cart Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {isGiftUnlocked && (
                <div className="p-2.5 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Gift className="w-4 h-4 text-[#C9A45C] flex-shrink-0" />
                  <span>Free Surprise Gift included with your order!</span>
                </div>
              )}

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
