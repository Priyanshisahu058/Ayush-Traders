"use client";

import React from "react";
import Image from "next/image";

export default function AboutSection() {
  return (
    <section id="about" className="py-12 sm:py-16 bg-[#F7F5F0] border-y border-stone-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* About Image Container with Ample Breathing Room & Uncropped Aspect Ratio */}
        <div className="relative w-full aspect-[1535/1024] rounded-2xl overflow-hidden shadow-sm border border-stone-200">
          <Image
            src="/about.png"
            alt="About Ayush Traders Ornaments"
            fill
            priority
            className="object-contain object-center"
          />
        </div>

      </div>
    </section>
  );
}
