"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShoppingBag,
  Check,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { CustomDesignRequest, getCustomDesignRequests, saveCustomDesignRequest } from "@/lib/custom-design/data";

export default function CustomRequestStatusPage({ params }: { params: { requestId: string } }) {
  const [request, setRequest] = useState<CustomDesignRequest | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [added, setAdded] = useState(false);

  const reqId = params?.requestId;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const all = getCustomDesignRequests();
      const found = all.find((r) => r.id.toLowerCase() === reqId.toLowerCase());
      if (found) {
        setRequest(found);
      }
      setIsLoaded(true);
    }
  }, [reqId]);

  if (!isLoaded) return null;
  if (!request) return notFound();

  const handleApproveQuote = () => {
    if (!request.finalPrice) return;

    const updated: CustomDesignRequest = {
      ...request,
      status: "CUSTOMER_APPROVED",
      updatedAt: new Date().toLocaleString("en-IN"),
    };

    saveCustomDesignRequest(updated);
    setRequest(updated);

    // Add to Cart
    setAdded(true);
    setCartItems((prev) => [
      ...prev,
      {
        id: `custom-${request.id}`,
        name: `Custom ${request.category.toUpperCase()} (${request.id})`,
        price: request.finalPrice || 3500,
        quantity: 1,
        image: request.designImage,
        category: request.category.toUpperCase() as any,
      },
    ]);
    setIsCartOpen(true);
  };

  const handleDeclineQuote = () => {
    const updated: CustomDesignRequest = {
      ...request,
      status: "DECLINED",
      updatedAt: new Date().toLocaleString("en-IN"),
    };
    saveCustomDesignRequest(updated);
    setRequest(updated);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar onOpenCart={() => setIsCartOpen(true)} cartCount={totalCartCount} />

      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Status Header */}
        <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-3xl border border-stone-300 shadow-sm text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
            AT ORNAMENTS CUSTOM DESIGN REQUEST
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 uppercase">
            Request Status: {request.id}
          </h1>
          <p className="text-xs text-stone-600">
            Submitted on {request.createdAt} for {request.customerName}
          </p>
        </div>

        {/* Main Status Display */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-300 space-y-6 shadow-md">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block">
                Current Merchant Review Status
              </span>
              <span className="font-bold text-lg text-[#1C2B26] block">
                {request.status.replace(/_/g, " ")}
              </span>
            </div>

            {request.status === "QUOTE_SENT" && (
              <span className="bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                ✓ MERCHANT QUOTE READY
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Design Image Preview */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                AI Design Concept
              </span>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-stone-300">
                <img src={request.designImage} alt="Design concept" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Specifications & Merchant Quote Box */}
            <div className="space-y-5 text-xs text-stone-800">
              <div className="bg-[#EFEAE1] p-4 rounded-2xl border border-stone-300 space-y-2">
                <h4 className="font-serif font-bold uppercase text-[#1C2B26] text-xs">
                  Request Specifications
                </h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Category</span>
                    <span className="font-bold uppercase">{request.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Material</span>
                    <span className="font-bold">{request.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Style</span>
                    <span className="font-bold">{request.style}</span>
                  </div>
                  {request.stones && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Stones</span>
                      <span className="font-bold">{request.stones}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MERCHANT APPROVED QUOTE BOX (Part 27) */}
              {(request.status === "QUOTE_SENT" || request.status === "CUSTOMER_APPROVED") && (
                <div className="p-5 rounded-2xl bg-[#1C2B26] text-white space-y-4 shadow-lg">
                  <div className="flex items-center gap-2 border-b border-stone-700 pb-2">
                    <Sparkles className="w-4 h-4 text-[#C9A45C]" />
                    <span className="font-bold uppercase text-xs tracking-wider text-[#C9A45C]">
                      OFFICIAL AT ORNAMENTS MERCHANT QUOTE
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-stone-300">Final Price:</span>
                      <span className="text-3xl font-extrabold text-white">
                        ₹{request.finalPrice?.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between text-stone-300 pt-1 border-t border-stone-700">
                      <span>Final Net Weight:</span>
                      <span className="font-bold text-white">{request.finalWeightGrams}g</span>
                    </div>

                    <div className="flex justify-between text-stone-300">
                      <span>Estimated Completion:</span>
                      <span className="font-bold text-white">{request.estimatedCompletionDays} Days</span>
                    </div>

                    {request.merchantNotes && (
                      <div className="p-3 rounded-xl bg-white/10 text-stone-200 italic text-[11px]">
                        "{request.merchantNotes}"
                      </div>
                    )}
                  </div>

                  {request.status === "QUOTE_SENT" && (
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-bold">
                      <button
                        onClick={handleApproveQuote}
                        className="bg-[#C9A45C] hover:bg-amber-500 text-stone-950 py-3 rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>APPROVE & PROCEED</span>
                      </button>

                      <button
                        onClick={handleDeclineQuote}
                        className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl uppercase tracking-wider"
                      >
                        DECLINE
                      </button>
                    </div>
                  )}

                  {request.status === "CUSTOMER_APPROVED" && (
                    <div className="p-3 rounded-xl bg-emerald-800 text-white font-bold text-center text-xs uppercase tracking-widest">
                      ✓ QUOTE APPROVED — ADDED TO SHOPPING BAG!
                    </div>
                  )}
                </div>
              )}

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
