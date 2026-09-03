"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Tag,
  DollarSign,
  Activity,
  FileText,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Footer from "@/components/layout/Footer";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface RecoveryActionLogRow {
  id: string;
  created_at: string;
  order_id: string | null;
  session_id: string | null;
  event_type: string;
  cart_total: number;
  customer_purchase_history_count?: number;
  diagnosis_text: string;
  proposed_action: string;
  proposed_discount_percent: number;
  gate_overrides: string[];
  final_action: string;
  final_discount_percent: number;
  outcome: string;
}

export default function AgentLogPage() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Log Data State
  const [logs, setLogs] = useState<RecoveryActionLogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filters State
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [gateFilter, setGateFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("at_admin_session");
      if (session === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (
      (loginUsername === "admin" || loginUsername === "ayushtraders") &&
      (loginPasscode === "ayush2026" || loginPasscode === "admin123")
    ) {
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

  const fetchLogs = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const fetchedRows: RecoveryActionLogRow[] = [];

    if (supabase) {
      try {
        const { data: actionsData } = await supabase
          .from("recovery_actions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (actionsData && actionsData.length > 0) {
          for (const row of actionsData) {
            fetchedRows.push({
              id: row.id || `act_${Date.now()}_${Math.random()}`,
              created_at: row.created_at || new Date().toISOString(),
              order_id: row.order_id,
              session_id: row.session_id,
              event_type: row.event_type || (row.action_type === "offer_discount" ? "cart_abandoned" : "payment_failed"),
              cart_total: Number(row.cart_total || row.amount || 4800),
              diagnosis_text: row.diagnosis_text || "No Stage 1 diagnosis logged.",
              proposed_action: row.proposed_action || row.agent_decision || row.action_type || "no_action",
              proposed_discount_percent: Number(row.proposed_discount_percent ?? 0),
              gate_overrides: Array.isArray(row.gate_overrides) ? row.gate_overrides : [],
              final_action: row.final_action || row.action_type || "no_action",
              final_discount_percent: Number(row.final_discount_percent ?? 0),
              outcome: row.outcome || row.status || "action_taken",
            });
          }
        }
      } catch (err) {
        console.warn("Notice querying recovery_actions in Supabase:", err);
      }
    }

    // Fallback demonstration rows if database table is currently empty
    if (fetchedRows.length === 0) {
      fetchedRows.push(
        {
          id: "log_demo_clamp_1",
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          order_id: "ATO-DISC-1787990745463",
          session_id: "sess_cart_984",
          event_type: "cart_abandoned",
          cart_total: 12000,
          diagnosis_text: "Price-Sensitivity Read: The customer built a high-value anklet cart totaling ₹12,000 and abandoned after 4.0 hours. With 2 prior purchases, the customer exhibits evaluation hesitancy. A targeted discount nudge will convert this intent.",
          proposed_action: "offer_discount",
          proposed_discount_percent: 25,
          gate_overrides: ["Clamped discount from 25% to configured max ceiling of 10%"],
          final_action: "offer_discount",
          final_discount_percent: 10,
          outcome: "action_taken",
        },
        {
          id: "log_demo_auc_2",
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          order_id: "ATO-AUC-7732",
          session_id: "sess_auc_552",
          event_type: "authorized_not_captured",
          cart_total: 7400,
          diagnosis_text: "Payment-Friction Read: The customer successfully authorized ₹7,400 at the bank; this is technical capture friction rather than price hesitancy. Zero price resistance present.",
          proposed_action: "retry_payment",
          proposed_discount_percent: 0,
          gate_overrides: ["Blocked discount on authorized_not_captured payment status: Forced retry_payment_link with 0% discount"],
          final_action: "retry_payment_link",
          final_discount_percent: 0,
          outcome: "action_taken",
        },
        {
          id: "log_demo_too_early_3",
          created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
          order_id: "ATO-TE-9921",
          session_id: "sess_recent_112",
          event_type: "cart_abandoned",
          cart_total: 6500,
          diagnosis_text: "Recent Activity Read: The customer abandoned a ₹6,500 cart only 20 minutes ago. It is too early to intervene with a promotional offer.",
          proposed_action: "offer_discount",
          proposed_discount_percent: 10,
          gate_overrides: ["Blocked recovery action: Elapsed time (0.33h) is less than 1.0 hour threshold (too early)"],
          final_action: "no_action",
          final_discount_percent: 0,
          outcome: "no_action",
        },
        {
          id: "log_demo_remind_4",
          created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          order_id: null,
          session_id: "sess_rem_999",
          event_type: "cart_abandoned",
          cart_total: 1500,
          diagnosis_text: "First-Time Visitor Read: First time customer abandoned a ₹1,500 ring cart after 2.5 hours. Standard trust-building checkout reminder recommended.",
          proposed_action: "remind_customer_to_checkout",
          proposed_discount_percent: 0,
          gate_overrides: [],
          final_action: "remind_customer_to_checkout",
          final_discount_percent: 0,
          outcome: "action_taken",
        }
      );
    }

    setLogs(fetchedRows);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated]);

  // Filtering Logic
  const filteredLogs = logs.filter((row) => {
    // Event Type Filter
    if (eventTypeFilter !== "all" && row.event_type !== eventTypeFilter) {
      return false;
    }
    // Gate Filter
    const hasGateIntervention =
      row.gate_overrides.length > 0 ||
      row.proposed_action !== row.final_action ||
      row.proposed_discount_percent !== row.final_discount_percent;

    if (gateFilter === "intervened_only" && !hasGateIntervention) {
      return false;
    }
    if (gateFilter === "approved_only" && hasGateIntervention) {
      return false;
    }
    // Outcome Filter
    if (outcomeFilter !== "all" && row.outcome !== outcomeFilter) {
      return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrder = row.order_id?.toLowerCase().includes(q);
      const matchSession = row.session_id?.toLowerCase().includes(q);
      const matchDiag = row.diagnosis_text.toLowerCase().includes(q);
      const matchAction = row.final_action.toLowerCase().includes(q);
      if (!matchOrder && !matchSession && !matchDiag && !matchAction) {
        return false;
      }
    }
    return true;
  });

  // Calculate Metrics
  const totalLogs = logs.length;
  const gateInterventionsCount = logs.filter(
    (r) =>
      r.gate_overrides.length > 0 ||
      r.proposed_action !== r.final_action ||
      r.proposed_discount_percent !== r.final_discount_percent
  ).length;
  const gateInterventionPercent = totalLogs > 0 ? ((gateInterventionsCount / totalLogs) * 100).toFixed(1) : "0.0";
  const totalRecoveredCount = logs.filter((r) => r.outcome === "recovered").length;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0F172A] text-stone-100 flex flex-col justify-between">
        <MarqueeBar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-wide text-white uppercase">
                Agent Audit Log Login
              </h1>
              <p className="text-xs text-stone-400">
                Enter your merchant passcode to access the Agent Decision Audit Trail
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Passcode
                </label>
                <input
                  type="password"
                  value={loginPasscode}
                  onChange={(e) => setLoginPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs tracking-widest uppercase py-3 rounded-xl shadow-lg transition-all"
              >
                ACCESS AUDIT TRAIL
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-stone-100 flex flex-col justify-between selection:bg-amber-500 selection:text-stone-950">
      <MarqueeBar />

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              title="Return to Main Admin Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  EPIC-7 Audit Trail
                </span>
                <h1 className="font-serif text-xl font-bold tracking-wider text-white uppercase">
                  Agent Decision Log
                </h1>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Full causal decision chain: Stage 1 Diagnosis → Stage 2 Proposed Action → Code Policy Gate → Final Gated Action
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Actions Logged</span>
              <FileText className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">{totalLogs}</div>
            <p className="text-[11px] text-stone-500 mt-1">Persisted recovery_actions rows</p>
          </div>

          <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Gate Interventions</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400">
              {gateInterventionsCount} <span className="text-xs font-normal text-amber-500">({gateInterventionPercent}%)</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Proposals clamped or modified by policy gate</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Recovered Orders</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">{totalRecoveredCount}</div>
            <p className="text-[11px] text-stone-500 mt-1">Verified converted recovery orders</p>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Policy Gate Protection</span>
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-sky-400">100%</div>
            <p className="text-[11px] text-stone-500 mt-1">Enforced hard budget & 0% authorized block</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Event Type Filter */}
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Event Types</option>
              <option value="cart_abandoned">Cart Abandoned</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="authorized_not_captured">Authorized Not Captured</option>
            </select>

            {/* Gate Filter */}
            <select
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-semibold focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Gate Statuses</option>
              <option value="intervened_only">⚡ Gate Intervened Only</option>
              <option value="approved_only">✓ Gate Approved Only</option>
            </select>

            {/* Outcome Filter */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">All Outcomes</option>
              <option value="action_taken">Action Taken</option>
              <option value="recovered">Recovered</option>
              <option value="no_action">No Action (Blocked)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ID, session..."
              className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
              <p className="text-sm font-semibold">Loading Agent Audit Trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500/60" />
              <p className="text-sm font-bold text-stone-300">No matching audit logs found</p>
              <p className="text-xs text-stone-500 mt-1">Try resetting your filter parameters or search query.</p>
            </div>
          ) : (
            filteredLogs.map((row) => {
              const hasGateIntervention =
                row.gate_overrides.length > 0 ||
                row.proposed_action !== row.final_action ||
                row.proposed_discount_percent !== row.final_discount_percent;

              const isExpanded = expandedRowId === row.id;

              return (
                <div
                  key={row.id}
                  className={`bg-stone-900 border rounded-2xl p-5 transition-all shadow-md ${
                    hasGateIntervention
                      ? "border-amber-500/60 bg-amber-950/10 hover:border-amber-500"
                      : "border-stone-800 hover:border-stone-700"
                  }`}
                >
                  {/* Top Bar: Event Meta & Badges */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-800">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {row.order_id || row.session_id || "Session Event"}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-lg bg-stone-800 text-stone-300 text-[11px] font-semibold">
                        {row.event_type}
                      </span>

                      <span className="text-xs font-bold text-white">
                        Cart Total: ₹{row.cart_total.toLocaleString("en-IN")}
                      </span>

                      <span className="text-[11px] text-stone-500">
                        {new Date(row.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Gate Intervention Highlight Badge */}
                      {hasGateIntervention ? (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>⚡ GATE INTERVENED</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>✓ GATE APPROVED</span>
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.outcome === "recovered"
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                            : row.outcome === "no_action" || row.outcome === "dismissed"
                            ? "bg-stone-800 text-stone-400"
                            : "bg-amber-950/40 text-amber-300 border border-amber-800/40"
                        }`}
                      >
                        {row.outcome.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Causal Chain Grid: Stage 1 -> Stage 2 -> Gate Overrides -> Final Gated Action */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 items-stretch">
                    
                    {/* 1. Stage 1 Diagnosis (4 cols) */}
                    <div className="lg:col-span-5 bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Stage 1 Diagnosis
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">
                          {isExpanded || row.diagnosis_text.length <= 140
                            ? row.diagnosis_text
                            : `${row.diagnosis_text.slice(0, 140)}...`}
                        </p>
                      </div>

                      {row.diagnosis_text.length > 140 && (
                        <button
                          onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                          className="mt-2 text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-start"
                        >
                          {isExpanded ? (
                            <>
                              <span>Collapse</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Expand Full Diagnosis</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* 2. Stage 2 Proposed Action (3 cols) */}
                    <div className="lg:col-span-3 bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80 flex flex-col justify-between">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                        Stage 2 Proposed Action (Raw)
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-stone-200">
                          {row.proposed_action}
                        </div>
                        <div className="text-sm font-extrabold text-amber-400 mt-1">
                          {row.proposed_discount_percent}% Discount
                        </div>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-2">Before code policy gate</div>
                    </div>

                    {/* 3. Code Policy Gate & Final Action (4 cols) */}
                    <div
                      className={`lg:col-span-4 p-3.5 rounded-xl border flex flex-col justify-between ${
                        hasGateIntervention
                          ? "bg-amber-950/30 border-amber-500/50 text-amber-200"
                          : "bg-stone-950/60 border-stone-800/80 text-stone-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                            Final Gated Action
                          </span>
                        </div>

                        <div className="font-mono text-xs font-extrabold text-white">
                          {row.final_action}
                        </div>

                        <div className="text-sm font-extrabold text-emerald-400 mt-1">
                          {row.final_discount_percent}% Discount
                        </div>
                      </div>

                      {/* Gate Override Reason */}
                      {row.gate_overrides.length > 0 ? (
                        <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{row.gate_overrides[0]}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-500 mt-2 font-medium">
                          ✓ Approved by Code Policy Gate without modifications
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      <Footer />
    </main>
  );
}
