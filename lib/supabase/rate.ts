import { getSupabaseClient } from "./client";

export async function fetchSilverRateFromSupabase(): Promise<number | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("silver_rate_settings")
      .select("current_rate")
      .eq("id", 1)
      .single();

    if (error || !data) return null;
    return parseFloat(data.current_rate);
  } catch (err) {
    console.warn("Supabase fetchSilverRate failed:", err);
    return null;
  }
}

export async function updateSilverRateInSupabase(rate: number): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("silver_rate_settings")
      .upsert({
        id: 1,
        current_rate: rate,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (err) {
    console.error("Supabase updateSilverRate failed:", err);
    return false;
  }
}
