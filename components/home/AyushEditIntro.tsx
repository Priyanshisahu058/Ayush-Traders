"use client";

import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function AyushEditIntro() {
  return (
    <section className="py-16 bg-[#F7F5F0] border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-4">
        
        <div className="flex items-center gap-2 text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#1C2B26]" />
          <span>THE AYUSH TRADERS EDIT</span>
          <Sparkles className="w-3.5 h-3.5 text-[#1C2B26]" />
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 leading-snug">
          Crafted with Passion. Stamped with Purity.
        </h2>

        <p className="text-stone-600 text-sm sm:text-base leading-relaxed font-normal max-w-2xl">
          Established in 2006 as a family-owned silver and fine jewellery store, Ayush Traders Ornaments brings decades of trusted craftsmanship directly online. Every silver piece is stamped with an official <strong className="text-stone-900 font-semibold">BIS Hallmark HUID</strong> code to ensure 92.5 sterling silver purity.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-semibold uppercase tracking-wider text-stone-700">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1C2B26]" />
            GST Registered Business
          </span>
          <span className="text-stone-300">•</span>
          <span>100% BIS Hallmarked Silver</span>
          <span className="text-stone-300">•</span>
          <span>Direct-to-Consumer Pricing</span>
        </div>

      </div>
    </section>
  );
}
