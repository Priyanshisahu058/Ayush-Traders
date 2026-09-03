"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Camera,
  Gift,
  ShoppingBag,
  Check,
  RotateCcw,
  Gem,
  Plus,
  Info,
  ThumbsDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import CartDrawer, { CartItem } from "@/components/home/CartDrawer";
import { Product } from "@/lib/products/data";
import { runAiStylistWithServerApi } from "@/lib/ai/stylist/engine";
import { ChatMessage, UserPreferences, StylistRecommendation } from "@/lib/ai/stylist/types";

// Helper function to track AI Stylist usage analytics in localStorage
export function trackStylistMetric(key: "sessions" | "recommendations" | "clarifications" | "refinements" | "clicks") {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("at_stylist_analytics");
    const stats = raw
      ? JSON.parse(raw)
      : {
          totalSessions: 1,
          recommendationsGenerated: 0,
          clarificationsAsked: 0,
          refinementRequests: 0,
          clickedProductsCount: 0,
        };

    if (key === "sessions") stats.totalSessions = (stats.totalSessions || 0) + 1;
    if (key === "recommendations") stats.recommendationsGenerated = (stats.recommendationsGenerated || 0) + 1;
    if (key === "clarifications") stats.clarificationsAsked = (stats.clarificationsAsked || 0) + 1;
    if (key === "refinements") stats.refinementRequests = (stats.refinementRequests || 0) + 1;
    if (key === "clicks") stats.clickedProductsCount = (stats.clickedProductsCount || 0) + 1;

    localStorage.setItem("at_stylist_analytics", JSON.stringify(stats));
  } catch (e) {}
}

export default function FloatingAiStylist() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"menu" | "chat">("menu");
  const [textQuery, setTextQuery] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Multi-Turn Conversation Memory State
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Cart Integration State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initial welcome message
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: "welcome_1",
          sender: "stylist",
          text: "Welcome to AT Ornaments! I'm your AI Personal Jewellery Stylist. Tell me what you're shopping for today, or select an option below:",
          clarificationPills: [
            "Everyday silver jewellery",
            "Wedding & Festive gifts",
            "Rings under ₹2,000",
            "Chains & Payals",
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, []);

  // DO NOT render Floating AI Stylist on /admin routes!
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const resetStylingSession = () => {
    setUserPrefs({});
    setChatMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: "stylist",
        text: "Started a fresh styling session! What kind of jewellery can I help you find?",
        clarificationPills: [
          "Everyday silver jewellery",
          "Wedding & Festive gifts",
          "Rings under ₹2,000",
          "Chains & Payals",
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setActiveMode("chat");
    trackStylistMetric("sessions");
  };

  const handleSendChat = async (promptOverride?: string, forcedRejectionId?: string) => {
    const q = promptOverride || textQuery || "Show me recommended jewellery";
    if (!q.trim() || isAnalyzing) return;

    const userMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: userMsgTime,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!promptOverride) setTextQuery("");
    setIsAnalyzing(true);
    setActiveMode("chat");

    try {
      const response = await runAiStylistWithServerApi(
        q,
        uploadedImage || undefined,
        userPrefs,
        forcedRejectionId
      );

      setUserPrefs(response.preferences);

      const aiMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "stylist",
        text: response.summaryMessage,
        recommendations: response.recommendations,
        clarificationPills: response.needsClarification ? response.clarificationPills : response.followUpSuggestions,
        timestamp: aiMsgTime,
      };

      setChatMessages((prev) => [...prev, aiMsg]);

      // Metrics tracking
      if (response.needsClarification) {
        trackStylistMetric("clarifications");
      } else if (response.recommendations.length > 0) {
        trackStylistMetric("recommendations");
      }
      if (forcedRejectionId) {
        trackStylistMetric("refinements");
      }
    } catch (e) {
      console.error("AI Stylist Error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRejectProduct = (productId: string, productName: string) => {
    handleSendChat(`I don't like the ${productName}. Show me alternatives.`, productId);
  };

  const handleAddToCart = (product: Product, price: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    trackStylistMetric("clicks");

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
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
          price,
          quantity: 1,
          image: product.images[0],
        },
      ];
    });
    setIsCartOpen(true);
  };

  return (
    <>
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

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            trackStylistMetric("sessions");
          }}
          className="fixed bottom-6 right-6 z-40 bg-[#1C2B26] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 border border-[#C9A45C]/50 group"
          aria-label="Open AI Personal Stylist"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6 text-[#C9A45C] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="font-serif text-xs font-bold uppercase tracking-wider hidden sm:inline text-amber-100 pr-1">
            AI Personal Stylist
          </span>
        </button>
      )}

      {/* Main Stylist Modal Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[85vh] h-[640px] bg-[#F7F5F0] rounded-3xl shadow-2xl border border-stone-300 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-[#1C2B26] text-white p-4 flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-[#C9A45C]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-200">AT AI Personal Stylist</h3>
                <span className="text-[10px] text-stone-400 font-mono block">Conversational Recommendation Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetStylingSession}
                title="New Styling Session"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline font-bold">Reset</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F7F5F0]">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#1C2B26] text-white rounded-br-none"
                      : "bg-[#EFEAE1] text-stone-800 border border-stone-300 rounded-bl-none shadow-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Option Pills for Clarification or Refinement */}
                {msg.clarificationPills && msg.clarificationPills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                    {msg.clarificationPills.map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(pill)}
                        className="bg-white hover:bg-[#1C2B26] text-stone-700 hover:text-white border border-stone-300 hover:border-[#1C2B26] text-[10px] font-bold px-2.5 py-1 rounded-full transition-all shadow-2xs"
                      >
                        ✨ {pill}
                      </button>
                    ))}
                  </div>
                )}

                {/* Product Recommendation Cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="w-full space-y-3 mt-3">
                    {msg.recommendations.map((rec) => (
                      <div
                        key={rec.product.id}
                        className="bg-white p-3 rounded-2xl border border-stone-300 flex flex-col gap-2.5 shadow-sm hover:border-[#1C2B26] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                            <img src={rec.product.images[0]} alt={rec.product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-bold text-xs text-stone-900 line-clamp-1">{rec.product.name}</h4>
                            <span className="text-[10px] text-stone-500 uppercase font-bold block">{rec.product.categoryLabel}</span>
                            <span className="text-xs font-extrabold text-[#1C2B26]">₹{rec.calculatedPrice.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Visible Grounded Explanation */}
                        <div className="bg-[#EFEAE1]/70 p-2.5 rounded-xl border border-stone-200 text-[10px] text-stone-700 leading-snug flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-[#C9A45C] flex-shrink-0 mt-0.5" />
                          <span>{rec.reason}</span>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={(e) => handleAddToCart(rec.product, rec.calculatedPrice, e)}
                            className="flex-1 bg-[#1C2B26] hover:bg-stone-800 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <ShoppingBag className="w-3 h-3 text-[#C9A45C]" />
                            <span>{addedIds[rec.product.id] ? "Added ✓" : "Add to Cart"}</span>
                          </button>

                          <Link
                            href={`/product/${rec.product.slug}`}
                            onClick={() => trackStylistMetric("clicks")}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold py-1.5 px-2 rounded-lg text-center"
                          >
                            Details
                          </Link>

                          <button
                            onClick={() => handleRejectProduct(rec.product.id, rec.product.name)}
                            title="Not for me"
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-stone-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-stone-500 bg-[#EFEAE1] p-3 rounded-2xl w-fit">
                <Sparkles className="w-4 h-4 text-[#C9A45C] animate-spin" />
                <span>AI Stylist is analyzing catalogue matches...</span>
              </div>
            )}
          </div>

          {/* Footer Chat Input */}
          <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about rings, gifts under ₹2000..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              className="flex-1 bg-stone-100 border border-stone-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#1C2B26]"
            />

            <button
              onClick={() => handleSendChat()}
              disabled={isAnalyzing}
              className="bg-[#1C2B26] hover:bg-stone-800 text-white p-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-[#C9A45C]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
