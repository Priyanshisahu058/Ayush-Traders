"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, RotateCcw, Lock, FileText, AlertTriangle, ChevronRight } from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const POLICY_DATA: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
  "return-exchange": {
    title: "Return & Exchange Policy",
    subtitle: "Clear Policy Guidelines for Silver & Artificial Jewellery Orders",
    content: (
      <div className="space-y-8 text-stone-800 text-sm leading-relaxed">
        
        {/* Silver Jewellery Policy Warning Callout */}
        <div className="p-6 rounded-2xl bg-amber-900/10 border-2 border-amber-800/30 space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-base uppercase">
            <AlertTriangle className="w-5 h-5 text-amber-800 flex-shrink-0" />
            <span>Silver Jewellery Policy: No Return • No Exchange</span>
          </div>
          <p className="text-amber-950 font-medium text-xs leading-relaxed">
            Due to strict purity standards and fluctuating daily silver bullion values, all <strong>925 Sterling Silver Jewellery</strong> purchases (chains, anklets, bracelets, and rings) are <strong>final sale</strong>. We do not accept returns or exchanges for silver items once delivered.
          </p>
        </div>

        {/* Artificial Jewellery Policy Callout */}
        <div className="p-6 rounded-2xl bg-emerald-900/10 border-2 border-emerald-800/30 space-y-3">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-base uppercase">
            <RotateCcw className="w-5 h-5 text-emerald-800 flex-shrink-0" />
            <span>Artificial Jewellery Policy: 7-Day Return / Exchange</span>
          </div>
          <p className="text-emerald-950 font-medium text-xs leading-relaxed">
            <strong>Artificial & Fashion Jewellery</strong> items are eligible for return or exchange within <strong>7 days</strong> of delivery, provided the item is unused, unworn, and returned in original tamper-evident packaging with tags intact.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 pt-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">1. Damaged or Incorrect Orders</h3>
            <p className="text-stone-700 text-xs leading-relaxed">
              If you receive a package that is visibly damaged during transit or if an incorrect product was delivered, please contact our support team at <a href="mailto:support@ayushtraders.com" className="font-bold underline text-[#1C2B26]">support@ayushtraders.com</a> within 24 hours of delivery with an unboxing video clip.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">2. Artificial Jewellery Return Process</h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-stone-700">
              <li>Submit a return request via email to support@ayushtraders.com specifying your Order ID.</li>
              <li>Once approved, package the artificial jewellery item securely in original packaging.</li>
              <li>Our logistics partner will arrange doorstep pickup within 2–3 business days.</li>
              <li>Upon quality inspection, store credit or replacement will be issued.</li>
            </ol>
          </div>
        </div>

      </div>
    ),
  },

  shipping: {
    title: "Shipping & Delivery Policy",
    subtitle: "Doorstep Delivery Across India",
    content: (
      <div className="space-y-6 text-stone-800 text-sm leading-relaxed">
        <div className="p-5 rounded-2xl bg-[#EFEAE1] border border-stone-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900 text-sm uppercase">
            <Truck className="w-5 h-5 text-[#1C2B26]" />
            <span>Free Shipping Across India</span>
          </div>
          <p className="text-xs text-stone-700">
            We provide <strong>FREE SHIPPING</strong> on every order across India with zero hidden delivery fees at checkout.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">1. Delivery Timeframe</h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              Standard orders are processed within 24–48 hours and delivered within <strong>5–7 business days</strong> across major Indian cities and pin codes.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">2. Order Tracking</h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              Once dispatched, you will receive an SMS and email notification with your AWB tracking link. You can also track your shipment live on our <Link href="/track-order" className="font-bold underline text-[#1C2B26]">Track Order Page</Link>.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">3. Delivery Conditions</h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              Deliveries require recipient signature upon receipt. Please verify that the tamper-evident security bag is intact before accepting your parcel.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  privacy: {
    title: "Privacy Policy",
    subtitle: "How Ayush Traders Protects Your Personal Information",
    content: (
      <div className="space-y-6 text-stone-800 text-sm leading-relaxed">
        <div className="p-5 rounded-2xl bg-[#EFEAE1] border border-stone-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900 text-sm uppercase">
            <Lock className="w-5 h-5 text-[#1C2B26]" />
            <span>Your Privacy Commitment</span>
          </div>
          <p className="text-xs text-stone-700">
            Ayush Traders Ornaments values your privacy and ensures all customer transaction and address data is handled securely.
          </p>
        </div>

        <div className="space-y-4 pt-2 text-xs text-stone-700">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">1. Data Collection</h3>
            <p className="leading-relaxed">
              We collect customer details necessary for order fulfillment, including full name, phone number, shipping address, pincode, and payment confirmation IDs.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">2. Use of Information</h3>
            <p className="leading-relaxed">
              Customer data is strictly used for order processing, shipping dispatch via logistics partners, customer support inquiries, and essential transactional updates.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">3. Third-Party Sharing</h3>
            <p className="leading-relaxed">
              We do not sell, rent, or lease customer lists to third parties. Information is shared solely with verified logistics partners (e.g. Shiprocket) and payment gateway providers (e.g. Razorpay) to complete your order.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  terms: {
    title: "Terms of Service",
    subtitle: "Website Usage & Order Agreement Terms",
    content: (
      <div className="space-y-6 text-stone-800 text-sm leading-relaxed">
        <div className="p-5 rounded-2xl bg-[#EFEAE1] border border-stone-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900 text-sm uppercase">
            <FileText className="w-5 h-5 text-[#1C2B26]" />
            <span>Terms Overview</span>
          </div>
          <p className="text-xs text-stone-700">
            By accessing Ayush Traders Ornaments, you agree to comply with our store terms and product policies.
          </p>
        </div>

        <div className="space-y-4 pt-2 text-xs text-stone-700">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">1. Pricing & Product Accuracy</h3>
            <p className="leading-relaxed">
              Prices for weight-based silver products are updated based on daily silver bullion rates + making charges. All product dimensions and net gram weights are specified accurately.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">2. Return & Exchange Policy Summary</h3>
            <p className="leading-relaxed">
              <strong>Silver Jewellery:</strong> Strictly NO Return and NO Exchange once delivered.<br />
              <strong>Artificial Jewellery:</strong> Eligible for 7-day return/exchange in original condition.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">3. GST Compliance</h3>
            <p className="leading-relaxed">
              Ayush Traders Ornaments operates in full compliance with GST India regulations. Itemized GST tax invoices are generated for all paid orders.
            </p>
          </div>
        </div>
      </div>
    ),
  },
};

export default function DynamicPolicyPage({ params }: { params: { slug: string } }) {
  const policyKey = params?.slug?.toLowerCase();
  const policy = POLICY_DATA[policyKey];

  if (!policy) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[#EFEAE1]/60 py-3 border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 text-xs text-stone-600">
          <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span>Policies</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-semibold">{policy.title}</span>
        </div>
      </div>

      {/* Header Banner */}
      <section className="bg-[#EFEAE1] py-12 border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase">
            AYUSH TRADERS LEGAL & POLICY
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 uppercase mt-1">
            {policy.title}
          </h1>
          <p className="font-serif italic text-stone-600 text-sm sm:text-base mt-2">
            {policy.subtitle}
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 w-full flex-1">
        <div className="bg-[#EFEAE1]/60 p-6 sm:p-10 rounded-2xl border border-stone-300 shadow-xs">
          {policy.content}
        </div>
      </section>

      <Footer />
    </main>
  );
}
