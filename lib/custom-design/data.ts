import { saveCustomDesignRequestToSupabase } from "../supabase/customDesign";

export type CustomDesignStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "MODIFICATION_REQUESTED"
  | "QUOTE_SENT"
  | "CUSTOMER_APPROVED"
  | "DECLINED"
  | "CONVERTED_TO_ORDER";

export interface CustomDesignVersion {
  version: number;
  imageUrl: string;
  requirements: {
    material: "925 Sterling Silver" | "Artificial Jewellery";
    style: string;
    thickness?: string;
    stones?: string;
    stoneCount?: number;
    stoneColor?: string;
    charms?: string;
    size?: string;
    engraving?: string;
    budget?: number;
    additionalNotes?: string;
  };
  aiEstimateMin: number;
  aiEstimateMax: number;
  createdAt: string;
}

export interface CustomDesignRequest {
  id: string; // ATO-CD-XXXX
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  category: "bracelet" | "ring" | "chain" | "anklet";
  baseProductId?: string;
  material: "925 Sterling Silver" | "Artificial Jewellery";
  style: string;
  thickness?: string;
  stones?: string;
  stoneCount?: number;
  stoneColor?: string;
  charms?: string;
  size?: string;
  engraving?: string;
  budget?: number;
  designDescription: string;
  designImage: string; // Active version image DataURL/URL
  currentVersion: number;
  versions?: CustomDesignVersion[];
  customerNotes?: string;
  aiEstimateMin: number;
  aiEstimateMax: number;
  merchantDecision?: "APPROVED" | "REJECTED" | "MODIFICATION_REQUESTED";
  merchantNotes?: string;
  finalWeightGrams?: number;
  makingCharge?: number;
  finalPrice?: number;
  estimatedCompletionDays?: number;
  status: CustomDesignStatus;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_DEMO_CUSTOM_REQUESTS: CustomDesignRequest[] = [
  {
    id: "ATO-CD-1047",
    customerName: "Vikram Malhotra",
    customerPhone: "+91 98765 12345",
    customerEmail: "vikram@example.com",
    category: "bracelet",
    material: "925 Sterling Silver",
    style: "Minimalist Delicate",
    thickness: "Delicate (2mm)",
    stones: "Zircon Crystals",
    stoneCount: 3,
    stoneColor: "Sapphire Blue",
    charms: "Floral Lotus",
    size: "7.5 Inches",
    budget: 3500,
    designDescription: "Delicate silver link bracelet with 3 small blue zircon stones and a tiny lotus charm.",
    designImage: "/Delicate Infinity Silver Bracelet.png",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        imageUrl: "/Delicate Infinity Silver Bracelet.png",
        requirements: {
          material: "925 Sterling Silver",
          style: "Minimalist Delicate",
          thickness: "Delicate (2mm)",
          stones: "Zircon Crystals",
          stoneCount: 3,
          stoneColor: "Sapphire Blue",
          charms: "Floral Lotus",
          size: "7.5 Inches",
          budget: 3500,
          additionalNotes: "For sister's graduation gift.",
        },
        aiEstimateMin: 3200,
        aiEstimateMax: 4100,
        createdAt: "23 Aug 2026",
      },
    ],
    customerNotes: "Please ensure the clasp is secure and durable.",
    aiEstimateMin: 3200,
    aiEstimateMax: 4100,
    status: "UNDER_REVIEW",
    createdAt: "23 Aug 2026, 04:15 PM",
    updatedAt: "23 Aug 2026, 04:15 PM",
  },
];

export function getCustomDesignRequests(): CustomDesignRequest[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_CUSTOM_REQUESTS;

  try {
    const saved = localStorage.getItem("at_custom_design_requests");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading custom design requests:", e);
  }

  return DEFAULT_DEMO_CUSTOM_REQUESTS;
}

export function saveCustomDesignRequest(request: CustomDesignRequest) {
  if (typeof window === "undefined") return;
  const current = getCustomDesignRequests();
  const index = current.findIndex((r) => r.id === request.id);
  let updated: CustomDesignRequest[];

  if (index >= 0) {
    updated = current.map((r) => (r.id === request.id ? request : r));
  } else {
    updated = [request, ...current];
  }

  localStorage.setItem("at_custom_design_requests", JSON.stringify(updated));

  // Asynchronously persist to Supabase
  saveCustomDesignRequestToSupabase(request).catch((err) => {
    console.warn("Supabase async saveCustomDesignRequest failed:", err);
  });
}

export function generateCustomRequestId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ATO-CD-${num}`;
}
