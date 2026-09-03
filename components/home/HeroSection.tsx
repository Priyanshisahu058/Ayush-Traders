"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative w-full bg-[#F7F5F0] py-6 sm:py-8 border-b border-stone-200">
      
      {/* Centered Hero Container with Proper Margins & Uncropped Composition */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative w-full aspect-[1536/672] rounded-2xl overflow-hidden shadow-sm border border-stone-200">
          
          <Image
            src="/Ayush Traders Jewelry Hero Banner.png"
            alt="Ayush Traders Jewelry Hero Banner"
            fill
            priority
            className="object-contain object-center"
          />

          {/* SHOP NOW Button Overlay positioned cleanly over the hero banner */}
          <div className="absolute left-[5%] bottom-[12%] z-20">
            <Link
              href="#categories"
              className="inline-flex items-center gap-2.5 bg-[#1C2B26] text-white font-bold text-xs sm:text-sm tracking-widest uppercase px-6 sm:px-8 py-3 sm:py-3.5 rounded-md hover:bg-stone-800 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 group"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </div>

    </section>
  );
}
