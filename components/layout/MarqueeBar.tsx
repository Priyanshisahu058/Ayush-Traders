"use client";

import React from "react";
import { Truck } from "lucide-react";

export default function MarqueeBar() {
  const items = [
    { icon: true, text: "FREE SHIPPING ALL OVER INDIA" },
    { icon: false, text: "ELEGANT JEWELLERY FOR EVERY DAY" },
    { icon: false, text: "BUY 3 PRODUCTS FOR ₹999/-" },
    { icon: false, text: "CASH ON DELIVERY AVAILABLE" },
  ];

  return (
    <div className="bg-[#1C2B26] text-white text-[11px] font-semibold tracking-[0.2em] uppercase py-2 overflow-hidden border-b border-white/10 relative z-50">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...items, ...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="inline-flex items-center gap-2 mx-8 text-white/95">
            {item.icon && <Truck className="w-3.5 h-3.5 flex-shrink-0 text-stone-300" />}
            <span>{item.text}</span>
            <span className="ml-8 text-stone-400 font-normal">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
