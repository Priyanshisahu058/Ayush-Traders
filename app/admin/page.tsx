"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Check,
  RefreshCw,
  Edit3,
  Plus,
  Trash2,
  X,
  Sparkles,
  Gem,
  Save,
  Search,
  RotateCcw,
  Truck,
  CheckCircle2,
  Users,
  FileText,
  ShieldCheck,
  Lock,
  LogOut,
  AlertTriangle,
  RotateCcw as ReturnIcon,
  Video,
  Image as ImageIcon,
  Upload,
  Layers,
  ArrowLeft,
  XCircle,
  FileCheck,
  Download,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Footer from "@/components/layout/Footer";
import { ALL_PRODUCTS, Product, TODAY_SILVER_RATE_PER_GRAM, getEffectiveProducts, clearProductCache } from "@/lib/products/data";
import { fetchProductsFromSupabase, upsertProductToSupabase, seedAll48ProductsToSupabase } from "@/lib/supabase/products";
import { fetchOrdersFromSupabase, updateOrderStatusInSupabase } from "@/lib/supabase/orders";
import { fetchSilverRateFromSupabase, updateSilverRateInSupabase } from "@/lib/supabase/rate";
import { fetchCustomDesignRequestsFromSupabase } from "@/lib/supabase/customDesign";
import { computeProductPrice } from "@/lib/pricing/computePrice";
import { uploadProductImageToSupabase } from "@/lib/supabase/storage";
import { CustomDesignRequest, getCustomDesignRequests, saveCustomDesignRequest } from "@/lib/custom-design/data";

const DEFAULT_ADMIN_ORDERS = [
  {
    orderId: "#ATO-8492",
    rawId: "ATO-8492",
    date: "15 Aug 2026",
    customer: {
      fullName: "Ananya Roy",
      email: "ananya.roy@example.com",
      phone: "+91 98765 43210",
      city: "Lucknow",
      state: "Uttar Pradesh",
      address: "Main Market Road, Sector 4",
      pincode: "226001",
    },
    items: [
      {
        id: "at-a201",
        name: "Silver Charm Payal Anklet Pair",
        price: 1890,
        quantity: 1,
        image: "/Silver Charm Payal Anklet Pair.png",
        selectedSize: "9.5 Inches (Standard)",
      },
    ],
    total: 1890,
    freeGiftUnlocked: true,
    currentStageIndex: 2,
    courier: "Shiprocket Express",
    awb: "AWB849201",
    paymentStatus: "Paid Online",
    dispatchDate: "16 Aug 2026",
  },
  {
    orderId: "#ATO-3109",
    rawId: "ATO-3109",
    date: "02 Jul 2026",
    customer: {
      fullName: "Priya Sharma",
      email: "priya.sharma@example.com",
      phone: "+91 98123 45678",
      city: "Noida",
      state: "Uttar Pradesh",
      address: "Express Highway Complex",
      pincode: "201301",
    },
    items: [
      {
        id: "at-b401",
        name: "Delicate Infinity Silver Bracelet",
        price: 3200,
        quantity: 1,
        image: "/Delicate Infinity Silver Bracelet.png",
      },
    ],
    total: 3200,
    freeGiftUnlocked: true,
    currentStageIndex: 4,
    courier: "Delhivery Surface",
    awb: "AWB310988",
    paymentStatus: "Paid Online",
    dispatchDate: "03 Jul 2026",
  },
];

const STAGE_LABELS = [
  "Order Confirmed",
  "Packed",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

export default function AdminDashboardPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Silver Rate State
  const [silverRate, setSilverRate] = useState<number>(TODAY_SILVER_RATE_PER_GRAM);
  const [newSilverRate, setNewSilverRate] = useState<string>(TODAY_SILVER_RATE_PER_GRAM.toString());
  const [rateLastUpdated, setRateLastUpdated] = useState<string>("18 Aug 2026, 12:00 AM");
  const [rateSaved, setRateSaved] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "orders" | "rate" | "customers" | "gst" | "returns" | "custom_design">("overview");

  // Catalog State
  const [productsList, setProductsList] = useState<Product[]>(ALL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>("all");

  // Orders State
  const [ordersList, setOrdersList] = useState<any[]>(DEFAULT_ADMIN_ORDERS);

  // Custom Design Requests State
  const [customRequestsList, setCustomRequestsList] = useState<CustomDesignRequest[]>([]);
  const [reviewingCustomRequest, setReviewingCustomRequest] = useState<CustomDesignRequest | null>(null);

  // Merchant Approval Form State
  const [finalWeightGrams, setFinalWeightGrams] = useState<number>(8.5);
  const [makingCharge, setMakingCharge] = useState<number>(500);
  const [finalPrice, setFinalPrice] = useState<number>(3250);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);
  const [merchantNotes, setMerchantNotes] = useState<string>("Design approved with minor structural adjustment for durability.");

  // GST Config State
  const [gstin, setGstin] = useState<string>("Pending Verification (Configurable in Admin)");
  const [gstSaved, setGstSaved] = useState(false);

  // Modal State for Editing / Creating Products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("at_admin_session");
      if (session === "true") setIsAuthenticated(true);

      const savedRate = localStorage.getItem("at_silver_rate");
      if (savedRate) {
        const parsed = parseFloat(savedRate);
        if (!isNaN(parsed) && parsed > 0) {
          setSilverRate(parsed);
          setNewSilverRate(parsed.toString());
        }
      }
      const savedTime = localStorage.getItem("at_silver_rate_time");
      if (savedTime) setRateLastUpdated(savedTime);

      const savedGstin = localStorage.getItem("at_gstin");
      if (savedGstin) setGstin(savedGstin);

      const effective = getEffectiveProducts();
      setProductsList(effective);

      const customReqs = getCustomDesignRequests();
      setCustomRequestsList(customReqs);

      const savedOrders = localStorage.getItem("at_admin_orders");
      if (savedOrders) {
        try {
          const parsedOrders = JSON.parse(savedOrders);
          if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
            setOrdersList(parsedOrders);
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Supabase Async Hydration
      fetchProductsFromSupabase().then((sbProducts) => {
        if (sbProducts && sbProducts.length > 0) {
          setProductsList(sbProducts);
        }
      });

      fetchOrdersFromSupabase().then((sbOrders) => {
        if (sbOrders && sbOrders.length > 0) {
          setOrdersList(sbOrders);
        }
      });

      fetchSilverRateFromSupabase().then((sbRate) => {
        if (sbRate && sbRate > 0) {
          setSilverRate(sbRate);
          setNewSilverRate(sbRate.toString());
        }
      });

      fetchCustomDesignRequestsFromSupabase().then((sbCustomReqs) => {
        if (sbCustomReqs && sbCustomReqs.length > 0) {
          setCustomRequestsList(sbCustomReqs);
        }
      });
    }
  }, []);

  // AI Payment Intelligence Analytics State
  const [paymentMetrics, setPaymentMetrics] = useState<{
    totalAttempts: number;
    successfulPayments: number;
    failedPayments: number;
    successRate: number;
    mostCommonFailure: string;
    recoveredCount: number;
    recoveryRate: number;
    aiSummary: string;
  } | null>(null);

  // AI Stylist Usage Analytics State (Database-Backed)
  const [stylistMetrics, setStylistMetrics] = useState<{
    totalSessions: number;
    recommendationsGenerated: number;
    clarificationsAsked: number;
    refinementRequests: number;
    clickedProductsCount: number;
  }>({
    totalSessions: 0,
    recommendationsGenerated: 0,
    clarificationsAsked: 0,
    refinementRequests: 0,
    clickedProductsCount: 0,
  });

  // AI Checkout Recovery Agent State (Database-Backed)
  const [recoveryMetrics, setRecoveryMetrics] = useState<{
    metrics: {
      totalOpportunities: number;
      cartAbandonments: number;
      paymentFailures: number;
      revenueAtRisk: number;
      recoveryAttempts: number;
      successfulRecoveries: number;
      revenueRecovered: number;
      recoveryRate: number;
      topReason: string;
      topAction: string;
    };
    opportunities: any[];
  }>({
    metrics: {
      totalOpportunities: 0,
      cartAbandonments: 0,
      paymentFailures: 0,
      revenueAtRisk: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      revenueRecovered: 0,
      recoveryRate: 0,
      topReason: "No failure data",
      topAction: "no_action",
    },
    opportunities: [],
  });

  // AI Commerce Intelligence Unified Metrics State
  const [commerceMetrics, setCommerceMetrics] = useState<any>(null);
  const [selectedOpportunityTrace, setSelectedOpportunityTrace] = useState<any>(null);

  // API Loading and Error States
  const [loadingAiMetrics, setLoadingAiMetrics] = useState<boolean>(true);
  const [aiMetricsError, setAiMetricsError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingAiMetrics(true);
    setAiMetricsError(null);

    Promise.allSettled([
      fetch("/api/payment-intelligence/admin-insights").then((res) => res.json()),
      fetch("/api/checkout-recovery/admin-metrics").then((res) => res.json()),
      fetch("/api/analytics/commerce").then((res) => res.json()),
      fetch("/api/stylist/metrics").then((res) => res.json()),
    ])
      .then(([payRes, recRes, comRes, styRes]) => {
        if (payRes.status === "fulfilled" && payRes.value.success && payRes.value.metrics) {
          setPaymentMetrics(payRes.value.metrics);
        }
        if (recRes.status === "fulfilled" && recRes.value.success && recRes.value.metrics) {
          setRecoveryMetrics({
            metrics: recRes.value.metrics,
            opportunities: recRes.value.opportunities || [],
          });
        }
        if (comRes.status === "fulfilled" && comRes.value.success && comRes.value.metrics) {
          setCommerceMetrics(comRes.value.metrics);
        }
        if (styRes.status === "fulfilled" && styRes.value.success && styRes.value.metrics) {
          setStylistMetrics(styRes.value.metrics);
        }
      })
      .catch((err) => {
        console.error("Error loading Admin AI metrics:", err);
        setAiMetricsError("Failed to connect to AI analytics backend.");
      })
      .finally(() => {
        setLoadingAiMetrics(false);
      });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if ((loginUsername === "admin" || loginUsername === "ayushtraders") && (loginPasscode === "ayush2026" || loginPasscode === "admin123")) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("at_admin_session", "true");
      }
    } else {
      setLoginError("Invalid Admin Username or Passcode. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("at_admin_session");
    }
  };

  const saveProductsToStorage = async (updated: Product[]) => {
    // Process any base64 images into Supabase Storage URLs
    const processedProducts = await Promise.all(
      updated.map(async (prod) => {
        const updatedImages = await Promise.all(
          (prod.images || []).map(async (img) => {
            if (typeof img === "string" && img.startsWith("data:")) {
              const { url } = await uploadProductImageToSupabase(img, prod.id);
              return url || img;
            }
            return img;
          })
        );
        return { ...prod, images: updatedImages };
      })
    );

    setProductsList(processedProducts);
    clearProductCache();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("at_custom_products", JSON.stringify(processedProducts));
      } catch (err) {
        console.warn("LocalStorage quota exceeded, product state saved in memory & Supabase:", err);
      }
    }
    setSaveSuccessMsg("Catalog updated successfully!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);

    // Sync updated products to Supabase
    processedProducts.forEach((p) => {
      upsertProductToSupabase(p).catch(() => {});
    });
  };

  const saveOrdersToStorage = (updatedOrders: any[]) => {
    setOrdersList(updatedOrders);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("at_admin_orders", JSON.stringify(updatedOrders));
      } catch (err) {
        console.warn("LocalStorage quota exceeded for orders state:", err);
      }
    }
    setSaveSuccessMsg("Order status updated successfully!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleToggleStockStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = productsList.map((p) =>
      p.id === id ? { ...p, inStock: !p.inStock } : p
    );
    saveProductsToStorage(updated);
  };

  const handleUpdateSilverRate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newSilverRate);
    if (isNaN(val) || val <= 0) return;

    const nowStr = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setSilverRate(val);
    setRateLastUpdated(nowStr);

    if (typeof window !== "undefined") {
      localStorage.setItem("at_silver_rate", val.toString());
      localStorage.setItem("at_silver_rate_time", nowStr);
    }

    updateSilverRateInSupabase(val).catch((err) => console.warn("Supabase rate update:", err));

    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2500);
  };

  const handleSaveGstin = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("at_gstin", gstin);
    }
    setGstSaved(true);
    setTimeout(() => setGstSaved(false), 2500);
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updated: Product[];
    if (isCreatingNew) {
      updated = [editingProduct, ...productsList];
    } else {
      updated = productsList.map((p) => (p.id === editingProduct.id ? editingProduct : p));
    }

    saveProductsToStorage(updated);
    setEditingProduct(null);
    setIsCreatingNew(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product from the catalog?")) {
      const updated = productsList.filter((p) => p.id !== id);
      saveProductsToStorage(updated);
    }
  };

  const handleChangeOrderStatus = (orderRawId: string, stageIndex: number) => {
    const updated = ordersList.map((ord) => {
      if (ord.rawId === orderRawId || ord.orderId.includes(orderRawId)) {
        return { ...ord, currentStageIndex: stageIndex };
      }
      return ord;
    });
    saveOrdersToStorage(updated);
    updateOrderStatusInSupabase(orderRawId, stageIndex).catch(() => {});
  };

  const handleApproveCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingCustomRequest) return;

    const updated: CustomDesignRequest = {
      ...reviewingCustomRequest,
      merchantDecision: "APPROVED",
      merchantNotes,
      finalWeightGrams,
      makingCharge,
      finalPrice,
      estimatedCompletionDays: estimatedDays,
      status: "QUOTE_SENT",
      updatedAt: new Date().toLocaleString("en-IN"),
    };

    saveCustomDesignRequest(updated);
    setCustomRequestsList(getCustomDesignRequests());
    setReviewingCustomRequest(null);
    setSaveSuccessMsg(`Custom Request ${updated.id} Approved & Quote Sent to Customer!`);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const handleRejectCustomRequest = () => {
    if (!reviewingCustomRequest) return;
    const reason = prompt("Reason for rejection (e.g. 'Requested structure cannot be manufactured at this thickness'):");
    if (!reason) return;

    const updated: CustomDesignRequest = {
      ...reviewingCustomRequest,
      merchantDecision: "REJECTED",
      merchantNotes: reason,
      status: "REJECTED",
      updatedAt: new Date().toLocaleString("en-IN"),
    };

    saveCustomDesignRequest(updated);
    setCustomRequestsList(getCustomDesignRequests());
    setReviewingCustomRequest(null);
    setSaveSuccessMsg(`Custom Request ${updated.id} Rejected.`);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const openNewProductModal = () => {
    const newId = `at-custom-${Date.now()}`;
    setEditingProduct({
      id: newId,
      slug: `custom-product-${Date.now()}`,
      name: "New Fine Jewellery Product",
      category: "anklet",
      categoryLabel: "Anklet",
      collection: "silver",
      pricingType: "weight_based",
      weightGrams: 15.0,
      makingCharge: 500,
      purity: "925 Sterling Silver",
      images: ["/Silver Charm Payal Anklet Pair.png"],
      videoUrl: "",
      description: "Handcrafted 925 sterling silver ornament with anti-tarnish finish.",
      specifications: { material: "Sterling Silver", purity: "925 Sterling Silver", finish: "High Polish Anti-Tarnish" },
      tag: "New Arrival",
      inStock: true,
      stockQty: 10,
      isBestseller: false,
      isFeatured: false,
    });
    setIsCreatingNew(true);
  };

  // Helper to compress image files before creating Data URLs (prevents LocalStorage QuotaExceededError)
  const compressImageFile = (file: File, maxWidth = 1000, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedDataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Image Upload Handler with Automatic Compression & Supabase Storage Upload
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    for (const file of Array.from(files)) {
      const compressedDataUrl = await compressImageFile(file);
      // Upload compressed image to Supabase Storage 'product-images' bucket
      const { url: storageUrl } = await uploadProductImageToSupabase(
        compressedDataUrl,
        editingProduct.id
      );

      const finalUrl = storageUrl || compressedDataUrl;

      // Prepend newly uploaded image so it immediately becomes the main product thumbnail (images[0])
      setEditingProduct((prev) =>
        prev ? { ...prev, images: [finalUrl, ...prev.images] } : null
      );
    }
  };

  // Video Upload Handler
  const handleProductVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditingProduct((prev) => (prev ? { ...prev, videoUrl: dataUrl } : null));
      }
    };
    reader.readAsDataURL(file);
  };

  // Image Array Management Helpers
  const handleUpdateImageUrl = (index: number, newUrl: string) => {
    if (!editingProduct) return;
    const updatedImages = [...editingProduct.images];
    updatedImages[index] = newUrl;
    setEditingProduct({ ...editingProduct, images: updatedImages });
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct) return;
    if (editingProduct.images.length <= 1) {
      alert("Product must have at least 1 image.");
      return;
    }
    const updatedImages = editingProduct.images.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, images: updatedImages });
  };

  const handleSetMainImage = (index: number) => {
    if (!editingProduct || index === 0) return;
    const updatedImages = [...editingProduct.images];
    const [selected] = updatedImages.splice(index, 1);
    updatedImages.unshift(selected);
    setEditingProduct({ ...editingProduct, images: updatedImages });
  };

  const handleAddBlankImage = () => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      images: [...editingProduct.images, "/Silver Charm Payal Anklet Pair.png"],
    });
  };

  // Analytics Metrics
  const totalProducts = productsList.length;
  const silverProducts = productsList.filter((p) => p.collection === "silver").length;
  const artificialProducts = productsList.filter((p) => p.collection === "artificial").length;
  const totalOrdersCount = ordersList.length;
  const totalSalesAmount = ordersList.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const pendingOrdersCount = ordersList.filter((ord) => (ord.currentStageIndex ?? 2) < 4).length;
  const deliveredOrdersCount = ordersList.filter((ord) => (ord.currentStageIndex ?? 2) === 4).length;
  const pendingCustomRequestsCount = customRequestsList.filter((r) => r.status === "UNDER_REVIEW").length;

  const filteredProducts = productsList.filter((p) => {
    if (selectedCategoryFilter !== "all" && p.category !== selectedCategoryFilter) return false;
    if (selectedCollectionFilter !== "all" && p.collection !== selectedCollectionFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  // LOGIN MODAL IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
        <MarqueeBar />

        <section className="py-20 flex-1 flex items-center justify-center px-4">
          <div className="bg-[#EFEAE1] p-8 sm:p-10 rounded-2xl border border-stone-300 shadow-xl max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#1C2B26] text-white flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[#C9A45C]" />
              </div>
              <h1 className="font-serif text-2xl font-bold uppercase text-stone-900">
                AT ORNAMENTS ADMIN
              </h1>
              <p className="text-xs text-stone-600">
                Enter your credentials to access store business management controls.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-semibold text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-[#1C2B26]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-stone-800 block mb-1">
                  Passcode
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPasscode}
                  onChange={(e) => setLoginPasscode(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-[#1C2B26]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1C2B26] text-white font-bold text-xs uppercase py-3.5 rounded-xl shadow-md"
              >
                LOG IN TO BUSINESS ADMIN
              </button>
            </form>

            <div className="text-[10px] text-stone-500 text-center border-t border-stone-300 pt-3">
              Credentials: Username <strong>admin</strong> | Passcode <strong>ayush2026</strong>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />

      {/* DEDICATED ADMIN HEADER */}
      <section className="bg-[#1C2B26] text-white py-6 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-semibold text-stone-300 uppercase">
              BUSINESS MANAGEMENT SUITE
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold uppercase tracking-wide">
              AT ORNAMENTS ADMIN
            </h1>
          </div>

          {/* Go to Website, Agent Log & Logout Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/agent-log"
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-amber-500/40 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>AGENT AUDIT LOG ➔</span>
            </Link>

            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← GO TO WEBSITE</span>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-900/80 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </section>

      {saveSuccessMsg && (
        <div className="bg-emerald-800 text-white py-2.5 px-4 text-center font-bold text-xs uppercase tracking-wider">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* Admin Body Content */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* MULTI-TAB NAVIGATION BAR */}
        <div className="flex flex-wrap items-center gap-2 bg-[#EFEAE1] p-3 rounded-2xl border border-stone-300">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "overview" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "catalog" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Catalog & Media ({totalProducts})
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "orders" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Order Management ({totalOrdersCount})
          </button>

          <button
            onClick={() => setActiveTab("rate")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "rate" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Silver Rate (₹{silverRate}/g)
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "customers" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Customers
          </button>

          <button
            onClick={() => setActiveTab("gst")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "gst" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            GST & Tax
          </button>

          <button
            onClick={() => setActiveTab("returns")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
              activeTab === "returns" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Returns
          </button>

          {/* Custom Design Requests Business Tab */}
          <button
            onClick={() => setActiveTab("custom_design")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              activeTab === "custom_design" ? "bg-[#1C2B26] text-white shadow-xs" : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Custom Design Requests ({customRequestsList.length})</span>
            {pendingCustomRequestsCount > 0 && (
              <span className="bg-amber-500 text-stone-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                {pendingCustomRequestsCount} NEW
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Loading & Error Status Banner */}
            {loadingAiMetrics && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3.5 rounded-2xl text-xs font-mono flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Fetching live database-backed AI analytics from Supabase...</span>
              </div>
            )}
            {aiMetricsError && (
              <div className="bg-red-900/30 border border-red-500/40 text-red-200 p-3.5 rounded-2xl text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{aiMetricsError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-300 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Total Catalog Items</span>
                <span className="text-3xl font-extrabold text-stone-900">{totalProducts}</span>
                <span className="text-[10px] text-stone-500 block pt-1">Silver: {silverProducts} • Artificial: {artificialProducts}</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-300 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Total Sales Revenue</span>
                <span className="text-3xl font-extrabold text-[#1C2B26]">₹{totalSalesAmount.toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-stone-500 block pt-1">Across {totalOrdersCount} orders</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-300 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Pending Shipments</span>
                <span className="text-3xl font-extrabold text-amber-700">{pendingOrdersCount}</span>
                <span className="text-[10px] text-stone-500 block pt-1">Delivered: {deliveredOrdersCount}</span>
              </div>

            </div>

            {/* AI PAYMENT INSIGHTS CARD SECTION */}
            <div className="bg-[#1C2B26] text-white p-6 sm:p-7 rounded-2xl border border-[#C9A45C]/40 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-[#C9A45C]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-amber-200">
                      AI Payment Intelligence & Smart Recovery
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      Real-Time Razorpay & Supabase Payment Event Analytics
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-700/50">
                  Live Event Intelligence
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Total Attempts</span>
                  <span className="text-xl font-extrabold text-white">
                    {paymentMetrics?.totalAttempts ?? "Not enough data"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Successful</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {paymentMetrics?.successfulPayments ?? "Not enough data"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-red-400 uppercase block">Failed</span>
                  <span className="text-xl font-extrabold text-red-400">
                    {paymentMetrics?.failedPayments ?? "Not enough data"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-amber-300 uppercase block">Success Rate</span>
                  <span className="text-xl font-extrabold text-amber-300">
                    {paymentMetrics ? `${paymentMetrics.successRate}%` : "Not enough data"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Common Failure</span>
                  <span className="text-xs font-bold text-amber-200 truncate block uppercase pt-1">
                    {paymentMetrics?.mostCommonFailure ? paymentMetrics.mostCommonFailure.replace(/_/g, " ") : "Not enough data"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Recovered</span>
                  <span className="text-xl font-extrabold text-emerald-300">
                    {paymentMetrics?.recoveredCount ?? "Not enough data"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Recovery Rate</span>
                  <span className="text-xl font-extrabold text-emerald-300">
                    {paymentMetrics ? `${paymentMetrics.recoveryRate}%` : "Not enough data"}
                  </span>
                </div>
              </div>

              {/* Gemini Merchant Summary Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 uppercase text-[10px] block tracking-wider mb-0.5">
                    Merchant AI Analytics Summary
                  </span>
                  <p className="leading-relaxed">
                    {paymentMetrics?.aiSummary || "Not enough data available yet to compute payment recovery analytics."}
                  </p>
                </div>
              </div>
            </div>

            {/* AI STYLIST PERFORMANCE ANALYTICS SECTION */}
            <div className="bg-[#1C2B26] text-white p-6 sm:p-7 rounded-2xl border border-[#C9A45C]/40 space-y-4 shadow-lg">
              <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-[#C9A45C]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-200">
                    AI Stylist Performance & Engagement
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                    Conversational Recommendation Metrics & Refinement Analytics
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-black/30 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Total Sessions</span>
                  <span className="text-2xl font-extrabold text-white">{stylistMetrics.totalSessions}</span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-amber-300 uppercase block">Recommendations</span>
                  <span className="text-2xl font-extrabold text-amber-300">{stylistMetrics.recommendationsGenerated}</span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Clarifications</span>
                  <span className="text-2xl font-extrabold text-stone-200">{stylistMetrics.clarificationsAsked}</span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Refinements</span>
                  <span className="text-2xl font-extrabold text-emerald-400">{stylistMetrics.refinementRequests}</span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase block">Product Clicks</span>
                  <span className="text-2xl font-extrabold text-emerald-300">{stylistMetrics.clickedProductsCount}</span>
                </div>
              </div>
            </div>

            {/* AI CHECKOUT RECOVERY AGENT CORE SECTION */}
            <div className="bg-[#1C2B26] text-white p-6 sm:p-7 rounded-2xl border border-[#C9A45C]/40 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-[#C9A45C]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-amber-200">
                      AI Checkout Recovery Agent Core
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      Event-Driven Funnel Recovery • Abandonments & Payment Failures
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-700/50">
                  Bounded Action Engine Active
                </span>
              </div>

              {/* Recovery Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-amber-400 uppercase block">Revenue at Risk</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    ₹{recoveryMetrics.metrics.revenueAtRisk.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Revenue Recovered</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    ₹{recoveryMetrics.metrics.revenueRecovered.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase block">Recovery Rate</span>
                  <span className="text-xl font-extrabold text-emerald-300">
                    {recoveryMetrics.metrics.recoveryRate}%
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Abandonments</span>
                  <span className="text-xl font-extrabold text-white">
                    {recoveryMetrics.metrics.cartAbandonments}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Payment Failures</span>
                  <span className="text-xl font-extrabold text-red-400">
                    {recoveryMetrics.metrics.paymentFailures}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Recovery Attempts</span>
                  <span className="text-xl font-extrabold text-stone-200">
                    {recoveryMetrics.metrics.recoveryAttempts}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Recovered Count</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {recoveryMetrics.metrics.successfulRecoveries}
                  </span>
                </div>
              </div>

              {/* Agent Decision Transparency Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-100 space-y-1">
                <span className="font-bold text-amber-300 uppercase text-[10px] block tracking-wider">
                  Agent Strategy Rule: Bounded Action Safety Enforcement
                </span>
                <p className="text-[11px] leading-relaxed text-stone-300">
                  Top strategy: <strong className="text-white uppercase">{recoveryMetrics.metrics.topAction.replace(/_/g, " ")}</strong>. Primary driver: <strong className="text-amber-200">{recoveryMetrics.metrics.topReason}</strong>. All actions are strictly bounded; payment status update to Paid remains exclusively controlled by Razorpay server signature verification.
                </p>
              </div>
            </div>

            {/* AI COMMERCE INTELLIGENCE & REVENUE ANALYTICS SECTION */}
            <div className="bg-[#1C2B26] text-white p-6 sm:p-7 rounded-2xl border border-[#C9A45C]/40 space-y-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-[#C9A45C]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-amber-200">
                      AI Commerce Intelligence & Revenue Analytics
                    </h3>
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      Verified Funnel Conversion • AI vs Fallback Split • Real Recovery Truth
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-700/50">
                    AI: {commerceMetrics?.aiDecisionPercentage ?? 0}%
                  </span>
                  <span className="text-[10px] bg-stone-800 text-stone-300 font-bold px-2.5 py-1 rounded-full border border-stone-700">
                    Fallback: {commerceMetrics?.fallbackDecisionPercentage ?? 0}%
                  </span>
                </div>
              </div>

              {/* FUNNEL VISUALIZATION DIAGRAM */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Unified Customer Conversion Funnel
                </h4>
                {commerceMetrics?.funnelSteps?.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
                    {commerceMetrics.funnelSteps.map((step: any, idx: number) => (
                      <div key={idx} className="bg-black/40 p-3 rounded-xl border border-stone-800 flex flex-col justify-between space-y-1">
                        <span className="text-[9px] text-stone-400 font-sans font-bold uppercase truncate">{step.name}</span>
                        <span className="text-xl font-extrabold text-amber-200">{step.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/30 border border-stone-800 text-center text-xs text-stone-400 font-mono">
                    No completed customer conversion events recorded yet in database.
                  </div>
                )}
              </div>

              {/* RECOVERY PERFORMANCE TABLE BY FAILURE CATEGORY */}
              <div className="space-y-3 border-t border-stone-800 pt-5">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Recovery Performance Breakdown (By Category)
                </h4>
                {commerceMetrics?.categoryBreakdown?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-300 font-sans">
                      <thead className="bg-black/50 text-[10px] text-stone-400 font-mono uppercase tracking-wider border-b border-stone-800">
                        <tr>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Opportunities</th>
                          <th className="p-2.5">Attempts</th>
                          <th className="p-2.5">Recovered</th>
                          <th className="p-2.5">Recovery Rate</th>
                          <th className="p-2.5">Revenue At Risk</th>
                          <th className="p-2.5">Revenue Recovered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                        {commerceMetrics.categoryBreakdown.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-2.5 font-sans font-bold text-amber-200 uppercase">{row.category.replace(/_/g, " ")}</td>
                            <td className="p-2.5 text-stone-300">{row.opportunities}</td>
                            <td className="p-2.5 text-stone-300">{row.attempts}</td>
                            <td className="p-2.5 text-emerald-400 font-bold">{row.successful}</td>
                            <td className="p-2.5 text-emerald-300 font-bold">{row.recoveryRate}%</td>
                            <td className="p-2.5 text-amber-400">₹{row.revenueAtRisk.toLocaleString("en-IN")}</td>
                            <td className="p-2.5 text-emerald-400 font-extrabold">₹{row.revenueRecovered.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/30 border border-stone-800 text-center text-xs text-stone-400 font-mono">
                    No recovery performance events recorded yet in database.
                  </div>
                )}
              </div>

              {/* AGENT DECISION INSPECTOR - WHY THIS ACTION? */}
              <div className="space-y-3 border-t border-stone-800 pt-5">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Agent Decision Inspector & Audit Trace
                </h4>
                {recoveryMetrics.opportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {recoveryMetrics.opportunities.slice(0, 4).map((opp: any, idx: number) => (
                      <div key={idx} className="bg-black/40 p-4 rounded-xl border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                          <span className="font-mono text-[10px] text-amber-300 uppercase font-bold">{opp.type || "Opportunity"}</span>
                          <span className="text-[9px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono uppercase font-bold">{opp.status}</span>
                        </div>
                        <div className="text-[11px] space-y-1 font-mono text-stone-300">
                          <div>Amount: <strong className="text-amber-300">₹{opp.amount}</strong></div>
                          <div>Reason: <span className="text-stone-300">{opp.reason}</span></div>
                          <div>Strategy: <strong className="text-emerald-300 uppercase">{opp.recommendedAction}</strong></div>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
                          <strong className="block text-amber-400 font-bold uppercase mb-0.5">Why this action?</strong>
                          {opp.aiExplanation || "Payment failure detected. The bounded decision engine selected the safest payment recovery path without altering order status."}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/30 border border-stone-800 text-center text-xs text-stone-400 font-mono">
                    No active agent decision traces recorded yet in database.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG & MEDIA MANAGEMENT */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="bg-[#EFEAE1] p-5 rounded-2xl border border-stone-300 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search catalog by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 pl-10 text-xs font-medium focus:outline-none focus:border-[#1C2B26]"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
                <button
                  onClick={openNewProductModal}
                  className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#C9A45C]" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Catalog Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => {
                const livePrice = computeProductPrice(prod, silverRate);
                return (
                  <div
                    key={prod.id}
                    className="bg-[#EFEAE1]/90 rounded-2xl border border-stone-300 p-5 flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 flex-shrink-0">
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                        {prod.videoUrl && (
                          <span className="absolute top-1 right-1 bg-stone-900/80 text-white p-0.5 rounded-md">
                            <Video className="w-3 h-3 text-[#C9A45C]" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-stone-500 font-bold uppercase truncate block">
                          {prod.categoryLabel} • {prod.collection}
                        </span>
                        <h3 className="font-serif font-bold text-stone-900 text-sm line-clamp-1">
                          {prod.name}
                        </h3>
                        <span className="text-[10px] text-stone-500 block font-mono">ID: {prod.id}</span>
                        <span className="text-[10px] text-stone-600 block line-clamp-1 italic pt-0.5">
                          "{prod.description}"
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-stone-900 text-base">₹{livePrice.toLocaleString("en-IN")}</span>
                        {prod.pricingType === "weight_based" ? (
                          <span className="text-[10px] text-stone-500 block">{prod.weightGrams}g Silver + ₹{prod.makingCharge} Making</span>
                        ) : (
                          <span className="text-[10px] text-stone-500 block">Fixed Retail Price</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleToggleStockStatus(prod.id, e)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase transition-all ${
                          prod.inStock ? "bg-emerald-800 text-white" : "bg-red-700 text-white"
                        }`}
                      >
                        {prod.inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-300/60 text-xs">
                      <span className="text-[10px] text-stone-500 font-medium">
                        {prod.images.length} Image(s) {prod.videoUrl ? "• 360° Video" : ""}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-stone-400 hover:text-red-700"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct({ ...prod });
                            setIsCreatingNew(false);
                          }}
                          className="flex items-center gap-1.5 bg-[#1C2B26] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Product & Media</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ORDER MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-6">
            <div className="border-b border-stone-300 pb-3 flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-stone-900 uppercase">Order Management ({ordersList.length})</h3>
            </div>

            <div className="space-y-4 text-xs">
              {ordersList.map((ord, idx) => {
                const rawPayStatus = (ord.paymentStatus || ord.payment_status || "Payment Pending").toString();
                const payStatusLower = rawPayStatus.toLowerCase();
                const isPaidOnline = payStatusLower.includes("paid") || payStatusLower.includes("captured");
                const isCodOrder = payStatusLower.includes("cod");
                const isPaymentFailed = payStatusLower.includes("failed") || payStatusLower.includes("declined");
                const isPaymentVerified = isPaidOnline || isCodOrder;

                return (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-300 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                      <div>
                        <span className="font-bold text-stone-900 text-base block">{ord.orderId}</span>
                        <span className="text-stone-600 font-semibold">{ord.customer?.fullName} • {ord.customer?.phone}</span>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="font-extrabold text-stone-900 text-lg block">₹{ord.total?.toLocaleString("en-IN")}</span>
                        <div className="flex items-center gap-1.5">
                          {/* Explicit Payment Status Badge */}
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                            isPaidOnline
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : isCodOrder
                              ? "bg-blue-100 text-blue-900 border-blue-300"
                              : isPaymentFailed
                              ? "bg-red-100 text-red-900 border-red-300"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}>
                            {isPaidOnline ? "PAID ONLINE" : isCodOrder ? "PENDING COD" : isPaymentFailed ? "PAYMENT FAILED" : "PAYMENT PENDING"}
                          </span>

                          {/* Fulfillment Status Badge */}
                          {isPaymentVerified && (
                            <span className="text-[10px] text-stone-700 font-bold bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-300">
                              {STAGE_LABELS[ord.currentStageIndex ?? 0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shipment Stage Controller (Enabled ONLY for Verified Paid/COD Orders) */}
                    <div className="space-y-2">
                      <span className="font-bold text-stone-700 block uppercase text-[10px] tracking-wider">
                        Update Shipment Progress Stage:
                      </span>
                      {isPaymentVerified ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {STAGE_LABELS.map((stageLabel, stageIdx) => (
                            <button
                              key={stageIdx}
                              onClick={() => handleChangeOrderStatus(ord.rawId || ord.orderId, stageIdx)}
                              className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                                (ord.currentStageIndex ?? 0) === stageIdx
                                  ? "bg-[#1C2B26] text-white shadow-xs"
                                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
                              }`}
                            >
                              {stageLabel}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>
                            Fulfillment locked: Payment for this order is <strong>{isPaymentFailed ? "FAILED" : "PENDING"}</strong>. Order cannot be marked confirmed or dispatched until payment is verified.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Order Actions (Download Invoice & Track) */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 text-xs">
                      <Link
                        href={`/invoice/${ord.rawId || ord.orderId.replace("#", "")}`}
                        target="_blank"
                        className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>Download GST Invoice</span>
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SILVER RATE CONTROLLER */}
        {activeTab === "rate" && (
          <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-6 max-w-xl">
            <h3 className="font-serif text-xl font-bold text-stone-900 uppercase">Silver Rate Controller</h3>
            <p className="text-xs text-stone-600">
              Updating the rate automatically recalculates prices for weight-based silver products. Historical order totals remain fixed.
            </p>

            <form onSubmit={handleUpdateSilverRate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Silver Rate Per Gram (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newSilverRate}
                  onChange={(e) => setNewSilverRate(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-base font-bold"
                />
              </div>

              <button type="submit" className="w-full bg-[#1C2B26] text-white font-bold py-3 rounded-xl uppercase tracking-widest">
                Update Silver Rate
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (
          <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-4">
            <h3 className="font-serif text-xl font-bold text-stone-900 uppercase">Customers Directory</h3>
            <div className="space-y-3 text-xs">
              {ordersList.map((ord, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">{ord.customer?.fullName}</span>
                    <span className="text-stone-600 block">{ord.customer?.email} • {ord.customer?.phone}</span>
                    <span className="text-stone-500 block text-[10px]">{ord.customer?.address}, {ord.customer?.city}</span>
                  </div>
                  <div className="text-right font-bold text-stone-900">
                    <span>Order: {ord.orderId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GST & TAX CONFIGURATION */}
        {activeTab === "gst" && (
          <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-6 max-w-xl">
            <h3 className="font-serif text-xl font-bold text-stone-900 uppercase">GST & Tax Configuration</h3>
            <form onSubmit={handleSaveGstin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Official State GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 font-semibold"
                />
              </div>

              <button type="submit" className="w-full bg-[#1C2B26] text-white font-bold py-3 rounded-xl uppercase tracking-widest">
                Save GSTIN Configuration
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: RETURNS MANAGER */}
        {activeTab === "returns" && (
          <div className="bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300 space-y-4">
            <h3 className="font-serif text-xl font-bold text-stone-900 uppercase">Returns Manager</h3>
            <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-2 text-xs">
              <span className="font-bold text-stone-900 block">Return Policy Business Rules:</span>
              <p className="text-stone-700">• <strong>Silver Jewellery:</strong> Strictly Final Sale (No Return / No Exchange) due to daily silver valuation.</p>
              <p className="text-stone-700">• <strong>Artificial Jewellery:</strong> 7-Day Return / Exchange allowed in original condition.</p>
            </div>
          </div>
        )}

        {/* TAB 8: CUSTOM DESIGN REQUESTS (FULL DETAILS) */}
        {activeTab === "custom_design" && (
          <div className="space-y-6">
            <div className="bg-[#EFEAE1] p-6 rounded-2xl border border-stone-300 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 uppercase">
                  Custom Design Requests ({customRequestsList.length})
                </h3>
                <p className="text-xs text-stone-600">
                  Review complete customer specifications, visual concepts, estimates & send merchant quotes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customRequestsList.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-stone-300 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold font-mono text-sm text-[#1C2B26] block">
                        {req.id}
                      </span>
                      <span className="text-xs font-semibold text-stone-800">
                        {req.customerName} ({req.customerPhone})
                      </span>
                      <span className="text-[10px] text-stone-500 block">{req.createdAt}</span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      req.status === "QUOTE_SENT"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : req.status === "UNDER_REVIEW"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-stone-100 text-stone-700"
                    }`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <img src={req.designImage} className="w-24 h-24 rounded-xl object-contain bg-stone-900 border border-stone-300 flex-shrink-0" />
                    <div className="text-xs space-y-1 flex-1">
                      <span className="font-bold text-stone-900 uppercase block">{req.category} Design</span>
                      <div className="text-stone-600 text-[11px] space-y-0.5">
                        <p><strong>Material:</strong> {req.material}</p>
                        <p><strong>Style:</strong> {req.style}</p>
                        <p><strong>Thickness:</strong> {req.thickness}</p>
                        <p><strong>Size:</strong> {req.size}</p>
                        {req.stones && <p><strong>Stones:</strong> {req.stones}</p>}
                        {req.charms && <p><strong>Charms:</strong> {req.charms}</p>}
                        {req.engraving && <p><strong>Engraving:</strong> "{req.engraving}"</p>}
                        <p><strong>Customer Budget:</strong> ₹{req.budget}</p>
                        <p className="text-amber-900 font-bold"><strong>AI Estimate:</strong> ₹{req.aiEstimateMin} – ₹{req.aiEstimateMax}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                    <span className="text-[10px] text-stone-500">
                      History: {req.versions?.length || 1} Version(s)
                    </span>

                    <button
                      onClick={() => setReviewingCustomRequest(req)}
                      className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
                      <span>Review Request & Send Quote</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* COMPREHENSIVE PRODUCT & MEDIA EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F7F5F0] rounded-3xl border border-stone-300 max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-stone-300 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider block">
                  CATALOG PRODUCT & MEDIA EDITOR
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  {isCreatingNew ? "Add New Product" : `Edit Product: ${editingProduct.name}`}
                </h3>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-2 text-stone-700 hover:text-stone-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-6 text-xs">
              
              {/* SECTION 1: PRODUCT INFORMATION */}
              <div className="bg-white p-5 rounded-2xl border border-stone-300 space-y-4">
                <h4 className="font-serif font-bold text-stone-900 text-sm uppercase border-b border-stone-200 pb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#1C2B26]" />
                  <span>1. Product Basic Information</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="font-bold text-stone-700 block mb-1">Product Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-bold text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Product Tag / Badge</label>
                    <input
                      type="text"
                      placeholder="e.g. Bestseller, New Arrival"
                      value={editingProduct.tag || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-semibold"
                    />
                  </div>
                </div>

                {/* Collection & Category */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Collection</label>
                    <select
                      value={editingProduct.collection}
                      onChange={(e) => setEditingProduct({ ...editingProduct, collection: e.target.value as any })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                    >
                      <option value="silver">Pure 925 Silver</option>
                      <option value="artificial">Fine Artificial</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => {
                        const cat = e.target.value as any;
                        const labelMap: Record<string, any> = { chain: "Chain", anklet: "Anklet", ring: "Ring", bracelet: "Bracelet" };
                        setEditingProduct({
                          ...editingProduct,
                          category: cat,
                          categoryLabel: labelMap[cat] || "Jewellery",
                        });
                      }}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                    >
                      <option value="bracelet">Bracelet</option>
                      <option value="anklet">Anklet (Payal)</option>
                      <option value="ring">Ring</option>
                      <option value="chain">Chain / Necklace</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Pricing Model</label>
                    <select
                      value={editingProduct.pricingType}
                      onChange={(e) => setEditingProduct({ ...editingProduct, pricingType: e.target.value as any })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-semibold"
                    >
                      <option value="weight_based">Daily Silver Weight-Based</option>
                      <option value="fixed">Fixed Retail Price</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Stock Status</label>
                    <select
                      value={editingProduct.inStock ? "true" : "false"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.value === "true" })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-bold"
                    >
                      <option value="true">In Stock</option>
                      <option value="false">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {editingProduct.pricingType === "weight_based" ? (
                    <>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">Net Weight (Grams) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={editingProduct.weightGrams || 15}
                          onChange={(e) => setEditingProduct({ ...editingProduct, weightGrams: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-extrabold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">Making Charge (₹) *</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.makingCharge || 500}
                          onChange={(e) => setEditingProduct({ ...editingProduct, makingCharge: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-extrabold text-stone-900"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Fixed Retail Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.fixedPrice || 1500}
                        onChange={(e) => setEditingProduct({ ...editingProduct, fixedPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-extrabold text-stone-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Purity Grade</label>
                    <input
                      type="text"
                      placeholder="e.g. 925 Sterling Silver"
                      value={editingProduct.purity || "925 Sterling Silver"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, purity: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-semibold"
                    />
                  </div>
                </div>

              </div>

              {/* SECTION 2: COMPLETE DESCRIPTION & SPECIFICATIONS */}
              <div className="bg-white p-5 rounded-2xl border border-stone-300 space-y-4">
                <h4 className="font-serif font-bold text-stone-900 text-sm uppercase border-b border-stone-200 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1C2B26]" />
                  <span>2. Full Product Description & Specifications</span>
                </h4>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Complete Product Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe craftsmanship, stone details, lock mechanism, and daily wear instructions..."
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl p-3 font-medium text-stone-900 focus:outline-none focus:border-[#1C2B26]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Spec: Material</label>
                    <input
                      type="text"
                      value={editingProduct.specifications?.material || "Sterling Silver"}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          specifications: { ...editingProduct.specifications, material: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Spec: Purity</label>
                    <input
                      type="text"
                      value={editingProduct.specifications?.purity || "925 Sterling Silver"}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          specifications: { ...editingProduct.specifications, purity: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Spec: Finish</label>
                    <input
                      type="text"
                      value={editingProduct.specifications?.finish || "High Polish Anti-Tarnish"}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          specifications: { ...editingProduct.specifications, finish: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: MEDIA MANAGEMENT (IMAGES & 360° SHOWCASE VIDEO) */}
              <div className="bg-white p-5 rounded-2xl border border-stone-300 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-serif font-bold text-stone-900 text-sm uppercase flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#1C2B26]" />
                    <span>3. Product Media & Gallery Management</span>
                  </h4>

                  <label className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Images List */}
                <div className="space-y-3">
                  <span className="font-bold text-stone-700 block">Product Gallery Images ({editingProduct.images.length})</span>
                  
                  {editingProduct.images.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="flex items-center gap-3 bg-[#F7F5F0] p-3 rounded-xl border border-stone-300">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-200 border border-stone-300 flex-shrink-0">
                        <img src={imgUrl} className="w-full h-full object-cover" />
                        {imgIdx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-[#1C2B26] text-white text-[8px] font-extrabold text-center uppercase">
                            MAIN
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={imgUrl}
                        onChange={(e) => handleUpdateImageUrl(imgIdx, e.target.value)}
                        placeholder="Image URL or Path (e.g. /Silver Charm Payal Anklet Pair.png)"
                        className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 font-mono text-[11px]"
                      />

                      {imgIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(imgIdx)}
                          className="px-2.5 py-1.5 bg-[#1C2B26] hover:bg-stone-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                          title="Set as Primary Main Image"
                        >
                          Make Main
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgIdx)}
                        className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddBlankImage}
                    className="w-full border border-dashed border-stone-300 hover:border-[#1C2B26] bg-stone-50 p-2.5 rounded-xl font-bold text-stone-700 text-center flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-[#1C2B26]" />
                    <span>Add Image URL / Path</span>
                  </button>
                </div>

                {/* 360° Showcase Video URL & Upload */}
                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-700 block flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-purple-800" />
                      <span>Product 360° / Showcase Video URL</span>
                    </label>

                    <label className="bg-purple-900 hover:bg-purple-800 text-white font-bold text-[10px] uppercase px-3 py-1 rounded-xl cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Video File</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleProductVideoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="e.g. /Delicate Infinity Silver Bracelet Video.mp4 or video DataURL"
                    value={editingProduct.videoUrl || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 font-mono text-xs"
                  />
                  <p className="text-[10px] text-stone-500">
                    Adding a video enables HD 360° interactive video display on the product detail page.
                  </p>
                </div>

              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-stone-300">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-8 py-3 rounded-2xl shadow-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#C9A45C]" />
                  <span>Save Product & Media Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILED MERCHANT REVIEW MODAL FOR CUSTOM DESIGN REQUEST */}
      {reviewingCustomRequest && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F7F5F0] rounded-3xl border border-stone-300 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-stone-300 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">
                  MERCHANT FEASIBILITY & SPECIFICATION REVIEW
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  Request ID: {reviewingCustomRequest.id}
                </h3>
              </div>
              <button onClick={() => setReviewingCustomRequest(null)} className="p-1.5 text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Concept Visualizer Image */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase text-stone-700 block">Design Concept Visualization</span>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-stone-300">
                  <img src={reviewingCustomRequest.designImage} className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Full Detailed Specifications */}
              <div className="space-y-4 text-xs text-stone-800">
                <div className="bg-[#EFEAE1] p-4 rounded-2xl border border-stone-300 space-y-1.5">
                  <span className="font-bold block uppercase text-[10px] text-stone-500 tracking-wider">Customer Contact</span>
                  <p className="font-bold text-stone-900 text-sm">{reviewingCustomRequest.customerName}</p>
                  <p className="text-stone-700">Phone: {reviewingCustomRequest.customerPhone}</p>
                  <p className="text-stone-700">Email: {reviewingCustomRequest.customerEmail}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-stone-300 space-y-1.5">
                  <span className="font-bold block uppercase text-[10px] text-stone-500 tracking-wider">Custom Specifications</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-stone-500">Category:</span> <strong className="uppercase">{reviewingCustomRequest.category}</strong></div>
                    <div><span className="text-stone-500">Material:</span> <strong>{reviewingCustomRequest.material}</strong></div>
                    <div><span className="text-stone-500">Style:</span> <strong>{reviewingCustomRequest.style}</strong></div>
                    <div><span className="text-stone-500">Thickness:</span> <strong>{reviewingCustomRequest.thickness}</strong></div>
                    <div><span className="text-stone-500">Size:</span> <strong>{reviewingCustomRequest.size}</strong></div>
                    <div><span className="text-stone-500">Budget:</span> <strong>₹{reviewingCustomRequest.budget}</strong></div>
                    {reviewingCustomRequest.stones && <div className="col-span-2"><span className="text-stone-500">Stones:</span> <strong>{reviewingCustomRequest.stones}</strong></div>}
                    {reviewingCustomRequest.charms && <div className="col-span-2"><span className="text-stone-500">Charms:</span> <strong>{reviewingCustomRequest.charms}</strong></div>}
                    {reviewingCustomRequest.engraving && <div className="col-span-2"><span className="text-stone-500">Engraving:</span> <strong className="italic">"{reviewingCustomRequest.engraving}"</strong></div>}
                  </div>
                </div>

                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider block">AI Estimate Range</span>
                  <p className="font-extrabold text-sm">₹{reviewingCustomRequest.aiEstimateMin} – ₹{reviewingCustomRequest.aiEstimateMax}</p>
                </div>
              </div>

            </div>

            {/* Merchant Approval Form */}
            <form onSubmit={handleApproveCustomRequest} className="space-y-4 pt-4 border-t border-stone-300 text-xs">
              <h4 className="font-serif font-bold text-stone-900 uppercase">
                Enter Official Merchant Quote & Specifications
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Final Net Weight (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalWeightGrams}
                    onChange={(e) => setFinalWeightGrams(parseFloat(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Making Charge (₹)</label>
                  <input
                    type="number"
                    value={makingCharge}
                    onChange={(e) => setMakingCharge(parseFloat(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Final Total Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(parseFloat(e.target.value))}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Est. Days</label>
                  <input
                    type="number"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Merchant Note for Customer</label>
                <textarea
                  rows={2}
                  value={merchantNotes}
                  onChange={(e) => setMerchantNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRejectCustomRequest}
                  className="bg-red-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  type="submit"
                  className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C9A45C]" />
                  <span>Approve & Send Quote to Customer</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
