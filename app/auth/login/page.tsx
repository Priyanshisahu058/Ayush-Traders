"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Gift,
  Award,
  Sparkles,
} from "lucide-react";
import MarqueeBar from "@/components/layout/MarqueeBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithPhone,
  verifyPhoneOtp,
} from "@/lib/supabase/auth";

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirectUrl") || "/account";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [method, setMethod] = useState<"email" | "phone">("email");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone OTP states
  const [otpToken, setOtpToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please check and try again.");
        setLoading(false);
        return;
      }
      if (!agreedTerms) {
        setErrorMsg("Please agree to the Terms & Conditions to create an account.");
        setLoading(false);
        return;
      }
    }

    const fullName = mode === "signup" ? `${firstName} ${lastName}`.trim() : "";

    if (mode === "signin") {
      const res = await signInWithEmail({ email, password });
      if (res.error) {
        setErrorMsg(res.error.message);
        setLoading(false);
      } else {
        setSuccessMsg("Welcome back! Signed in successfully. Redirecting...");
        setTimeout(() => router.push(redirectUrl), 1000);
      }
    } else {
      const res = await signUpWithEmail({ email, password, fullName, phone });
      if (res.error) {
        setErrorMsg(res.error.message);
        setLoading(false);
      } else {
        setSuccessMsg("Account created successfully! Redirecting...");
        setTimeout(() => router.push(redirectUrl), 1200);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    const res = await signInWithGoogle(redirectUrl);
    if (res.error) {
      setErrorMsg(res.error.message);
      setGoogleNotice("Note: Google OAuth requires client credentials configured in Supabase Dashboard.");
      setLoading(false);
    }
  };

  const handlePhoneRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const res = await signInWithPhone(formattedPhone);

    if (res.error) {
      setErrorMsg(res.error.message);
      setLoading(false);
    } else {
      setOtpSent(true);
      setSuccessMsg(`OTP sent to ${formattedPhone}! Enter code below.`);
      setLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const res = await verifyPhoneOtp(formattedPhone, otpToken);

    if (res.error) {
      setErrorMsg(res.error.message);
      setLoading(false);
    } else {
      setSuccessMsg("Phone OTP verified successfully! Redirecting...");
      setTimeout(() => router.push(redirectUrl), 1000);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900 font-sans">
      <MarqueeBar />
      <Navbar />

      {/* Main Section with Side Backdrop Imagery */}
      <section className="relative py-12 sm:py-16 flex-1 flex items-center justify-center px-4 overflow-hidden">
        
        {/* Background Decorative Jewellery Image (Right Side) */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-35 pointer-events-none hidden lg:block overflow-hidden">
          <img
            src="/hero image.png"
            alt="Ayush Traders Fine Jewellery Backdrop"
            className="w-full h-full object-cover object-left"
          />
        </div>

        <div className="relative z-10 w-full max-w-md sm:max-w-lg space-y-6">
          
          {/* Centered Top Brand Logo Header */}
          <div className="text-center flex flex-col items-center space-y-1">
            <div className="relative w-16 h-16 mb-1">
              <img
                src="/logo 1.png"
                alt="Ayush Traders Ornaments Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#1C2B26] uppercase">
              AYUSH TRADERS
            </h2>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-semibold text-stone-600 uppercase">
              <span className="h-[1px] w-6 bg-stone-400"></span>
              <span>2006 ESTABLISHED</span>
              <span className="h-[1px] w-6 bg-stone-400"></span>
            </div>
          </div>

          {/* Luxury White Auth Card */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/80 shadow-xl space-y-6">
            
            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                {mode === "signin"
                  ? "Login to continue shopping your favorite silver jewellery."
                  : "Join Ayush Traders and explore our exclusive collection."}
              </p>
              
              {/* Decorative Accent Symbol */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[#C9A45C]">
                <span className="h-[1px] w-8 bg-[#C9A45C]/40"></span>
                <span className="text-[10px]">◆</span>
                <span className="h-[1px] w-8 bg-[#C9A45C]/40"></span>
              </div>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {googleNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                {googleNotice}
              </div>
            )}

            {/* METHOD TOGGLE BUTTONS (Email / Phone) */}
            <div className="flex items-center justify-center gap-4 text-xs font-semibold border-b border-stone-200 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMethod("email");
                  setErrorMsg("");
                }}
                className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                  method === "email"
                    ? "border-[#1C2B26] text-[#1C2B26] font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email & Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod("phone");
                  setErrorMsg("");
                }}
                className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                  method === "phone"
                    ? "border-[#1C2B26] text-[#1C2B26] font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone OTP</span>
              </button>
            </div>

            {/* EMAIL FORM */}
            {method === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 text-xs">
                
                {/* SIGN UP NAME FIELDS (2 Column Grid) */}
                {mode === "signup" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Enter your first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Enter your last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* EMAIL ADDRESS FIELD */}
                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                    />
                  </div>
                </div>

                {/* PHONE NUMBER FIELD (Sign Up Only) */}
                {mode === "signup" && (
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Phone Number <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                      />
                    </div>
                  </div>
                )}

                {/* PASSWORD FIELD */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-700 text-[11px]">
                      Password <span className="text-red-500">*</span>
                    </label>
                    {mode === "signin" && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert("Password reset instructions will be sent to your email.");
                        }}
                        className="text-[11px] font-bold text-[#C9A45C] hover:underline"
                      >
                        Forgot Password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={mode === "signin" ? "Enter your password" : "Create a password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-10 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD FIELD (Sign Up Only) */}
                {mode === "signup" && (
                  <div>
                    <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-10 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* CHECKBOXES */}
                {mode === "signin" ? (
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-stone-300 text-[#1C2B26] focus:ring-0"
                    />
                    <label htmlFor="rememberMe" className="text-[11px] font-semibold text-stone-600 cursor-pointer">
                      Remember me
                    </label>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 py-1">
                    <input
                      type="checkbox"
                      id="agreedTerms"
                      required
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-stone-300 text-[#1C2B26] focus:ring-0"
                    />
                    <label htmlFor="agreedTerms" className="text-[11px] font-medium text-stone-600 leading-tight">
                      I agree to the <span className="font-bold text-stone-800 underline">Terms & Conditions</span> and{" "}
                      <span className="font-bold text-stone-800 underline">Privacy Policy</span>
                    </label>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1C2B26] hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <span>{loading ? "Processing..." : mode === "signin" ? "LOGIN" : "SIGN UP"}</span>
                  <ArrowRight className="w-4 h-4 text-[#C9A45C]" />
                </button>

              </form>
            )}

            {/* PHONE OTP FORM */}
            {method === "phone" && (
              <div className="space-y-4 text-xs">
                {!otpSent ? (
                  <form onSubmit={handlePhoneRequestOtp} className="space-y-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                        10-Digit Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="bg-stone-100 border border-stone-300 px-3.5 py-3 rounded-xl font-bold text-stone-700">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#1C2B26]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1C2B26] text-white font-bold text-xs uppercase py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <span>{loading ? "Sending OTP..." : "Send Verification OTP"}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneVerifyOtp} className="space-y-4">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1 text-[11px]">
                        Enter 6-Digit OTP Token <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123456"
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 font-bold tracking-widest text-center text-base focus:outline-none focus:border-[#1C2B26]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1C2B26] text-white font-bold text-xs uppercase py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <span>{loading ? "Verifying..." : "Verify OTP & Continue"}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SOCIAL AUTH SEPARATOR */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-stone-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] font-semibold text-stone-400 uppercase tracking-widest absolute">
                {mode === "signin" ? "or continue with" : "or sign up with"}
              </span>
            </div>

            {/* SOCIAL SIGN IN BUTTONS */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("Apple Sign-In is configured via Supabase Dashboard OAuth providers.");
                }}
                className="w-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4 fill-current text-stone-900" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.11-1 .04-2.19.67-2.89 1.49-.62.72-1.16 1.88-1.01 3.01 1.11.09 2.24-.56 2.91-1.39z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* SWITCH MODE LINK */}
            <div className="pt-2 text-center text-xs">
              {mode === "signin" ? (
                <p className="text-stone-600">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="font-bold text-[#C9A45C] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-stone-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="font-bold text-[#C9A45C] hover:underline"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* BOTTOM FEATURE STRIP CARD (Matching Design Mockup) */}
      <section className="bg-[#EFEAE1] border-t border-stone-300 py-6 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="flex flex-col items-center space-y-1">
            <Award className="w-5 h-5 text-[#C9A45C]" />
            <h4 className="font-bold text-xs text-stone-900">100% Hallmark Silver</h4>
            <p className="text-[10px] text-stone-500 font-medium">Authentic & Certified</p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <Truck className="w-5 h-5 text-[#C9A45C]" />
            <h4 className="font-bold text-xs text-stone-900">Free Shipping</h4>
            <p className="text-[10px] text-stone-500 font-medium">On all orders above ₹0</p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <Gift className="w-5 h-5 text-[#C9A45C]" />
            <h4 className="font-bold text-xs text-stone-900">Free Surprise Gift</h4>
            <p className="text-[10px] text-stone-500 font-medium">On orders above ₹499</p>
          </div>

          <div className="flex flex-col items-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-[#C9A45C]" />
            <h4 className="font-bold text-xs text-stone-900">Secure Payment</h4>
            <p className="text-[10px] text-stone-500 font-medium">100% Safe & Secure</p>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center text-xs font-bold text-stone-600">Loading Auth...</div>}>
      <AuthFormContent />
    </Suspense>
  );
}
