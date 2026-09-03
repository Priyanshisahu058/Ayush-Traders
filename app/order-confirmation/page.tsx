"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  Gift,
  ShoppingBag,
  Sparkles,
  MapPin,
  Calendar,
  Download,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { getSupabaseClient } from "@/lib/supabase/client";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      const searchId = searchParams?.get("orderId");
      const supabase = getSupabaseClient();
      
      if (supabase && searchId) {
        try {
          const { data } = await supabase
            .from("orders")
            .select("*")
            .or(`id.eq.${searchId},order_number.eq.#${searchId},order_number.eq.${searchId}`)
            .maybeSingle();

          if (data) {
            setOrder({
              orderId: data.order_number || `#${data.id}`,
              rawId: data.id,
              date: data.created_at,
              customer: data.shipping_address,
              items: data.items,
              total: data.total,
              paymentStatus: data.payment_status,
              orderStatus: data.order_status,
            });
            return;
          }
        } catch (e) {}
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("at_latest_order");
        if (saved) {
          try {
            setOrder(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    fetchOrderData();
  }, [searchParams]);

  const orderId = order?.orderId || `#ATO-${searchParams?.get("orderId") || "8492"}`;
  const items = order?.items || [
    {
      id: "at-a201",
      name: "Silver Charm Payal Anklet Pair",
      price: 1890,
      quantity: 1,
      image: "/Silver Charm Payal Anklet Pair.png",
      category: "Anklet",
      selectedSize: "9.5 Inches",
    },
  ];

  const total = order?.total || items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const freeGiftUnlocked = order?.freeGiftUnlocked ?? (total >= 499);
  const customer = order?.customer || {
    fullName: "Valued Customer",
    address: "Main Market Road",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    phone: "+91 98765 43210",
  };

  const rawPaymentStatus = (order?.paymentStatus || order?.payment_status || "Payment Pending").toString().toLowerCase();
  const isPaymentFailed = rawPaymentStatus.includes("failed") || rawPaymentStatus.includes("declined");
  const isPaymentPending = rawPaymentStatus.includes("attempted") || rawPaymentStatus.includes("pending online") || rawPaymentStatus.includes("pending");
  const isConfirmedOrder = !isPaymentFailed && !isPaymentPending;

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar cartCount={0} />

      {/* Hero Section */}
      <section className={`${isConfirmedOrder ? "bg-[#EFEAE1]" : "bg-red-50"} py-14 border-b border-stone-200`}>
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          
          <div className={`w-16 h-16 rounded-full ${isConfirmedOrder ? "bg-emerald-800" : "bg-red-700"} text-white flex items-center justify-center mb-4 shadow-md`}>
            {isConfirmedOrder ? <CheckCircle2 className="w-10 h-10 stroke-[2]" /> : <ShoppingBag className="w-9 h-9 stroke-[2]" />}
          </div>

          <span className="text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase mb-1">
            {isConfirmedOrder ? "THANK YOU FOR YOUR ORDER" : "PAYMENT UNCONFIRMED"}
          </span>
          
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 uppercase">
            {isConfirmedOrder ? "Order Placed Successfully!" : "Payment Pending / Failed"}
          </h1>
          
          <p className="font-serif italic text-stone-600 text-sm sm:text-base mt-2">
            {isConfirmedOrder ? (
              <>Your order <strong className="text-[#1C2B26] font-bold not-italic">{orderId}</strong> has been confirmed and is being hand-packaged for shipping.</>
            ) : (
              <>Your order <strong className="text-red-900 font-bold not-italic">{orderId}</strong> remains unconfirmed because payment was not completed. Please retry payment to confirm your order.</>
            )}
          </p>

          {isConfirmedOrder ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-stone-800 bg-white/80 px-5 py-2.5 rounded-full border border-stone-300 shadow-xs">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Truck className="w-4 h-4" /> Estimated Delivery: 5–7 Business Days
              </span>
            </div>
          ) : (
            <div className="mt-6">
              <Link
                href="/checkout"
                className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-md inline-block"
              >
                RETRY PAYMENT IN CHECKOUT
              </Link>
            </div>
          )}

        </div>
      </section>

      {/* Order Details Body */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 w-full flex-1 space-y-8">
        
        {/* Surprise Gift Celebration Card */}
        {freeGiftUnlocked && (
          <div className="bg-emerald-900/10 border-2 border-emerald-800/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-800 text-white flex-shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C9A45C]" />
                  FREE SURPRISE GIFT INCLUDED
                </h3>
                <p className="text-xs text-emerald-800 font-medium">
                  Your order qualified for a complimentary Ayush Traders surprise gift inside your parcel!
                </p>
              </div>
            </div>
            <span className="bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wider flex-shrink-0">
              ₹0 Free Gift
            </span>
          </div>
        )}

        {/* 2-Column Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Ordered Products Card */}
          <div className="bg-[#EFEAE1]/70 p-6 rounded-2xl border border-stone-300 space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-900 uppercase flex items-center gap-2 border-b border-stone-300 pb-3">
              <Package className="w-4 h-4 text-[#1C2B26]" />
              Ordered Items
            </h3>

            <div className="space-y-3">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xs font-bold text-stone-900 line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-stone-500 font-medium">
                      Qty: {item.quantity} {item.selectedSize ? `• Size: ${item.selectedSize}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-stone-900">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-300 pt-3 space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Line Item</span>
                <span className="text-emerald-800 font-bold">FREE (₹0)</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-300">
                <span>Total Amount Paid</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Shipping Address Card */}
          <div className="bg-[#EFEAE1]/70 p-6 rounded-2xl border border-stone-300 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 uppercase flex items-center gap-2 border-b border-stone-300 pb-3">
                <MapPin className="w-4 h-4 text-[#1C2B26]" />
                Shipping Address
              </h3>

              <div className="mt-4 space-y-1 text-xs text-stone-800">
                <p className="font-bold text-sm text-stone-900">{customer.fullName}</p>
                <p>{customer.address}</p>
                <p>{customer.city}, {customer.state} - {customer.pincode}</p>
                <p className="text-stone-600 font-medium pt-1">Phone: {customer.phone}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Calendar className="w-4 h-4 text-[#1C2B26]" />
                <span>Estimated Delivery Window</span>
              </div>
              <p className="text-xs text-stone-600">
                5–7 Business Days via Express Courier with live SMS updates.
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href={`/invoice/${order?.rawId || searchParams?.get("orderId") || "8492"}`}
            className="w-full sm:w-auto bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-[#C9A45C]" />
            <span>DOWNLOAD GST INVOICE</span>
          </Link>

          <Link
            href={`/track-order?orderId=${order?.rawId || searchParams?.get("orderId") || "8492"}`}
            className="w-full sm:w-auto bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Truck className="w-4 h-4 text-[#1C2B26]" />
            <span>TRACK SHIPMENT</span>
          </Link>

          <Link
            href="/shop"
            className="w-full sm:w-auto bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl border border-stone-300 flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>CONTINUE SHOPPING</span>
          </Link>
        </div>

      </section>

      <Footer />
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-12 text-stone-800 font-bold text-xs uppercase tracking-widest">
        Loading Order Confirmation...
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
