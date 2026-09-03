import type { Metadata } from "next";
import "./globals.css";
import FloatingAiStylist from "@/components/ai-stylist/FloatingAiStylist";

export const metadata: Metadata = {
  title: "Ayush Traders Ornaments — Trust · Purity · Elegance",
  description: "Official online store for Ayush Traders Ornaments (AT Ornaments). Handcrafted 925 Sterling Silver and Fine Artificial Jewellery.",
  keywords: ["Ayush Traders", "AT Ornaments", "Silver Jewellery", "925 Sterling Silver", "Payal", "Chains", "Rings", "Bracelets"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased selection:bg-brand-gold selection:text-brand-green-dark">
        {children}
        <FloatingAiStylist />
      </body>
    </html>
  );
}
