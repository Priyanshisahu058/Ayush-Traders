import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface InvoiceData {
  orderId: string;
  rawId: string;
  date: string;
  invoiceNumber?: string;
  gstin?: string;
  paymentStatus: string;
  paymentMethod?: string;
  silverRateAtPurchase?: number;
  customer: {
    fullName: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    weight?: number;
    selectedSize?: string;
    image?: string;
  }>;
  subtotal: number;
  gst?: number;
  shippingCharge?: number;
  total: number;
  freeGiftUnlocked?: boolean;
}

export function formatInvoiceNumber(rawId: string, dateStr?: string): string {
  const cleanId = (rawId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0001";
  const yearStr = "2026-27";
  return `AT/${yearStr}/${cleanId}`;
}

export async function downloadInvoicePdf(elementId: string, filename: string = "AT_Ornaments_GST_Invoice.pdf") {
  if (typeof window === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Invoice element not found:", elementId);
    return;
  }

  try {
    // Ensure all <img> tags inside element are pre-loaded
    const images = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 15000,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (err) {
    console.error("Failed to generate PDF invoice:", err);
    window.print();
  }
}
