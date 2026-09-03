"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { fetchOrdersFromSupabase } from "@/lib/supabase/orders";
import { formatInvoiceNumber, downloadInvoicePdf } from "@/lib/pdf/invoiceGenerator";
import { AT_LOGO_BASE64 } from "@/lib/pdf/logoBase64";

function InvoiceContent({ params }: { params: { orderId: string } }) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [gstin, setGstin] = useState<string>("09AAAAA0000A1Z5");
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);

  const rawId = params?.orderId || searchParams?.get("orderId") || "8492";

  useEffect(() => {
    async function loadInvoiceData() {
      setLoading(true);

      if (typeof window !== "undefined") {
        const savedGstin = localStorage.getItem("at_gstin");
        if (savedGstin) setGstin(savedGstin);
      }

      // Try fetching live order from Supabase first
      const sbOrders = await fetchOrdersFromSupabase();
      if (sbOrders) {
        const found = sbOrders.find(
          (o) =>
            o.rawId === rawId ||
            o.orderId === rawId ||
            o.orderId === `#${rawId}` ||
            o.orderId.replace("#", "") === rawId.replace("#", "")
        );
        if (found) {
          setOrder(found);
          setLoading(false);
          return;
        }
      }

      // Fallback to local storage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("at_latest_order");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (
              parsed.rawId === rawId ||
              parsed.orderId === rawId ||
              parsed.orderId === `#${rawId}` ||
              parsed.orderId?.replace("#", "") === rawId.replace("#", "")
            ) {
              setOrder(parsed);
            }
          } catch (e) {}
        }
      }
      setLoading(false);
    }

    loadInvoiceData();
  }, [rawId]);

  const displayOrderId = order?.orderId || `#ATO-${rawId.replace("ATO-", "")}`;
  const invoiceNumber = formatInvoiceNumber(rawId, order?.date);
  const invoiceDate = order?.date
    ? new Date(order.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const customer = order?.customer || {
    fullName: "Valued Customer",
    address: "Main Market Road",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    phone: "+91 98765 43210",
  };

  const items = order?.items || [
    {
      id: "at-c101",
      name: "Classic 925 Silver Chain Necklace",
      price: 1643.75,
      quantity: 1,
      image: "/Classic 925 Silver Chain Necklace.png",
      weight: 12.5,
      selectedSize: "18 Inches",
    },
  ];

  const grandTotal = order?.total || items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const taxableValue = Math.round((grandTotal / 1.03) * 100) / 100; // 3% GST included
  const totalGst = Math.round((grandTotal - taxableValue) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst - cgst) * 100) / 100;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    const cleanFileName = `AT_Invoice_${invoiceNumber.replace(/\//g, "_")}.pdf`;
    await downloadInvoicePdf("gst-invoice-document", cleanFileName);
    setDownloading(false);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-xs font-bold uppercase tracking-widest text-stone-600">
        Retrieving GST Invoice...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-900 font-sans p-4 sm:p-8 print:bg-white print:p-0">
      
      {/* Top Action Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/account"
          className="flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-4 py-2.5 rounded-xl border border-stone-300 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 bg-[#1C2B26] hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-98"
          >
            <Download className="w-4 h-4 text-[#C9A45C]" />
            <span>{downloading ? "Generating PDF..." : "Download Official GST PDF Invoice"}</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Card */}
      <div
        id="gst-invoice-document"
        className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-stone-200 print:shadow-none print:border-none print:p-4 print:rounded-none"
      >
        
        {/* Header Branding & GST Metadata */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-stone-300 pb-8">
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              {/* Using embedded base64 image tag so html2canvas renders it 100% reliably without disappearing */}
              <img
                src={AT_LOGO_BASE64}
                alt="Ayush Traders Ornaments Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="flex flex-col text-stone-900 leading-tight">
              <h1 className="font-serif text-2xl font-bold tracking-wider uppercase text-[#1C2B26]">
                AYUSH TRADERS
              </h1>
              <span className="text-[10px] tracking-[0.2em] font-semibold text-stone-600 uppercase mt-0.5">
                ORNAMENTS • EST. 2006
              </span>
              <span className="text-[10px] text-stone-500 font-medium mt-1">
                GSTIN: {gstin} | HSN Code: 7113 | State: Uttar Pradesh (09)
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-stone-700 space-y-1">
            <span className="bg-[#1C2B26] text-[#C9A45C] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-1 shadow-xs">
              TAX INVOICE
            </span>
            <p className="font-bold text-stone-900 text-sm">Invoice No: {invoiceNumber}</p>
            <p>Invoice Date: {invoiceDate}</p>
            <p className="font-semibold text-stone-800">Order ID: {displayOrderId}</p>
            {order?.silverRateAtPurchase && (
              <p className="text-[10px] text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                Silver Rate Locked: ₹{order.silverRateAtPurchase}/g
              </p>
            )}
          </div>

        </div>

        {/* Addresses 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-stone-200 text-xs">
          
          {/* Supplier Address */}
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
              SUPPLIER / STORE ADDRESS
            </span>
            <p className="font-bold text-stone-900 text-sm">Ayush Traders Ornaments</p>
            <p className="text-stone-600">Main Market, Retail & Wholesale Division</p>
            <p className="text-stone-600">Lucknow, Uttar Pradesh, India - 226001</p>
            <p className="text-stone-600 font-medium pt-1">Phone: +91 98765 43210 | support@atornaments.in</p>
          </div>

          {/* Customer Billed & Shipped To */}
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
              BILLED & SHIPPED TO
            </span>
            <p className="font-bold text-stone-900 text-sm">{customer.fullName}</p>
            <p className="text-stone-600">{customer.address}</p>
            <p className="text-stone-600">{customer.city}, {customer.state} - {customer.pincode}</p>
            <p className="text-stone-600 font-medium pt-1">
              Phone: {customer.phone} {customer.email ? `| Email: ${customer.email}` : ""}
            </p>
          </div>

        </div>

        {/* Payment & Order Status Metadata */}
        <div className="py-3 px-4 bg-[#F7F5F0] rounded-xl my-4 flex items-center justify-between text-xs font-semibold text-stone-800 border border-stone-200">
          <div>
            <span className="text-stone-500 text-[10px] uppercase font-bold block">Payment Mode</span>
            <span>{order?.paymentMethod || order?.paymentStatus || "Razorpay Prepaid"}</span>
          </div>

          <div>
            <span className="text-stone-500 text-[10px] uppercase font-bold block">Payment Status</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              (order?.paymentStatus || "").includes("Paid")
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}>
              {order?.paymentStatus || "Paid"}
            </span>
          </div>

          <div>
            <span className="text-stone-500 text-[10px] uppercase font-bold block">Fulfillment Status</span>
            <span className="font-bold text-stone-900">{order?.orderStatus || order?.status || "Order Confirmed"}</span>
          </div>
        </div>

        {/* Itemized Product Table */}
        <div className="py-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F5F0] border-y border-stone-300 text-stone-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Sl No.</th>
                <th className="py-3 px-3">Description of Goods</th>
                <th className="py-3 px-3 text-center">HSN</th>
                <th className="py-3 px-3 text-center">Silver Weight</th>
                <th className="py-3 px-3 text-center">Purity</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price (₹)</th>
                <th className="py-3 px-3 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              {items.map((item: any, idx: number) => {
                const itemPrice = typeof item.price === "number" ? item.price : parseFloat(item.price || 0);
                const lineTotal = itemPrice * item.quantity;
                return (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="py-3.5 px-3 font-semibold text-stone-500">{idx + 1}</td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-stone-900 block">{item.name}</span>
                      <span className="text-[10px] text-stone-500">
                        {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}SKU: {item.id || item.productId || `AT-${idx + 101}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-stone-600">7113</td>
                    <td className="py-3.5 px-3 text-center font-semibold">{item.weight ? `${item.weight}g` : "N/A"}</td>
                    <td className="py-3.5 px-3 text-center font-medium">925 Sterling</td>
                    <td className="py-3.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3.5 px-3 text-right font-medium">₹{itemPrice.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-3 text-right font-bold">₹{lineTotal.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
              
              {order?.freeGiftUnlocked && (
                <tr className="bg-emerald-50/50">
                  <td className="py-3 px-3 font-semibold text-stone-500">{items.length + 1}</td>
                  <td className="py-3 px-3 font-bold text-emerald-900">
                    Free Silver Polishing Cloth & Gift Box (Complimentary)
                  </td>
                  <td className="py-3 px-3 text-center text-stone-500">7113</td>
                  <td className="py-3 px-3 text-center font-semibold">—</td>
                  <td className="py-3 px-3 text-center font-medium">—</td>
                  <td className="py-3 px-3 text-center font-bold">1</td>
                  <td className="py-3 px-3 text-right">₹0</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-900">₹0 (Included)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GST Tax Breakdown & Totals */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-t border-stone-300 pt-6 text-xs">
          
          <div className="text-stone-600 space-y-1 max-w-xs">
            <p className="font-bold text-stone-900 uppercase text-[10px] tracking-wider">
              GST Tax Calculation Summary (HSN 7113)
            </p>
            <p>Taxable Value: ₹{taxableValue.toLocaleString("en-IN")}</p>
            <p>CGST @ 1.5%: ₹{cgst.toLocaleString("en-IN")}</p>
            <p>SGST @ 1.5%: ₹{sgst.toLocaleString("en-IN")}</p>
            <p className="font-semibold text-stone-800">Total GST (3% Rate): ₹{totalGst.toLocaleString("en-IN")}</p>
          </div>

          <div className="w-full sm:w-72 bg-[#F7F5F0] p-4 rounded-xl border border-stone-300 space-y-2 text-right">
            <div className="flex justify-between text-stone-700">
              <span>Subtotal</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Express Shipping</span>
              <span className="text-emerald-800 font-bold">FREE (₹0)</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-stone-900 border-t border-stone-300 pt-2">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

        </div>

        {/* Footer Declaration */}
        <div className="mt-10 pt-6 border-t border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#1C2B26]" />
            <span>This is an official computer-generated GST tax invoice for AT Ornaments.</span>
          </div>
          <p>© Ayush Traders Ornaments • EST. 2006</p>
        </div>

      </div>

    </div>
  );
}

export default function InvoicePage({ params }: { params: { orderId: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-xs font-bold uppercase tracking-widest">
        Generating GST Tax Invoice...
      </div>
    }>
      <InvoiceContent params={params} />
    </Suspense>
  );
}
