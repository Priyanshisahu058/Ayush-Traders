"use client";

import React from "react";
import { ShieldCheck, Droplets, Gem, Leaf } from "lucide-react";

export default function TrustStrip() {
  const features = [
    {
      icon: ShieldCheck,
      title: "ANTI TARNISH",
      subtitle: "Long Lasting Shine",
    },
    {
      icon: Droplets,
      title: "WATERPROOF",
      subtitle: "Wear It Anywhere",
    },
    {
      icon: Gem,
      title: "PREMIUM QUALITY",
      subtitle: "Finest Craftsmanship",
    },
    {
      icon: Leaf,
      title: "SKIN FRIENDLY",
      subtitle: "Comfortable for Daily Wear",
    },
  ];

  return (
    <section className="bg-[#F7F5F0] border-y border-stone-300/80 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Headline */}
        <div className="text-center mb-8">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-stone-600">
            TRUST &nbsp;•&nbsp; PURITY &nbsp;•&nbsp; ELEGANCE
          </span>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-stone-300">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 justify-center px-4 py-2"
              >
                <div className="p-2 text-stone-800">
                  <Icon className="w-8 h-8 stroke-[1.4]" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-xs sm:text-sm font-bold tracking-wider text-stone-900 uppercase">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-stone-600 font-medium">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
