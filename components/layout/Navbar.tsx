"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X, Truck, User } from "lucide-react";

interface NavbarProps {
  onOpenCart?: () => void;
  cartCount?: number;
}

export default function Navbar({ onOpenCart, cartCount = 0 }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#F7F5F0]/95 backdrop-blur-md border-b border-stone-300/60 py-2.5 px-4 sm:px-8 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-stone-800 p-2 flex-shrink-0"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* UPPER-LEFT CORNER: Clean AT Monogram Logo (No Box/Border) + Wordmark */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative h-13 w-13 sm:h-[54px] sm:w-[54px] flex-shrink-0">
            <Image
              src="/logo 1.png"
              alt="Ayush Traders AT Monogram Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col text-stone-900 leading-tight justify-center flex-shrink-0">
            <span className="font-serif text-lg sm:text-2xl font-bold tracking-wider whitespace-nowrap text-stone-900 group-hover:text-[#1C2B26] transition-colors">
              AYUSH TRADERS
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.22em] font-semibold text-stone-600 uppercase mt-0.5 whitespace-nowrap">
              ORNAMENTS • EST. 2006
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/"
            className="text-xs font-bold tracking-widest text-stone-900 uppercase py-1 hover:text-[#1C2B26] transition-colors whitespace-nowrap"
          >
            HOME
          </Link>
          <Link
            href="/#categories"
            className="text-xs font-bold tracking-widest text-stone-700 hover:text-[#1C2B26] uppercase transition-colors py-1 whitespace-nowrap"
          >
            COLLECTIONS
          </Link>
          <Link
            href="/track-order"
            className="text-xs font-bold tracking-widest text-stone-700 hover:text-[#1C2B26] uppercase transition-colors py-1 whitespace-nowrap flex items-center gap-1"
          >
            <Truck className="w-3.5 h-3.5 text-[#1C2B26]" />
            <span>TRACK ORDER</span>
          </Link>
          <Link
            href="/contact"
            className="text-xs font-bold tracking-widest text-stone-700 hover:text-[#1C2B26] uppercase transition-colors py-1 whitespace-nowrap"
          >
            CONTACT
          </Link>
        </nav>

        {/* Right Icons (Search, Wishlist, User/Sign In, Cart) */}
        <div className="flex items-center gap-3 sm:gap-4 text-stone-800 flex-shrink-0">
          <Link href="/shop" className="hover:text-[#1C2B26] transition-colors p-1" aria-label="Search Shop">
            <Search className="w-5 h-5 stroke-[1.8]" />
          </Link>

          <Link href="/wishlist" className="hover:text-[#1C2B26] transition-colors p-1" aria-label="Wishlist">
            <Heart className="w-5 h-5 stroke-[1.8]" />
          </Link>

          {/* User Account / Sign In Link */}
          <Link
            href="/account"
            className="hover:text-[#1C2B26] transition-colors p-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-800"
            aria-label="My Account"
          >
            <User className="w-5 h-5 stroke-[1.8]" />
            <span className="hidden xl:inline text-[11px] font-bold">ACCOUNT</span>
          </Link>

          <button
            onClick={onOpenCart}
            className="hover:text-[#1C2B26] transition-colors p-1 relative flex items-center"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            <span className="absolute -top-1 -right-2 bg-[#1C2B26] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-stone-200 flex flex-col gap-3 font-semibold text-xs tracking-widest uppercase">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-stone-900 py-1">
            HOME
          </Link>
          <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            TRACK ORDER
          </Link>
          <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            MY WISHLIST
          </Link>
          <Link href="/category/chain" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            CHAINS
          </Link>
          <Link href="/category/anklet" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            ANKLETS
          </Link>
          <Link href="/category/ring" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            RINGS
          </Link>
          <Link href="/category/bracelet" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            BRACELETS
          </Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-stone-700 py-1">
            CONTACT SUPPORT
          </Link>
        </div>
      )}
    </header>
  );
}
