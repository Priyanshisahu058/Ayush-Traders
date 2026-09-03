import { Product } from "@/lib/products/data";

export interface UserPreferences {
  category?: "chain" | "anklet" | "ring" | "bracelet";
  collection?: "silver" | "artificial";
  maxBudget?: number;
  minBudget?: number;
  styleKeyword?: string; // e.g. "minimal", "traditional", "heavy", "bridal", "everyday", "festive"
  occasion?: string; // e.g. "birthday", "wedding", "daily", "gift", "festive"
  recipient?: string; // e.g. "sister", "mother", "self"
  preferredWeight?: "light" | "heavy";
  avoidCategory?: string;
  avoidStyle?: string;
  rejectedProducts?: string[]; // Array of product IDs user explicitly rejected
  preferences?: string[];
}

export interface VisualContext {
  wristOrHandDetected: boolean;
  styleGuidance: string;
}

export interface StylistRecommendation {
  product: Product;
  calculatedPrice: number;
  reason: string;
  exceedsBudget?: boolean;
  score?: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "stylist";
  text: string;
  recommendations?: StylistRecommendation[];
  clarificationPills?: string[];
  timestamp: string;
}

export interface StylistResponse {
  preferences: UserPreferences;
  visualContext?: VisualContext;
  recommendations: StylistRecommendation[];
  summaryMessage: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  clarificationPills?: string[];
  followUpSuggestions: string[];
}

export interface StylistAnalyticsMetrics {
  totalSessions: number;
  recommendationsGenerated: number;
  clarificationsAsked: number;
  refinementRequests: number;
  clickedProductsCount: number;
}
