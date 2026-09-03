"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Camera,
  MessageSquare,
  Upload,
  X,
  Send,
  ShoppingBag,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Info,
  Gem,
  AlertCircle,
} from "lucide-react";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { UserPreferences, StylistResponse } from "@/lib/ai/stylist/types";
import { runAiStylistRecommendation } from "@/lib/ai/stylist/engine";
import { Product } from "@/lib/products/data";

const QUICK_PROMPTS = [
  "Which bracelet would suit my hand?",
  "Find me an anklet under ₹2,000",
  "I need a birthday gift under ₹3,000",
  "Show me minimal silver jewellery",
  "Help me choose a bracelet",
];

export default function AiStylistInterface() {
  const [textQuery, setTextQuery] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stylistResult, setStylistResult] = useState<StylistResponse | null>(null);
  const [activePreferences, setActivePreferences] = useState<UserPreferences>({});
  const [addedProductIds, setAddedProductIds] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setUploadedImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setUploadedImage(null);
  };

  const handleRunRecommendation = (promptOverride?: string) => {
    const queryToUse = promptOverride || textQuery || "Show me recommended jewellery pieces";
    setIsAnalyzing(true);

    setTimeout(() => {
      const response = runAiStylistRecommendation(queryToUse, uploadedImage || undefined, activePreferences);
      setStylistResult(response);
      setActivePreferences(response.preferences);
      setIsAnalyzing(false);
    }, 900);
  };

  const handleAddToCart = (product: Product, calculatedPrice: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAddedProductIds((prev) => ({ ...prev, [product.id]: true }));

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
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
        },
      ];
    });

    setIsCartOpen(true);
    setTimeout(() => {
      setAddedProductIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleStartOver = () => {
    setTextQuery("");
    setUploadedImage(null);
    setStylistResult(null);
    setActivePreferences({});
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* HEADER BANNER */}
      <div className="text-center space-y-3 bg-[#EFEAE1]/70 p-8 rounded-3xl border border-stone-300 shadow-sm">
        <div className="inline-flex items-center gap-2 bg-[#1C2B26] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xs">
          <Sparkles className="w-4 h-4 text-[#C9A45C]" />
          <span>AT ORNAMENTS AI CONSULTANT</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-wide uppercase">
          ✨ AI Personal Jewellery Stylist
        </h1>

        <p className="font-serif italic text-stone-600 text-sm sm:text-base max-w-2xl mx-auto">
          "Tell us what you're looking for, or upload a photo of your hand/wrist and let us help you discover styles that may complement you."
        </p>
      </div>

      {/* QUICK PROMPT PILLS */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500 block text-center">
          Popular Styling Questions
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTextQuery(prompt);
                handleRunRecommendation(prompt);
              }}
              className="bg-white hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-xs active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT FORM: TEXT + PHOTO UPLOAD */}
      <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-3xl border border-stone-300 space-y-6 shadow-sm">
        
        {/* Photo Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#1C2B26]" />
              <span>1. Upload Hand/Wrist Photo (Optional)</span>
            </label>
            {uploadedImage && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red-700 font-bold hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="p-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-[11px] text-amber-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Notice:</strong> Your photo is used only to provide jewellery style recommendations. Avoid uploading photos containing unnecessary personal information.
            </span>
          </div>

          {!uploadedImage ? (
            <label className="border-2 border-dashed border-stone-300 hover:border-[#1C2B26] bg-white p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
              <Upload className="w-8 h-8 text-stone-400" />
              <span className="font-bold text-stone-800 text-xs uppercase tracking-wider">
                Click to Upload Hand or Wrist Photo
              </span>
              <span className="text-[10px] text-stone-500 font-mono">Supports JPG, JPEG, PNG, WebP</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-stone-300">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 flex-shrink-0">
                <img src={uploadedImage} alt="Hand/wrist preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-xs text-stone-700 space-y-1">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  ✓ Photo Attached for Style Guidance
                </span>
                <p className="text-[11px] text-stone-500">
                  Our AI will use this image to suggest complementary bracelet, anklet, or ring proportions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Text Preference Input */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1C2B26]" />
            <span>2. Describe Your Jewellery Preference</span>
          </label>

          <div className="relative">
            <textarea
              rows={3}
              placeholder="e.g. 'I want a silver bracelet for daily office wear under ₹2,500' or 'Looking for a festive anklet gift'"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-[#1C2B26] shadow-xs"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {stylistResult && (
            <button
              type="button"
              onClick={handleStartOver}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start Over</span>
            </button>
          )}

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => handleRunRecommendation()}
            className="ml-auto bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 text-[#C9A45C] animate-spin" />
                <span>CONSULTING AI CATALOG...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C9A45C]" />
                <span>GENERATE PERSONAL RECOMMENDATIONS</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* AI STYLIST RECOMMENDATIONS OUTPUT */}
      {stylistResult && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* AI Guidance Callout */}
          <div className="bg-[#1C2B26] text-white p-6 sm:p-8 rounded-3xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <span className="text-xs tracking-[0.25em] font-semibold text-[#C9A45C] uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI CONSULTANT ANALYSIS
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Verified AT Ornaments Catalog</span>
            </div>

            <p className="font-serif text-lg sm:text-xl font-bold text-stone-100">
              "{stylistResult.summaryMessage}"
            </p>

            {stylistResult.visualContext?.styleGuidance && (
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-xs text-stone-200 space-y-1">
                <span className="font-bold text-[#C9A45C] uppercase text-[10px] tracking-wider block">
                  Photo Proportions Guidance:
                </span>
                <p className="italic">{stylistResult.visualContext.styleGuidance}</p>
              </div>
            )}
          </div>

          {/* Recommended Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {stylistResult.recommendations.map(({ product, calculatedPrice, reason, exceedsBudget }, idx) => {
              const isAdded = addedProductIds[product.id];
              return (
                <div
                  key={product.id}
                  className={`group rounded-3xl bg-[#EFEAE1] border overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 ${
                    exceedsBudget ? "border-amber-400 bg-amber-50/40" : "border-stone-300"
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/4] bg-stone-200 overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Collection Badge */}
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

                    {exceedsBudget && (
                      <span className="absolute top-3 right-3 bg-amber-900 text-white text-[9px] font-bold uppercase px-2.5 py-1 rounded-full z-10">
                        Exceeds Budget
                      </span>
                    )}
                  </div>

                  {/* Product Details & AI Reason */}
                  <div className="p-5 flex flex-col gap-3 flex-1 justify-between bg-[#EFEAE1]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        <span>{product.categoryLabel}</span>
                        <span className="text-stone-400">{product.tag}</span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1">
                        {product.name}
                      </h3>

                      {/* AI Reasoning Callout */}
                      <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 space-y-1">
                        <span className="font-bold text-[#1C2B26] text-[10px] uppercase tracking-wider block">
                          ✨ Why AI Recommended This:
                        </span>
                        <p className="leading-relaxed text-[11px]">{reason}</p>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="pt-3 border-t border-stone-300/80 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-stone-900">
                          ₹{calculatedPrice.toLocaleString("en-IN")}
                        </span>
                        {product.pricingType === "weight_based" && (
                          <span className="text-[10px] text-stone-500 font-medium">
                            {product.weightGrams}g Silver
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <Link
                          href={`/product/${product.slug}`}
                          className="bg-white border border-stone-300 hover:bg-stone-200 text-stone-800 text-center py-2.5 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                        >
                          <span>View Item</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={(e) => handleAddToCart(product, calculatedPrice, e)}
                          disabled={!product.inStock}
                          className={`py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                            !product.inStock
                              ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                              : isAdded
                              ? "bg-emerald-800 text-white"
                              : "bg-[#1C2B26] hover:bg-stone-800 text-white shadow-xs"
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

                  </div>
                </div>
              );
            })}
          </div>

          {/* Follow-up Refinement Suggestions */}
          <div className="bg-[#EFEAE1]/80 p-6 rounded-3xl border border-stone-300 space-y-3 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
              Refine Recommendation Options:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {stylistResult.followUpSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTextQuery(suggestion);
                    handleRunRecommendation(suggestion);
                  }}
                  className="bg-white hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CONNECT TO EXISTING CART DRAWER */}
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

    </div>
  );
}
