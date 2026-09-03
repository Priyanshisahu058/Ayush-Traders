"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, ArrowLeft, CheckCircle2, Lock, Gift, Sparkles } from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ALL_PRODUCTS, TODAY_SILVER_RATE_PER_GRAM, reduceProductInventory } from "@/lib/products/data";
import { saveOrderToSupabase } from "@/lib/supabase/orders";
import { computeProductPrice } from "@/lib/pricing/computePrice";
import { getCurrentUser } from "@/lib/supabase/auth";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  selectedSize?: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [silverRate, setSilverRate] = useState<number>(TODAY_SILVER_RATE_PER_GRAM);
  const [authUser, setAuthUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    async function initCheckoutAuth() {
      const u = await getCurrentUser();
      if (u) {
        setAuthUser(u);
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || u.user_metadata?.full_name || "",
          phone: prev.phone || u.user_metadata?.phone || "",
        }));
      }
    }
    initCheckoutAuth();
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem("at_silver_rate");
      if (savedRate) {
        const parsed = parseFloat(savedRate);
        if (!isNaN(parsed) && parsed > 0) setSilverRate(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("at_cart_items");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const updated = parsed.map((item: any) => {
              const match = ALL_PRODUCTS.find((p) => p.id === item.id);
              const livePrice = match ? computeProductPrice(match, silverRate) : item.price;
              return { ...item, price: livePrice };
            });
            setCartItems(updated);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      const demoMatch = ALL_PRODUCTS.find((p) => p.id === "at-a201");
      const demoPrice = demoMatch ? computeProductPrice(demoMatch, silverRate) : 1890;
      setCartItems([
        {
          id: "at-a201",
          name: "Silver Charm Payal Anklet Pair",
          price: demoPrice,
          quantity: 1,
          image: "/Silver Charm Payal Anklet Pair.png",
          category: "Anklet",
          selectedSize: "9.5 Inches (Standard)",
        },
      ]);
    }
  }, [silverRate]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeGiftUnlocked = subtotal >= 499;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [failureAnalysis, setFailureAnalysis] = useState<{
    isFailed: boolean;
    explanation: string;
    recommendedAction: string;
    category: string;
    retryAllowed: boolean;
  } | null>(null);

  const triggerFailureIntelligence = async (meta: {
    orderId?: string;
    paymentId?: string;
    errorCode?: string;
    errorDescription?: string;
    reason?: string;
  }) => {
    try {
      const res = await fetch("/api/payment-intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setFailureAnalysis({
          isFailed: true,
          explanation: data.analysis.customer_explanation,
          recommendedAction: data.analysis.recommended_action,
          category: data.analysis.failure_category,
          retryAllowed: data.analysis.retry_allowed ?? true,
        });
      }
    } catch (err) {
      console.warn("Notice triggering payment intelligence:", err);
      setFailureAnalysis({
        isFailed: true,
        explanation: "We couldn't complete your payment request. No funds were debited.",
        recommendedAction: "retry_payment",
        category: "unknown",
        retryAllowed: true,
      });
    }
  };

  useEffect(() => {
    // Load Razorpay Checkout SDK Script dynamically
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.fullName || !formData.phone || !formData.pincode || !formData.address || !formData.city || !formData.state) {
      setErrorMessage("Please complete all shipping details before placing order.");
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === "razorpay") {
      try {
        // Step 1: Create Razorpay Order via Server API
        const res = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems,
            customer: formData,
            silverRate,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Failed to initialize payment.");
          setIsSubmitting(false);
          triggerFailureIntelligence({
            orderId: "ATO-PENDING",
            reason: "gateway_error",
            errorCode: "GATEWAY_ERROR",
            errorDescription: data.error || "Failed to initialize payment gateway",
          });
          return;
        }

        // Store initial pending online order payload
        const pendingOrderPayload = {
          orderId: data.formattedOrderId,
          rawId: data.orderId,
          date: new Date().toISOString(),
          customer: formData,
          items: cartItems,
          total: data.amount,
          paymentMethod: "Razorpay Online",
          paymentStatus: "Attempted Online",
          orderStatus: "Payment Pending",
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("at_latest_order", JSON.stringify(pendingOrderPayload));
        }

        // Step 2: Open Razorpay Test Mode Checkout Modal
        if (typeof window !== "undefined" && (window as any).Razorpay) {
          const options = {
            key: data.keyId,
            amount: data.amountInPaise,
            currency: "INR",
            name: "AT Ornaments",
            description: `Silver Ornaments Order ${data.formattedOrderId}`,
            image: "/logo 1.png",
            order_id: data.razorpayOrderId.startsWith("order_RzpTest_") ? undefined : data.razorpayOrderId,
            handler: async function (response: any) {
              const paymentId = response.razorpay_payment_id || `pay_test_${Date.now()}`;
              const orderId = response.razorpay_order_id || data.razorpayOrderId;
              const signature = response.razorpay_signature || "test_signature";

              // Step 3: Verify Payment Server-Side
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: paymentId,
                  razorpay_signature: signature,
                  order_id: data.orderId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                // Verified Paid! Update order payload in localStorage
                const verifiedPayload = {
                  ...pendingOrderPayload,
                  paymentStatus: "Paid",
                  orderStatus: "Order Confirmed",
                };
                localStorage.setItem("at_latest_order", JSON.stringify(verifiedPayload));
                setFailureAnalysis(null);
                localStorage.removeItem("at_cart_items");
                router.push(`/order-confirmation?orderId=${data.orderId}`);
              } else {
                const failedPayload = {
                  ...pendingOrderPayload,
                  paymentStatus: "Payment Failed",
                  orderStatus: "Payment Failed",
                };
                localStorage.setItem("at_latest_order", JSON.stringify(failedPayload));
                setErrorMessage(verifyData.error || "Payment verification failed.");
                setIsSubmitting(false);
                triggerFailureIntelligence({
                  orderId: data.orderId,
                  paymentId,
                  errorCode: "VERIFICATION_FAILED",
                  errorDescription: verifyData.error || "Payment signature verification failed",
                  reason: "authentication_failed",
                });
              }
            },
            prefill: {
              name: formData.fullName,
              contact: formData.phone,
              email: authUser?.email || (formData.phone + "@customer.atornaments.in"),
            },
            theme: { color: "#1C2B26" },
            modal: {
              ondismiss: function () {
                const failedPayload = {
                  ...pendingOrderPayload,
                  paymentStatus: "Payment Failed",
                  orderStatus: "Payment Failed",
                };
                localStorage.setItem("at_latest_order", JSON.stringify(failedPayload));
                setIsSubmitting(false);
                triggerFailureIntelligence({
                  orderId: data.orderId,
                  reason: "payment_cancelled",
                  errorCode: "BAD_REQUEST_ERROR",
                  errorDescription: "Customer closed payment window before authorization",
                });
              },
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          setErrorMessage("Razorpay Checkout SDK could not be loaded. Please refresh the page and try again.");
          setIsSubmitting(false);
          triggerFailureIntelligence({
            orderId: data.orderId,
            reason: "network_failure",
            errorCode: "SDK_NOT_LOADED",
            errorDescription: "Razorpay Checkout SDK script was unavailable",
          });
        }
      } catch (err: any) {
        console.error("Razorpay Checkout Error:", err);
        setErrorMessage("Payment error: " + (err?.message || "Please try again."));
        setIsSubmitting(false);
        triggerFailureIntelligence({
          reason: "network_failure",
          errorCode: "NETWORK_ERROR",
          errorDescription: err?.message || "Network exception during checkout",
        });
      }
      return;
    }

    // Cash on Delivery Flow
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderId = `#ATO-${randomDigits}`;
    const rawId = `ATO-${randomDigits}`;

    const snapshottedItems = cartItems.map((item) => {
      reduceProductInventory(item.id, item.quantity, item.selectedSize);
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        category: item.category,
        selectedSize: item.selectedSize,
      };
    });

    const orderPayload = {
      orderId,
      rawId,
      date: new Date().toISOString(),
      customer: formData,
      items: snapshottedItems,
      total: subtotal,
      subtotal: subtotal,
      freeGiftUnlocked,
      currentStageIndex: 0,
      courier: "Shiprocket Express",
      awb: `AWB${Math.floor(10000000 + Math.random() * 90000000)}`,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending COD",
      silverRateAtPurchase: silverRate,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("at_latest_order", JSON.stringify(orderPayload));
      localStorage.removeItem("at_cart_items");

      saveOrderToSupabase({
        orderId: rawId,
        orderNumber: orderId,
        customerId: authUser?.id || undefined,
        customerName: formData.fullName,
        email: authUser?.email || (formData.phone + "@customer.atornaments.in"),
        phone: formData.phone,
        shippingAddress: formData,
        subtotal: subtotal,
        gst: 0,
        shippingCharge: 0,
        total: subtotal,
        paymentStatus: "Pending COD",
        orderStatus: "Order Confirmed",
        currentStageIndex: 0,
        silverRateAtPurchase: silverRate,
        items: snapshottedItems.map((it: any) => ({
          productId: it.id,
          productName: it.name,
          quantity: it.quantity,
          unitPrice: it.price,
          totalPrice: it.price * it.quantity,
          selectedSize: it.selectedSize || "",
          image: it.image || "",
        })),
      }).catch((err) => console.warn("Supabase async order save:", err));
    }

    setTimeout(() => {
      router.push(`/order-confirmation?orderId=${rawId}`);
    }, 1200);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar />

      <div className="bg-[#EFEAE1]/70 py-4 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
          <Link href="/shop" className="flex items-center gap-1.5 font-bold text-stone-700 hover:text-stone-900 uppercase">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <span className="font-serif font-bold text-stone-900 uppercase tracking-widest">
            SECURE ENCRYPTED CHECKOUT
          </span>
        </div>
      </div>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Shipping Form Left Column */}
          <div className="lg:col-span-7 space-y-6">

            {/* AI PAYMENT RECOVERY PANEL */}
            {failureAnalysis && failureAnalysis.isFailed && (
              <div className="bg-[#1C2B26] text-white p-6 sm:p-7 rounded-2xl border border-[#C9A45C]/40 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-stone-700 pb-3">
                  <div className="p-2 rounded-full bg-amber-500/20 text-[#C9A45C]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-amber-200">
                      Payment Couldn't Be Completed
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      AI Recovery Assistant Diagnosis • {failureAnalysis.category.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-200 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-stone-800">
                  {failureAnalysis.explanation}
                </p>

                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Recommended next step: {failureAnalysis.recommendedAction.replace(/_/g, " ")}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="submit"
                    onClick={() => setPaymentMethod("razorpay")}
                    className="bg-[#C9A45C] hover:bg-amber-600 text-stone-950 font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all text-center cursor-pointer"
                  >
                    🔄 Retry Payment
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cod");
                      setFailureAnalysis(null);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all text-center border border-white/20 cursor-pointer"
                  >
                    💵 Pay via COD
                  </button>

                  <Link
                    href="/shop"
                    className="bg-white/10 hover:bg-white/20 text-stone-300 font-bold text-[11px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all text-center border border-white/10 flex items-center justify-center cursor-pointer"
                  >
                    🛍️ Return to Cart
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-6">
              <div className="border-b border-stone-300 pb-3 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-stone-900 uppercase">
                  1. Shipping Address Details
                </h2>
                <span className="text-[10px] text-stone-500 uppercase font-bold">Step 1 of 2</span>
              </div>

              {errorMessage && (
                <div className="bg-red-100 border border-red-300 text-red-800 text-xs p-3 rounded-xl font-semibold">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Ananya Roy"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1.5">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      placeholder="6-digit pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1.5">
                    Flat, House No., Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="Street name, landmark, area"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1.5">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="e.g. Lucknow"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1.5">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      placeholder="e.g. Uttar Pradesh"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-4">
              <h2 className="font-serif text-xl font-bold text-stone-900 uppercase border-b border-stone-300 pb-3">
                2. Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === "razorpay"
                      ? "border-[#1C2B26] bg-white shadow-xs"
                      : "border-stone-300 bg-white/60"
                  }`}
                >
                  <input type="radio" checked={paymentMethod === "razorpay"} onChange={() => {}} className="accent-[#1C2B26]" />
                  <div>
                    <span className="font-bold text-stone-900 block">Razorpay Hosted Online</span>
                    <span className="text-[10px] text-stone-500">UPI, GPay, Credit/Debit Cards</span>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-[#1C2B26] bg-white shadow-xs"
                      : "border-stone-300 bg-white/60"
                  }`}
                >
                  <input type="radio" checked={paymentMethod === "cod"} onChange={() => {}} className="accent-[#1C2B26]" />
                  <div>
                    <span className="font-bold text-stone-900 block">Cash on Delivery</span>
                    <span className="text-[10px] text-stone-500">Pay cash upon delivery</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary Right Column */}
          <div className="lg:col-span-5 bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-6">
            <h2 className="font-serif text-xl font-bold text-stone-900 uppercase border-b border-stone-300 pb-3">
              Order Summary
            </h2>

            {/* Gift Banner */}
            {freeGiftUnlocked ? (
              <div className="p-3.5 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Gift className="w-5 h-5 text-emerald-800 flex-shrink-0" />
                <span>🎁 FREE SURPRISE GIFT UNLOCKED!</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-900/10 border border-amber-800/30 flex items-center gap-2 text-xs font-medium text-amber-950">
                <Gift className="w-5 h-5 text-amber-800 flex-shrink-0" />
                <span>Add ₹{499 - subtotal} more to unlock your FREE SURPRISE GIFT 🎁</span>
              </div>
            )}

            {/* Product Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 text-xs">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-stone-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-stone-900 line-clamp-1">{item.name}</span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Qty: {item.quantity} {item.selectedSize ? `| Size: ${item.selectedSize}` : ""}
                    </span>
                  </div>
                  <span className="font-bold text-stone-900">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t border-stone-300 pt-4 space-y-2 text-xs text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span className="text-emerald-800 font-bold">FREE (₹0)</span>
              </div>
              {freeGiftUnlocked && (
                <div className="flex justify-between text-emerald-900 font-bold">
                  <span>Free Surprise Gift</span>
                  <span>₹0 (Included)</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-stone-900 border-t border-stone-300 pt-3">
                <span>Total Amount</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              {isSubmitting ? (
                <span>PROCESSING SECURE ORDER...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>CONFIRM & PLACE ORDER (₹{subtotal.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </div>

        </form>
      </section>

      <Footer />
    </main>
  );
}
