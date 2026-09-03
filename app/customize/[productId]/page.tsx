"use client";

import React from "react";
import { notFound } from "next/navigation";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DesignStudioInterface from "@/components/custom-design/DesignStudioInterface";
import { getEffectiveProducts, ALL_PRODUCTS } from "@/lib/products/data";

export default function CustomizeProductPage({ params }: { params: { productId: string } }) {
  const productId = params?.productId;
  const effective = getEffectiveProducts();
  const product = effective.find((p) => p.id === productId) || ALL_PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar />

      <div className="flex-1">
        <DesignStudioInterface category={product.category} baseProduct={product} />
      </div>

      <Footer />
    </main>
  );
}
