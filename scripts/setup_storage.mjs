import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) throw new Error(".env.local not found");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const envVars = loadEnv();
const supabase = createClient(envVars["NEXT_PUBLIC_SUPABASE_URL"], envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

async function setupProductImageStorage() {
  console.log("=== CHECKING & INITIALIZING SUPABASE PRODUCT IMAGES STORAGE BUCKET ===");

  const BUCKET_NAME = "product-images";

  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.warn("Could not list buckets with anon key (requires bucket policies):", listErr.message);
  } else {
    console.log("Existing buckets:", buckets.map((b) => b.name));
  }

  const existingBucket = buckets?.find((b) => b.name === BUCKET_NAME);

  if (!existingBucket) {
    console.log(`Creating public storage bucket '${BUCKET_NAME}'...`);
    const { data: createData, error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB limit
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/jpg", "image/avif"],
    });

    if (createErr) {
      console.warn("Note on bucket creation:", createErr.message);
    } else {
      console.log("Bucket created successfully:", createData);
    }
  } else {
    console.log(`Bucket '${BUCKET_NAME}' already exists!`);
  }

  // Test Upload
  console.log("\nTesting test file upload to product-images/test/ping.txt ...");
  const testBuffer = Buffer.from("AT Ornaments Storage Ping Test");
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(BUCKET_NAME)
    .upload("test/ping.txt", testBuffer, {
      contentType: "text/plain",
      upsert: true,
    });

  if (uploadErr) {
    console.warn("Storage upload test result:", uploadErr.message);
  } else {
    console.log("Upload test PASS! Path:", uploadData.path);
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);
    console.log("Public URL:", urlData.publicUrl);
  }
}

setupProductImageStorage();
