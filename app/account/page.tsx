"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Package,
  MapPin,
  Download,
  ExternalLink,
  Heart,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Edit3,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  getCurrentUser,
  signOutUser,
  fetchCustomerProfile,
  updateCustomerProfile,
  fetchCustomerAddresses,
  saveCustomerAddress,
  deleteCustomerAddress,
  CustomerProfile,
  SavedAddress,
} from "@/lib/supabase/auth";
import { fetchOrdersFromSupabase } from "@/lib/supabase/orders";
import { fetchCustomDesignRequestsFromSupabase } from "@/lib/supabase/customDesign";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "addresses" | "custom_design">("orders");

  // Auth & Profile state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profileSaveMsg, setProfileSaveMsg] = useState("");

  // Data states
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [addressesList, setAddressesList] = useState<SavedAddress[]>([]);
  const [customRequests, setCustomRequests] = useState<any[]>([]);

  // Address Modal / Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrLine, setNewAddrLine] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newFullName, setNewFullName] = useState("");

  useEffect(() => {
    async function loadAccountData() {
      setAuthLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Load Customer Profile
        const prof = await fetchCustomerProfile(currentUser.email || currentUser.id);
        if (prof) {
          setProfile(prof);
          setEditName(prof.full_name || "");
          setEditPhone(prof.phone || "");
        } else {
          const fallbackProf: CustomerProfile = {
            auth_id: currentUser.id,
            email: currentUser.email || "",
            full_name: currentUser.user_metadata?.full_name || "Valued Customer",
            phone: currentUser.user_metadata?.phone || "",
          };
          setProfile(fallbackProf);
          setEditName(fallbackProf.full_name);
          setEditPhone(fallbackProf.phone || "");
        }

        // Load Orders for this customer
        const allOrders = await fetchOrdersFromSupabase();
        if (allOrders) {
          const userEmail = currentUser.email?.toLowerCase();
          const userOrders = allOrders.filter(
            (o) =>
              o.rawId === currentUser.id ||
              (userEmail && o.customer?.email?.toLowerCase() === userEmail)
          );
          setOrdersList(userOrders);
        }

        // Load Addresses
        const addrs = await fetchCustomerAddresses(currentUser.id);
        setAddressesList(addrs);

        // Load Custom Designs
        const customReqs = await fetchCustomDesignRequestsFromSupabase();
        if (customReqs) {
          const userReqs = customReqs.filter(
            (r) => r.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase()
          );
          setCustomRequests(userReqs);
        }
      } else {
        // Fallback local order check for guests / offline
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("at_latest_order");
          if (saved) {
            try {
              setOrdersList([JSON.parse(saved)]);
            } catch (e) {}
          }
        }
      }
      setAuthLoading(false);
    }

    loadAccountData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updatedProf: CustomerProfile = {
      ...profile,
      full_name: editName,
      phone: editPhone,
    };

    const ok = await updateCustomerProfile(updatedProf);
    if (ok) {
      setProfile(updatedProf);
      setProfileSaveMsg("Profile updated successfully!");
      setTimeout(() => setProfileSaveMsg(""), 3000);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newAddr: SavedAddress = {
      customer_id: user.id,
      full_name: newFullName || editName || "Customer",
      phone: newPhone || editPhone || "",
      address_line: newAddrLine,
      city: newCity,
      state: newState,
      pincode: newPincode,
      is_default: addressesList.length === 0,
    };

    const ok = await saveCustomerAddress(newAddr);
    if (ok) {
      const refreshed = await fetchCustomerAddresses(user.id);
      setAddressesList(refreshed);
      setShowAddressForm(false);
      setNewAddrLine("");
      setNewCity("");
      setNewState("");
      setNewPincode("");
    }
  };

  const handleDeleteAddress = async (id?: string) => {
    if (!id || !user) return;
    const ok = await deleteCustomerAddress(id);
    if (ok) {
      const refreshed = await fetchCustomerAddresses(user.id);
      setAddressesList(refreshed);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/";
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F7F5F0]">
        <MarqueeBar />
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24 text-xs font-bold text-stone-600">
          Loading Customer Dashboard...
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900">
      <MarqueeBar />
      <Navbar />

      {/* Header Banner */}
      <section className="bg-[#EFEAE1] py-10 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-semibold text-stone-600 uppercase block">
              MY AYUSH TRADERS ACCOUNT
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 uppercase mt-0.5">
              {user ? (profile?.full_name || "Valued Customer") : "Guest Account"}
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              {user ? user.email : "Sign in to sync your order history, wishlist & saved addresses across devices."}
            </p>
          </div>

          {user ? (
            <button
              onClick={handleLogout}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#C9A45C]" />
              <span>Log Out</span>
            </button>
          ) : (
            <Link
              href="/auth/login?redirectUrl=/account"
              className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#C9A45C]" />
              <span>Sign In / Create Account</span>
            </Link>
          )}
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="md:col-span-4 bg-[#EFEAE1]/70 p-4 rounded-2xl border border-stone-300 space-y-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "orders"
                  ? "bg-[#1C2B26] text-white shadow-sm"
                  : "text-stone-700 hover:bg-stone-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </div>
              <span className="bg-stone-900/10 text-stone-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                {ordersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "profile"
                  ? "bg-[#1C2B26] text-white shadow-sm"
                  : "text-stone-700 hover:bg-stone-200"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile Details</span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === "addresses"
                  ? "bg-[#1C2B26] text-white shadow-sm"
                  : "text-stone-700 hover:bg-stone-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </div>
              <span className="bg-stone-900/10 text-stone-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                {addressesList.length}
              </span>
            </button>

            {customRequests.length > 0 && (
              <button
                onClick={() => setActiveTab("custom_design")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                  activeTab === "custom_design"
                    ? "bg-[#1C2B26] text-white shadow-sm"
                    : "text-stone-700 hover:bg-stone-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4" />
                  <span>Custom Designs</span>
                </div>
                <span className="bg-stone-900/10 text-stone-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                  {customRequests.length}
                </span>
              </button>
            )}

            <Link
              href="/wishlist"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-200 transition-all"
            >
              <Heart className="w-4 h-4" />
              <span>My Wishlist</span>
            </Link>
          </aside>

          {/* Main Tab View Area */}
          <div className="md:col-span-8 bg-[#EFEAE1] p-6 sm:p-8 rounded-2xl border border-stone-300">
            
            {/* TAB 1: MY ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="border-b border-stone-300 pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 uppercase">
                    Order History & Invoices ({ordersList.length})
                  </h3>
                </div>

                {ordersList.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
                    <Package className="w-10 h-10 text-stone-400 mx-auto" />
                    <h4 className="font-serif font-bold text-stone-900 uppercase">No Orders Found</h4>
                    <p className="text-xs text-stone-600">
                      Explore our 48 handcrafted sterling silver and artificial jewellery items.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-block bg-[#1C2B26] text-white text-xs font-bold uppercase px-5 py-2.5 rounded-xl shadow-xs"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordersList.map((ord, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                          <div>
                            <span className="font-serif text-base font-bold text-stone-900 block">
                              {ord.orderId}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium">
                              Placed on: {ord.date || "Recent Order"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-900/10 text-emerald-900 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-emerald-800/20">
                              {ord.orderStatus || ord.status || "Order Confirmed"}
                            </span>
                            <span className="text-sm font-bold text-stone-900">
                              ₹{ord.total?.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-2">
                          {ord.items?.map((item: any, itemIdx: number) => (
                            <div key={itemIdx} className="flex items-center gap-3 text-xs">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200 flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-stone-900 line-clamp-1">{item.name}</span>
                                <span className="text-[10px] text-stone-500">
                                  Qty: {item.quantity} • ₹{item.price?.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200 text-xs">
                          <Link
                            href={`/track-order?orderId=${ord.rawId || ord.orderId.replace("#", "")}`}
                            className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900 font-bold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Track Order Progress</span>
                          </Link>

                          <Link
                            href={`/invoice/${ord.rawId || ord.orderId.replace("#", "")}`}
                            className="flex items-center gap-1.5 bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download GST Invoice</span>
                          </Link>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROFILE DETAILS */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="border-b border-stone-300 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900 uppercase">
                    Personal Profile Details
                  </h3>
                </div>

                {profileSaveMsg && (
                  <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{profileSaveMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      readOnly
                      value={user?.email || profile?.email || "guest@atornaments.in"}
                      className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-2.5 font-semibold text-stone-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 font-semibold focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl shadow-xs"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="border-b border-stone-300 pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 uppercase">
                    Saved Shipping Addresses ({addressesList.length})
                  </h3>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="bg-[#1C2B26] text-white text-xs font-bold uppercase px-3.5 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="bg-white p-5 rounded-2xl border border-stone-300 space-y-3 text-xs">
                    <h4 className="font-bold text-stone-900 uppercase text-xs">New Address Form</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">Recipient Name</label>
                        <input
                          type="text"
                          required
                          value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          placeholder="e.g. Priya Sahu"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">Address Line</label>
                      <input
                        type="text"
                        required
                        value={newAddrLine}
                        onChange={(e) => setNewAddrLine(e.target.value)}
                        placeholder="House / Flat No., Street, Area"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="Lucknow"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={newState}
                          onChange={(e) => setNewState(e.target.value)}
                          placeholder="Uttar Pradesh"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          value={newPincode}
                          onChange={(e) => setNewPincode(e.target.value)}
                          placeholder="226001"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-xs uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#1C2B26] text-white px-5 py-2 rounded-xl font-bold text-xs uppercase shadow-xs"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {addressesList.map((addr, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 text-xs space-y-1 relative">
                      {addr.is_default && (
                        <span className="bg-[#1C2B26] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                          Default Shipping Address
                        </span>
                      )}
                      <p className="font-bold text-stone-900 text-sm mt-1">{addr.full_name}</p>
                      <p className="text-stone-700">{addr.address_line}</p>
                      <p className="text-stone-600">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-stone-500 font-semibold">Phone: {addr.phone}</p>

                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="absolute top-4 right-4 text-stone-400 hover:text-red-700"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CUSTOM DESIGNS */}
            {activeTab === "custom_design" && (
              <div className="space-y-6">
                <div className="border-b border-stone-300 pb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900 uppercase">
                    My Custom Design Requests ({customRequests.length})
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  {customRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{req.id} • {req.category} Design</span>
                        <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-stone-600">Material: {req.material} • Style: {req.style}</p>
                      <p className="text-stone-700 font-bold">Estimated Range: ₹{req.aiEstimateMin} - ₹{req.aiEstimateMax}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
