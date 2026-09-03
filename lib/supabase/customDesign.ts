import { getSupabaseClient } from "./client";
import { CustomDesignRequest } from "../custom-design/data";

export async function saveCustomDesignRequestToSupabase(req: CustomDesignRequest): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: req.id,
      customer_id: req.customerId || null,
      customer_name: req.customerName,
      customer_email: req.customerEmail || "",
      customer_phone: req.customerPhone,
      category: req.category,
      material: req.material,
      style: req.style,
      thickness: req.thickness || "",
      size: req.size || "",
      stones: req.stones || "",
      charms: req.charms || "",
      engraving: req.engraving || "",
      budget: req.budget || 0,
      ai_estimate_min: req.aiEstimateMin,
      ai_estimate_max: req.aiEstimateMax,
      design_image: req.designImage,
      status: req.status,
      merchant_decision: req.merchantDecision || "",
      merchant_notes: req.merchantNotes || "",
      final_weight_grams: req.finalWeightGrams || null,
      making_charge: req.makingCharge || null,
      final_price: req.finalPrice || null,
      estimated_completion_days: req.estimatedCompletionDays || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("custom_design_requests").upsert(payload);
    if (error) {
      console.error("Supabase custom request error:", error);
      return false;
    }

    if (req.versions && req.versions.length > 0) {
      const versionRows = req.versions.map((v) => ({
        request_id: req.id,
        version_number: v.version,
        design_image: v.imageUrl,
        prompt: v.requirements?.style || "",
        specifications: v.requirements || {},
      }));

      await supabase.from("custom_design_versions").insert(versionRows);
    }

    return true;
  } catch (err) {
    console.error("Supabase saveCustomDesignRequest failed:", err);
    return false;
  }
}

export async function fetchCustomDesignRequestsFromSupabase(): Promise<CustomDesignRequest[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("custom_design_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return null;

    const { data: versionsData } = await supabase.from("custom_design_versions").select("*");

    return data.map((row: any) => {
      const versions = (versionsData || [])
        .filter((v: any) => v.request_id === row.id)
        .map((v: any) => ({
          version: v.version_number,
          imageUrl: v.design_image,
          createdAt: new Date(v.created_at).toLocaleDateString("en-IN"),
          requirements: v.specifications || {},
          aiEstimateMin: parseFloat(row.ai_estimate_min),
          aiEstimateMax: parseFloat(row.ai_estimate_max),
        }));

      return {
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        category: row.category,
        material: row.material,
        style: row.style,
        thickness: row.thickness,
        size: row.size,
        stones: row.stones,
        charms: row.charms,
        engraving: row.engraving,
        budget: row.budget ? parseFloat(row.budget) : undefined,
        designDescription: row.style,
        currentVersion: versions.length || 1,
        aiEstimateMin: parseFloat(row.ai_estimate_min),
        aiEstimateMax: parseFloat(row.ai_estimate_max),
        designImage: row.design_image,
        status: row.status,
        merchantDecision: row.merchant_decision,
        merchantNotes: row.merchant_notes,
        finalWeightGrams: row.final_weight_grams ? parseFloat(row.final_weight_grams) : undefined,
        makingCharge: row.making_charge ? parseFloat(row.making_charge) : undefined,
        finalPrice: row.final_price ? parseFloat(row.final_price) : undefined,
        estimatedCompletionDays: row.estimated_completion_days || undefined,
        createdAt: new Date(row.created_at).toLocaleDateString("en-IN"),
        updatedAt: new Date(row.updated_at || row.created_at).toLocaleDateString("en-IN"),
        versions: versions.length > 0 ? versions : undefined,
      };
    });
  } catch (err) {
    console.warn("Supabase fetchCustomDesignRequests failed, falling back to local storage:", err);
    return null;
  }
}
