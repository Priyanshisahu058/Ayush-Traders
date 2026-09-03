"use client";

import React from "react";
import { notFound } from "next/navigation";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DesignStudioInterface from "@/components/custom-design/DesignStudioInterface";

const VALID_CATEGORIES = ["bracelet", "ring", "chain", "anklet"];

export default function CustomDesignCategoryPage({ params }: { params: { category: string } }) {
  const category = params?.category?.toLowerCase() as any;

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar />

      <div className="flex-1">
        <DesignStudioInterface category={category} />
      </div>

      <Footer />
    </main>
  );
}
