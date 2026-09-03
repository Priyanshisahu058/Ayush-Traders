"use client";

import React, { useEffect, useState } from "react";
import { Users, PackageCheck, MapPin, Calendar } from "lucide-react";

export default function StatCounters() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState({ customers: 0, orders: 0, cities: 0 });

  useEffect(() => {
    // Simple mock counter animation
    const duration = 2000;
    const steps = 50;
    const intervalTime = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        customers: Math.floor(15000 * progress),
        orders: Math.floor(25000 * progress),
        cities: Math.floor(350 * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setHasAnimated(true);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      icon: Users,
      value: counts.customers.toLocaleString("en-IN") + "+",
      label: "Happy Customers",
      subtext: "Delighted across India",
    },
    {
      icon: PackageCheck,
      value: counts.orders.toLocaleString("en-IN") + "+",
      label: "Orders Delivered",
      subtext: "100% Safe & Tracked",
    },
    {
      icon: MapPin,
      value: counts.cities.toLocaleString("en-IN") + "+",
      label: "Cities Covered",
      subtext: "Pan-India Free Express",
    },
    {
      icon: Calendar,
      value: "2006",
      label: "Trusted Since",
      subtext: "Family Business Heritage",
    },
  ];

  return (
    <section className="py-16 bg-brand-green-dark text-brand-cream relative border-y border-brand-gold/30 overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-brand-gold/20">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center text-center p-4 ${
                  idx > 0 ? "pt-6 lg:pt-4" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center mb-4 border border-brand-gold/30 shadow-inner">
                  <Icon className="w-6 h-6" />
                </div>

                <span className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold gold-gradient-text tracking-tight">
                  {stat.value}
                </span>

                <span className="text-sm font-bold text-brand-cream mt-1 uppercase tracking-wider">
                  {stat.label}
                </span>

                <span className="text-xs text-brand-cream/60 mt-0.5">
                  {stat.subtext}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
