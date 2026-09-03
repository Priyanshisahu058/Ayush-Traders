import { getSupabaseClient } from "./client";

/**
 * Converts a base64 Data URL to a Blob for uploading to Supabase Storage
 */
export function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting DataURL to Blob:", e);
    return new Blob([], { type: "image/jpeg" });
  }
}

/**
 * Uploads an image (File, Blob, or base64 DataURL) to Supabase Storage 'product-images' bucket
 * Returns the public URL of the stored object.
 */
export async function uploadProductImageToSupabase(
  imageData: string | File | Blob,
  productId: string = "custom"
): Promise<{ url: string | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { url: null, error: "Supabase client not initialized" };
  }

  try {
    let blob: Blob;
    let extension = "jpg";

    if (typeof imageData === "string") {
      if (imageData.startsWith("data:")) {
        blob = dataURLtoBlob(imageData);
        if (imageData.includes("image/png")) extension = "png";
        else if (imageData.includes("image/webp")) extension = "webp";
      } else {
        // If it's already an HTTP / local URL path, return directly
        return { url: imageData, error: null };
      }
    } else {
      blob = imageData;
      if (imageData.type.includes("png")) extension = "png";
      else if (imageData.type.includes("webp")) extension = "webp";
    }

    const cleanProductId = (productId || "prod").replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueFileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const filePath = `products/${cleanProductId}/${uniqueFileName}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("product-images")
      .upload(filePath, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.warn("Supabase Storage upload warning:", uploadErr.message);
      return { url: null, error: uploadErr.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(uploadData.path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error("uploadProductImageToSupabase exception:", err);
    return { url: null, error: err?.message || "Upload failed" };
  }
}
