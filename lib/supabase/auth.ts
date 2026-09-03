import { getSupabaseClient } from "./client";

export interface CustomerProfile {
  id?: string;
  auth_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface SavedAddress {
  id?: string;
  customer_id?: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

// ── AUTHENTICATION HELPERS ───────────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (e) {
    return null;
  }
}

export async function signUpWithEmail({
  email,
  password,
  fullName,
  phone = "",
}: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: { message: "Supabase client not initialized" } };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });

    if (error) return { error };

    if (data.user) {
      // Upsert profile in public.customers
      await supabase.from("customers").upsert(
        {
          auth_id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    }

    return { data, error: null };
  } catch (err: any) {
    return { error: { message: err.message || "Sign up failed" } };
  }
}

export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: { message: "Supabase client not initialized" } };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err: any) {
    return { error: { message: err.message || "Sign in failed" } };
  }
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: { message: "Supabase client not initialized" } };

  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/account${redirectTo ? `?redirectUrl=${encodeURIComponent(redirectTo)}` : ""}`
      : undefined;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { data, error };
  } catch (err: any) {
    return { error: { message: err.message || "Google sign in failed" } };
  }
}

export async function signInWithPhone(phone: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: { message: "Supabase client not initialized" } };

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  } catch (err: any) {
    return { error: { message: err.message || "Phone OTP request failed" } };
  }
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: { message: "Supabase client not initialized" } };

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    return { data, error };
  } catch (err: any) {
    return { error: { message: err.message || "OTP verification failed" } };
  }
}

export async function signOutUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {}
}

// ── CUSTOMER PROFILE & ADDRESS HELPERS ───────────────────────────────────────

export async function fetchCustomerProfile(authIdOrEmail: string): Promise<CustomerProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`auth_id.eq.${authIdOrEmail},email.eq.${authIdOrEmail}`)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      auth_id: data.auth_id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || "",
      created_at: data.created_at,
    };
  } catch (e) {
    return null;
  }
}

export async function updateCustomerProfile(profile: CustomerProfile): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("customers").upsert(
      {
        auth_id: profile.auth_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    return !error;
  } catch (e) {
    return false;
  }
}

export async function fetchCustomerAddresses(customerId: string): Promise<SavedAddress[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (e) {
    return [];
  }
}

export async function saveCustomerAddress(address: SavedAddress): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      customer_id: address.customer_id,
      full_name: address.full_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: address.is_default ?? false,
      updated_at: new Date().toISOString(),
    };

    if (address.id) {
      const { error } = await supabase.from("addresses").update(payload).eq("id", address.id);
      return !error;
    } else {
      const { error } = await supabase.from("addresses").insert(payload);
      return !error;
    }
  } catch (e) {
    return false;
  }
}

export async function deleteCustomerAddress(addressId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("addresses").delete().eq("id", addressId);
    return !error;
  } catch (e) {
    return false;
  }
}
