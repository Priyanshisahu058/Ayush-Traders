"use client";

import React from "react";
import { Sparkles, ShoppingBag, Eye, Heart } from "lucide-react";

export default function ShopByLook() {
  const looks = [
    {
      id: "look-1",
      title: "Bridal Payal & Anklet Stack",
      model: "@AyushTradersLooks",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&auto=format&fit=crop&q=80",
      taggedProduct: "Ghungroo Charm Silver Payal",
      price: "₹1,890",
      likes: "1.4k",
    },
    {
      id: "look-2",
      title: "Modern Office Silver Chain",
      model: "@AyushTradersLooks",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80",
      taggedProduct: "Heritage Sterling Silver Chain",
      price: "₹2,450",
      likes: "2.8k",
    },
    {
      id: "look-3",
      title: "Minimalist Ring Stacking",
      model: "@AyushTradersLooks",
      image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=700&auto=format&fit=crop&q=80",
      taggedProduct: "Solitaire Crown Silver Ring",
      price: "₹799",
      likes: "3.1k",
    },
    {
      id: "look-4",
      title: "Festive Silver Kada Styling",
      model: "@AyushTradersLooks",
      image: "https://images.unsplash.com/photo-1611591475165-da7949c590ad?w=700&auto=format&fit=crop&q=80",
      taggedProduct: "Embossed Silver Kada",
      price: "₹3,200",
      likes: "950",
    },
  ];

  return (
    <section className="py-20 bg-brand-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 text-brand-gold-dark text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Social Lookbook</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-green-dark tracking-tight">
            Shop By Look
          </h2>
          <div className="w-16 h-0.5 bg-brand-gold mt-4 mb-3 rounded-full" />
          <p className="text-stone-600 max-w-xl text-sm sm:text-base">
            Get inspired by real styling ideas and tap any tagged ornament to add directly to your cart.
          </p>
        </div>

        {/* Lookbook Cards Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {looks.map((look) => (
            <div
              key={look.id}
              className="group relative rounded-3xl overflow-hidden aspect-[9/14] bg-stone-900 shadow-lg hover:shadow-2xl transition-all duration-500 border border-brand-gold/30"
            >
              {/* Background Image */}
              <img
                src={look.image}
                alt={look.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />

              {/* Header Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="text-[11px] font-semibold text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  {look.model}
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  {look.likes}
                </span>
              </div>

              {/* Tagged Product Bottom Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl glass-dark border border-brand-gold/40 text-brand-cream z-10 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <p className="text-[10px] text-brand-gold uppercase tracking-widest font-semibold mb-0.5">
                  Tagged Product
                </p>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {look.taggedProduct}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-gold/20">
                  <span className="text-sm font-extrabold text-brand-gold">
                    {look.price}
                  </span>
                  <button className="flex items-center gap-1.5 text-xs bg-brand-gold text-brand-green-dark font-bold px-3 py-1.5 rounded-xl hover:bg-brand-gold-light transition-colors">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Shop</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
