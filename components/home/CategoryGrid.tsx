"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CategoryGrid() {
  const categories = [
    {
      id: "anklet",
      title: "ANKLETS",
      image: "/anklet.category.png",
      description: "Silver Payal & Delicate Anklets",
      href: "/category/anklet",
    },
    {
      id: "chain",
      title: "CHAIN",
      image: "/chain.category.png",
      description: "Everyday Silver Chains & Necklaces",
      href: "/category/chain",
    },
    {
      id: "bracelet",
      title: "BRACELET",
      image: "/bracelet.category.png",
      description: "Simple & Elegant Silver Bracelets",
      href: "/category/bracelet",
    },
    {
      id: "ring",
      title: "RING",
      image: "/ring.category.png",
      description: "Minimal Sterling Silver Rings",
      href: "/category/ring",
    },
  ];

  return (
    <section id="categories" className="py-16 bg-[#F7F5F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-3 text-xs tracking-[0.25em] font-semibold text-stone-600 uppercase mb-1">
            <span>✦</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wider text-stone-900 uppercase">
              OUR CATEGORIES
            </h2>
            <span>✦</span>
          </div>
          <p className="font-serif text-stone-600 italic text-sm sm:text-base">
            Beautiful Everyday Silver Designs
          </p>
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex flex-col bg-[#EFEAE1]/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-stone-200"
            >
              {/* Category Image Box */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
                <Image
                  src={cat.image}
                  alt={`Ayush Traders ${cat.title}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  loading="lazy"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Title & Arrow */}
              <div className="py-4 px-4 flex items-center justify-between bg-[#EFEAE1] group-hover:bg-[#E5DFD5] transition-colors border-t border-stone-200">
                <div>
                  <h3 className="text-stone-900 font-bold text-xs tracking-widest uppercase">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-stone-600 font-normal">
                    {cat.description}
                  </p>
                </div>
                <div className="p-1.5 rounded-full bg-white/80 text-stone-800 group-hover:bg-[#1C2B26] group-hover:text-white transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
