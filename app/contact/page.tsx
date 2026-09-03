"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Truck,
  Gift,
  ShieldCheck,
  Award,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderId: "",
    phone: "",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", orderId: "", phone: "", message: "" });
    }, 5000);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900 font-sans">
      <MarqueeBar />
      <Navbar />

      {/* Hero Banner with Backdrop Image */}
      <section className="relative bg-[#EFEAE1] border-b border-stone-200 py-12 sm:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
          
          {/* Left Title Content */}
          <div className="lg:col-span-7 space-y-3 z-10">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C2B26] tracking-tight">
              Contact & Support
            </h1>
            
            {/* Decorative Gold Accent Underline */}
            <div className="flex items-center gap-2 text-[#C9A45C]">
              <span className="h-[1.5px] w-10 bg-[#C9A45C]"></span>
              <span className="text-xs">◆</span>
              <span className="h-[1.5px] w-10 bg-[#C9A45C]"></span>
            </div>

            <p className="text-stone-600 text-sm sm:text-base max-w-lg leading-relaxed pt-1">
              We're here to help you with anything you need. Reach out to us and we'll get back to you as soon as possible.
            </p>
          </div>

          {/* Right Backdrop Jewellery Image */}
          <div className="lg:col-span-5 relative h-48 sm:h-64 lg:h-72 rounded-2xl overflow-hidden shadow-lg border border-stone-300">
            <img
              src="/Ayush Traders Jewelry Hero Banner.png"
              alt="Ayush Traders Fine Jewellery Collection"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EFEAE1] via-transparent to-transparent opacity-80 lg:opacity-40"></div>
          </div>

        </div>
      </section>

      {/* Main Support Section (2-Column Grid) */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Get in Touch Card */}
          <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-md space-y-6">
            
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Get in Touch
            </h2>

            <div className="space-y-6">
              
              {/* Item 1: Phone */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-[#1C2B26] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Phone className="w-5 h-5 text-[#C9A45C]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Phone</h4>
                  <p className="text-xs font-bold text-stone-800">+91 12345 67890</p>
                  <p className="text-[11px] text-stone-500 font-medium">Mon – Sat | 10 AM – 7 PM</p>
                </div>
              </div>

              {/* Item 2: Email */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-[#1C2B26] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Mail className="w-5 h-5 text-[#C9A45C]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Email</h4>
                  <a href="mailto:support@ayushtraders.com" className="text-xs font-bold text-stone-800 hover:text-[#C9A45C]">
                    support@ayushtraders.com
                  </a>
                  <p className="text-[11px] text-stone-500 font-medium">We reply within 24 hours</p>
                </div>
              </div>

              {/* Item 3: Address */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-[#1C2B26] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <MapPin className="w-5 h-5 text-[#C9A45C]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Address</h4>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">
                    Ayush Traders (AT Ornaments)<br />
                    123, Silver Street, Jaipur,<br />
                    Rajasthan – 302001, India
                  </p>
                </div>
              </div>

              {/* Item 4: Business Hours */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-[#1C2B26] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Clock className="w-5 h-5 text-[#C9A45C]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">Business Hours</h4>
                  <p className="text-xs font-semibold text-stone-800">Mon – Sat: 10 AM – 7 PM</p>
                  <p className="text-[11px] text-stone-500 font-medium">Sunday: Closed</p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Send Us a Message Form & Immediate Help Box */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-md">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Form Section */}
              <div className="md:col-span-8 space-y-6">
                
                <div className="space-y-1">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                    Send Us a Message
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Have a question or need help? Fill out the form and we'll get back to you.
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto" />
                    <h4 className="font-serif text-xl font-bold text-emerald-900">Message Received!</h4>
                    <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                      Thank you for reaching out to Ayush Traders. Our team will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    
                    {/* Row 1: Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-[#F7F5F0]/60 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:border-[#1C2B26]"
                        />
                      </div>

                      <div>
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-[#F7F5F0]/60 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:border-[#1C2B26]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Order ID & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Order ID (Optional)"
                          value={formData.orderId}
                          onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                          className="w-full bg-[#F7F5F0]/60 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:border-[#1C2B26]"
                        />
                      </div>

                      <div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-[#F7F5F0]/60 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:border-[#1C2B26]"
                        />
                      </div>
                    </div>

                    {/* Row 3: Message Textarea */}
                    <div>
                      <textarea
                        required
                        rows={5}
                        placeholder="Message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-[#F7F5F0]/60 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:bg-white focus:border-[#1C2B26]"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-98"
                    >
                      <span>SEND MESSAGE</span>
                      <ArrowRight className="w-4 h-4 text-[#C9A45C]" />
                    </button>

                  </form>
                )}

              </div>

              {/* Side Immediate Help Callout Box */}
              <div className="md:col-span-4 bg-[#F7F5F0]/70 p-6 rounded-2xl border border-stone-200 flex flex-col items-center text-center space-y-4 mt-2 md:mt-0">
                <div className="w-14 h-14 rounded-full bg-[#EFEAE1] border border-stone-300 flex items-center justify-center text-[#1C2B26] shadow-xs">
                  <Headphones className="w-7 h-7 stroke-[1.5]" />
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="font-serif text-base font-bold text-stone-900">
                    Need Immediate Help?
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    For faster assistance with orders, shipping, or returns, please call us directly.
                  </p>
                </div>

                <a
                  href="tel:+911234567890"
                  className="w-full bg-white hover:bg-stone-100 text-[#1C2B26] border border-[#C9A45C] font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>CALL NOW</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A45C]" />
                </a>
              </div>

            </div>

          </div>

        </div>

        {/* Bottom Feature Strip Card (Matching Mockup 1) */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            
            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4 first:pt-0">
              <div className="p-3 rounded-2xl bg-[#F7F5F0] text-[#C9A45C] flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-stone-900 uppercase">FREE SHIPPING</h4>
                <p className="text-[11px] text-stone-500">On all orders above ₹0</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4">
              <div className="p-3 rounded-2xl bg-[#F7F5F0] text-[#C9A45C] flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-stone-900 uppercase">FREE SURPRISE GIFT</h4>
                <p className="text-[11px] text-stone-500">On orders above ₹499</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4">
              <div className="p-3 rounded-2xl bg-[#F7F5F0] text-[#C9A45C] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-stone-900 uppercase">SECURE PAYMENT</h4>
                <p className="text-[11px] text-stone-500">100% safe & secure</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-4 md:pt-0 md:px-4">
              <div className="p-3 rounded-2xl bg-[#F7F5F0] text-[#C9A45C] flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-stone-900 uppercase">100% HALLMARK SILVER</h4>
                <p className="text-[11px] text-stone-500">Authentic & certified</p>
              </div>
            </div>

          </div>
        </div>

      </section>

      <Footer />
    </main>
  );
}
