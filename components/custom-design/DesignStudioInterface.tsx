"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wand2,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Gem,
  Scale,
  Edit3,
  History,
} from "lucide-react";
import { Product } from "@/lib/products/data";
import {
  CustomDesignRequest,
  CustomDesignVersion,
  generateCustomRequestId,
  saveCustomDesignRequest,
} from "@/lib/custom-design/data";

interface DesignStudioProps {
  category: "bracelet" | "ring" | "chain" | "anklet";
  baseProduct?: Product;
}

export default function DesignStudioInterface({ category, baseProduct }: DesignStudioProps) {
  // Category Title Formatting
  const categoryTitle = category.toUpperCase();

  // Design Inputs State
  const [material, setMaterial] = useState<"925 Sterling Silver" | "Artificial Jewellery">(
    baseProduct?.collection === "silver" ? "925 Sterling Silver" : "925 Sterling Silver"
  );
  const [style, setStyle] = useState<string>(baseProduct ? "Customized " + baseProduct.name : "Minimalist Elegant");
  const [thickness, setThickness] = useState<string>("Standard (3mm)");
  const [stoneColor, setStoneColor] = useState<string>("Sapphire Blue");
  const [stoneCount, setStoneCount] = useState<number>(3);
  const [charms, setCharms] = useState<string>("Floral Lotus");
  const [size, setSize] = useState<string>("7.5 Inches (Standard)");
  const [engraving, setEngraving] = useState<string>("");
  const [budget, setBudget] = useState<number>(baseProduct?.fixedPrice || 3500);
  const [naturalPrompt, setNaturalPrompt] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState<string>("");

  // Customer Contact Info
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  // Generation & Versioning State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [versions, setVersions] = useState<CustomDesignVersion[]>([]);
  const [activeVersionData, setActiveVersionData] = useState<CustomDesignVersion | null>(null);

  // Submission Status
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Studio Canvas Reference for procedural concept generation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-fill prompt from base product if present
  useEffect(() => {
    if (baseProduct) {
      setNaturalPrompt(
        `Customize existing item '${baseProduct.name}' with custom stone accent and engraved details.`
      );
    }
  }, [baseProduct]);

  // Generate Visual Concept on Canvas
  const drawConceptCanvas = (
    mat: string,
    stColor: string,
    stCount: number,
    ch: string,
    th: string
  ): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "/Delicate Infinity Silver Bracelet.png";

    // Background Studio Lighting Gradient
    const bgGradient = ctx.createRadialGradient(300, 300, 50, 300, 300, 350);
    bgGradient.addColorStop(0, "#F7F5F0");
    bgGradient.addColorStop(1, "#E7E2D6");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 600, 600);

    // Studio Pedestal Circle
    ctx.beginPath();
    ctx.arc(300, 300, 220, 0, Math.PI * 2);
    ctx.fillStyle = "#EFEAE1";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#D8D0C0";
    ctx.stroke();

    // Render Metal Band (Silver vs Gold/Artificial)
    const isSilver = mat.includes("Silver");
    const metalColor = isSilver ? "#E2E8F0" : "#D97706";
    const metalShine = isSilver ? "#FFFFFF" : "#FDE68A";
    const metalDark = isSilver ? "#94A3B8" : "#92400E";

    let bandLineWidth = 8;
    if (th.includes("Delicate")) bandLineWidth = 5;
    if (th.includes("Bold")) bandLineWidth = 14;

    ctx.save();
    ctx.beginPath();
    if (category === "bracelet" || category === "anklet") {
      ctx.arc(300, 300, 140, 0, Math.PI * 2);
    } else if (category === "ring") {
      ctx.arc(300, 300, 100, 0, Math.PI * 2);
    } else {
      // Chain loop
      ctx.ellipse(300, 300, 130, 170, 0, 0, Math.PI * 2);
    }
    ctx.lineWidth = bandLineWidth;
    ctx.strokeStyle = metalColor;
    ctx.stroke();

    // Add Metal Specular Highlight Stroke
    ctx.lineWidth = bandLineWidth / 3;
    ctx.strokeStyle = metalShine;
    ctx.stroke();
    ctx.restore();

    // Render Gemstones
    if (stCount > 0) {
      let stoneFill = "#2563EB"; // Blue
      if (stColor.includes("Green") || stColor.includes("Emerald")) stoneFill = "#059669";
      if (stColor.includes("Red") || stColor.includes("Ruby")) stoneFill = "#DC2626";
      if (stColor.includes("Clear") || stColor.includes("Zircon")) stoneFill = "#F8FAFC";

      const angleStep = (Math.PI * 0.4) / Math.max(1, stCount);
      const startAngle = -Math.PI / 2 - (angleStep * (stCount - 1)) / 2;

      for (let i = 0; i < stCount; i++) {
        const angle = startAngle + i * angleStep;
        const radius = category === "ring" ? 100 : 140;
        const x = 300 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, bandLineWidth + 4, 0, Math.PI * 2);
        ctx.fillStyle = stoneFill;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = metalDark;
        ctx.stroke();

        // Gem Highlight Sparkle
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
      }
    }

    // Render Charm Motif
    if (ch && !ch.includes("None")) {
      const charmY = 300 + (category === "ring" ? 100 : 140) + 20;
      ctx.beginPath();
      ctx.arc(300, charmY, 14, 0, Math.PI * 2);
      ctx.fillStyle = isSilver ? "#CBD5E1" : "#F59E0B";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = metalDark;
      ctx.stroke();
    }

    // Watermark Overlay
    ctx.fillStyle = "rgba(28, 43, 38, 0.6)";
    ctx.font = "bold 12px serif";
    ctx.textAlign = "center";
    ctx.fillText("AYUSH TRADERS • AI DESIGN CONCEPT", 300, 560);

    return canvas.toDataURL("image/png");
  };

  // Natural Language Prompt Parser (Part 13)
  const handleParseNaturalPrompt = () => {
    if (!naturalPrompt.trim()) return;
    const p = naturalPrompt.toLowerCase();

    if (p.includes("silver")) setMaterial("925 Sterling Silver");
    if (p.includes("artificial") || p.includes("kundan") || p.includes("gold")) setMaterial("Artificial Jewellery");

    if (p.includes("thin") || p.includes("delicate")) setThickness("Delicate (2mm)");
    if (p.includes("bold") || p.includes("heavy")) setThickness("Bold (6mm)");

    if (p.includes("blue")) setStoneColor("Sapphire Blue");
    if (p.includes("green") || p.includes("emerald")) setStoneColor("Emerald Green");
    if (p.includes("red") || p.includes("ruby")) setStoneColor("Ruby Red");

    const countMatch = p.match(/(\d+)\s*stone/);
    if (countMatch) setStoneCount(parseInt(countMatch[1], 10));

    const budgetMatch = p.match(/(?:under|around|budget|₹|rs\.?)\s*(\d+[\d,]*)/i);
    if (budgetMatch) {
      const num = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(num) && num > 0) setBudget(num);
    }
  };

  // Generate / Refine Visual Concept (Part 14, 15)
  const handleGenerateDesign = () => {
    handleParseNaturalPrompt();
    setIsGenerating(true);

    setTimeout(() => {
      const dataUrl = drawConceptCanvas(material, stoneColor, stoneCount, charms, thickness);
      const estMin = Math.round(budget * 0.9);
      const estMax = Math.round(budget * 1.15);

      const newVersionNum = versions.length + 1;
      const newVer: CustomDesignVersion = {
        version: newVersionNum,
        imageUrl: dataUrl,
        requirements: {
          material,
          style,
          thickness,
          stones: `${stoneCount} ${stoneColor} Stones`,
          stoneCount,
          stoneColor,
          charms,
          size,
          engraving,
          budget,
          additionalNotes: naturalPrompt,
        },
        aiEstimateMin: estMin,
        aiEstimateMax: estMax,
        createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setVersions([newVer, ...versions]);
      setActiveVersionData(newVer);
      setCurrentVersion(newVersionNum);
      setIsGenerating(false);
    }, 1000);
  };

  // Submit Request to Merchant (Part 20, 21)
  const handleSubmitToMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVersionData) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please provide your Name and Phone Number so our master artisan can send your quote.");
      return;
    }

    const requestId = generateCustomRequestId();
    const newRequest: CustomDesignRequest = {
      id: requestId,
      customerName,
      customerPhone,
      category,
      baseProductId: baseProduct?.id,
      material,
      style,
      thickness,
      stones: `${stoneCount} ${stoneColor} Stones`,
      stoneCount,
      stoneColor,
      charms,
      size,
      engraving,
      budget,
      designDescription: naturalPrompt || `${style} ${category} in ${material}`,
      designImage: activeVersionData.imageUrl,
      currentVersion: activeVersionData.version,
      versions,
      customerNotes,
      aiEstimateMin: activeVersionData.aiEstimateMin,
      aiEstimateMax: activeVersionData.aiEstimateMax,
      status: "UNDER_REVIEW",
      createdAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      updatedAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    };

    saveCustomDesignRequest(newRequest);
    setSubmittedRequestId(requestId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Studio Title */}
      <div className="bg-[#1C2B26] text-white p-8 rounded-3xl space-y-3 border border-stone-800 shadow-xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-[#C9A45C]/20 text-[#C9A45C] border border-[#C9A45C]/40 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            AT ORNAMENTS LUXURY DESIGN WORKSPACE
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide uppercase text-stone-100">
            ✨ {categoryTitle} DESIGN STUDIO
          </h1>
          <p className="font-serif italic text-stone-300 text-sm max-w-2xl">
            {baseProduct
              ? `Customizing base design: ${baseProduct.name}`
              : "Specify your preferences or describe your idea naturally to visualize custom jewellery concept."}
          </p>
        </div>

        {versions.length > 0 && (
          <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs font-semibold flex items-center gap-3">
            <History className="w-4 h-4 text-[#C9A45C]" />
            <span>{versions.length} Version Concept(s) Generated</span>
          </div>
        )}
      </div>

      {/* SUBMISSION CONFIRMATION SCREEN (Part 21) */}
      {submittedRequestId ? (
        <div className="bg-[#EFEAE1] p-8 sm:p-12 rounded-3xl border border-stone-300 shadow-xl max-w-3xl mx-auto text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-800 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
              CUSTOM DESIGN SUBMITTED
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900">
              Request ID: {submittedRequestId}
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto">
              Your custom design concept has been submitted to AT Ornaments master artisans.
            </p>
          </div>

          {/* Timeline Process */}
          <div className="p-6 rounded-2xl bg-white border border-stone-300 text-left space-y-4 text-xs">
            <h4 className="font-serif font-bold uppercase text-stone-900 tracking-wider">
              Feasibility & Quote Process Timeline:
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold uppercase">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                1. SUBMITTED ✓
              </div>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                2. REVIEWING
              </div>
              <div className="p-2 rounded-xl bg-stone-100 text-stone-500">
                3. DECISION
              </div>
              <div className="p-2 rounded-xl bg-stone-100 text-stone-500">
                4. QUOTE
              </div>
              <div className="p-2 rounded-xl bg-stone-100 text-stone-500">
                5. APPROVAL
              </div>
              <div className="p-2 rounded-xl bg-stone-100 text-stone-500">
                6. ORDER
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href={`/custom-design/status/${submittedRequestId}`}
              className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-md flex items-center gap-2"
            >
              <span>Track Request Status</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setSubmittedRequestId(null);
                setVersions([]);
                setActiveVersionData(null);
              }}
              className="bg-white border border-stone-300 hover:bg-stone-200 text-stone-800 font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl"
            >
              Design Another Item
            </button>
          </div>
        </div>
      ) : (
        /* DESIGN STUDIO MAIN WORKSPACE (Desktop: Left Controls, Right Preview) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: CONTROL INPUTS (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Natural Language Prompt Input (Part 13) */}
            <div className="bg-[#EFEAE1] p-6 rounded-3xl border border-stone-300 space-y-3 shadow-xs">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#1C2B26]" />
                <span>Describe Your Idea Naturally</span>
              </label>

              <textarea
                rows={3}
                placeholder="e.g. 'I want a delicate silver bracelet with three small blue stones and a tiny floral charm under ₹3,500'"
                value={naturalPrompt}
                onChange={(e) => setNaturalPrompt(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-[#1C2B26]"
              />

              <button
                type="button"
                onClick={handleGenerateDesign}
                disabled={isGenerating}
                className="w-full bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C9A45C] animate-spin" />
                    <span>GENERATING VISUAL CONCEPT...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-[#C9A45C]" />
                    <span>{versions.length > 0 ? "RE-GENERATE / UPDATE CONCEPT" : "GENERATE DESIGN CONCEPT"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Category-Specific Fine Controls */}
            <div className="bg-[#EFEAE1] p-6 rounded-3xl border border-stone-300 space-y-5 text-xs">
              <h3 className="font-serif font-bold text-stone-900 text-sm uppercase border-b border-stone-300 pb-2">
                Fine Design Controls
              </h3>

              {/* Material & Collection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value as any)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="925 Sterling Silver">925 Sterling Silver</option>
                    <option value="Artificial Jewellery">Artificial Jewellery</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Style Profile</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Minimalist Elegant">Minimalist Elegant</option>
                    <option value="Traditional Ethnic">Traditional Ethnic</option>
                    <option value="Modern Chic">Modern Chic</option>
                    <option value="Royal Floral">Royal Floral</option>
                  </select>
                </div>
              </div>

              {/* Thickness / Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Thickness / Profile</label>
                  <select
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Delicate (2mm)">Delicate (2mm)</option>
                    <option value="Standard (3.5mm)">Standard (3.5mm)</option>
                    <option value="Bold (6mm)">Bold (6mm)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Size Option</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="7.5 Inches (Standard)">7.5 Inches (Standard)</option>
                    <option value="8.0 Inches">8.0 Inches</option>
                    <option value="Adjustable Free Size">Adjustable Free Size</option>
                  </select>
                </div>
              </div>

              {/* Stones & Colors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Stone Color</label>
                  <select
                    value={stoneColor}
                    onChange={(e) => setStoneColor(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Sapphire Blue">Sapphire Blue</option>
                    <option value="Emerald Green">Emerald Green</option>
                    <option value="Ruby Red">Ruby Red</option>
                    <option value="Clear Zircon">Clear Zircon</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Stone Count</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={stoneCount}
                    onChange={(e) => setStoneCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Charms</label>
                  <select
                    value={charms}
                    onChange={(e) => setCharms(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Floral Lotus">Floral Lotus</option>
                    <option value="Heart Charm">Heart Charm</option>
                    <option value="Coin Medallion">Coin Medallion</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              {/* Target Budget */}
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Target Budget Limit (₹)
                </label>
                <input
                  type="number"
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value, 10) || 3000)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 font-extrabold text-sm"
                />
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: CONCEPT PREVIEW & MERCHANT SUBMISSION (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {activeVersionData ? (
              <div className="bg-[#EFEAE1] p-6 rounded-3xl border border-stone-300 space-y-5 shadow-lg">
                
                <div className="flex items-center justify-between border-b border-stone-300 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C2B26] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
                    AI-GENERATED DESIGN CONCEPT
                  </span>
                  <span className="text-[10px] font-bold bg-[#1C2B26] text-white px-2.5 py-0.5 rounded-full">
                    VERSION #{activeVersionData.version}
                  </span>
                </div>

                {/* Concept Visual Canvas Image (Part 14) */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-stone-300 shadow-md">
                  <img
                    src={activeVersionData.imageUrl}
                    alt="AI Generated Design Concept"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-3 left-3 bg-[#1C2B26]/90 text-stone-200 text-[9px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                    Concept visualization only
                  </span>
                </div>

                {/* Disclaimer (Part 14 & 19) */}
                <div className="p-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-[11px] text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Feasibility Notice:</strong> Concept visualization only — final manufacturing feasibility is determined by AT Ornaments master artisans.
                  </span>
                </div>

                {/* Preliminary Price Estimate (Part 18) */}
                <div className="p-4 rounded-2xl bg-white border border-stone-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block">
                    PRELIMINARY AI ESTIMATE RANGE
                  </span>
                  <span className="text-2xl font-extrabold text-[#1C2B26]">
                    ₹{activeVersionData.aiEstimateMin.toLocaleString("en-IN")} – ₹{activeVersionData.aiEstimateMax.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[10px] text-stone-500">
                    Final price depends on actual material weight, workmanship & merchant quote.
                  </p>
                </div>

                {/* Submission Form to Merchant (Part 20) */}
                <form onSubmit={handleSubmitToMerchant} className="space-y-4 pt-2 border-t border-stone-300 text-xs">
                  <h4 className="font-serif font-bold text-stone-900 text-xs uppercase">
                    Submit Concept to Merchant for Quote
                  </h4>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Phone Number (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Customer Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions for the artisan..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1C2B26] hover:bg-stone-800 text-white font-extrabold text-xs tracking-widest uppercase py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4 text-[#C9A45C]" />
                    <span>SEND DESIGN TO AT ORNAMENTS</span>
                  </button>
                </form>

              </div>
            ) : (
              <div className="bg-[#EFEAE1] p-10 rounded-3xl border border-stone-300 text-center space-y-4">
                <Wand2 className="w-12 h-12 text-stone-400 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-stone-800">
                  Ready to Visualize Your Concept?
                </h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto">
                  Click <strong>"Generate Design Concept"</strong> to render a visual preview of your custom {category}.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
