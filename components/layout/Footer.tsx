"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#1C2B26] text-stone-300 pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-700/60">
          
          {/* Upper-Left: Brand Info Column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 p-1 border border-white/20">
                <Image
                  src="/logo 1.png"
                  alt="Ayush Traders Logo 1"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <div className="flex flex-col text-white leading-tight">
                <span className="font-serif text-xl font-bold tracking-wider">
                  AYUSH TRADERS
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-stone-300 font-medium">
                  ◆ ORNAMENTS ◆ EST. 2006
                </span>
              </div>
            </Link>

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm font-normal">
              Ayush Traders Ornaments ("AT Ornaments") is a direct-to-consumer jewellery store providing 92.5 sterling silver and fine ornaments. Registered under GST India.
            </p>

            <div className="flex items-center gap-2 text-xs text-stone-300 font-medium">
              <Sparkles className="w-4 h-4 text-[#C9A45C]" />
              <span>GST Registered • 100% 925 Sterling Silver Guarantee</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-700 pb-2 inline-block">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-stone-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home Page</Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">Shop All Jewellery</Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">Track Shipment</Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-700 pb-2 inline-block">
              Categories
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-stone-400">
              <li>
                <Link href="/category/anklet" className="hover:text-white transition-colors">Anklets (Payal)</Link>
              </li>
              <li>
                <Link href="/category/chain" className="hover:text-white transition-colors">Sterling Silver Chains</Link>
              </li>
              <li>
                <Link href="/category/bracelet" className="hover:text-white transition-colors">Bracelets & Kada</Link>
              </li>
              <li>
                <Link href="/category/ring" className="hover:text-white transition-colors">Solitaire Rings</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-stone-700 pb-2 inline-block">
              Contact Us
            </h4>
            <ul className="flex flex-col gap-3 text-xs text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
                <span>Ayush Traders, Main Market, Uttar Pradesh, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <a href="mailto:support@ayushtraders.com" className="hover:text-white transition-colors">support@ayushtraders.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Metadata & Legal Policies Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Ayush Traders Ornaments. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/policies/return-exchange" className="hover:text-stone-300 transition-colors">
              Return & Exchange Policy
            </Link>
            <Link href="/policies/shipping" className="hover:text-stone-300 transition-colors">
              Shipping Policy
            </Link>
            <Link href="/policies/privacy" className="hover:text-stone-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/policies/terms" className="hover:text-stone-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
