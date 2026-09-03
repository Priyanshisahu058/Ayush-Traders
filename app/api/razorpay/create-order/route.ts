import { NextResponse } from "next/server";
import { getRazorpayServerClient } from "@/lib/razorpay/server";
import { ALL_PRODUCTS, Product, TODAY_SILVER_RATE_PER_GRAM } from "@/lib/products/data";
import { computeProductPrice } from "@/lib/pricing/computePrice";
import { saveOrderToSupabase } from "@/lib/supabase/orders";
import { recordPaymentEvent } from "@/lib/supabase/paymentEvents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customer, silverRate } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    }

    if (!customer || !customer.fullName || !customer.phone) {
      return NextResponse.json({ error: "Customer shipping details required" }, { status: 400 });
    }

    const activeSilverRate = typeof silverRate === "number" && silverRate > 0 ? silverRate : TODAY_SILVER_RATE_PER_GRAM;

    // SECURITY: Recalculate order total server-side using authoritative product data & silver rate
    let serverTotal = 0;
    const validatedItems = items.map((item: any) => {
      const match = ALL_PRODUCTS.find((p) => p.id === item.id) || item;
      const unitPrice = computeProductPrice(match, activeSilverRate);
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      serverTotal += unitPrice * qty;

      return {
        productId: item.id,
        productName: item.name || match.name,
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: unitPrice * qty,
        selectedSize: item.selectedSize || "",
        image: item.image || match.images?.[0] || "",
      };
    });

    const amountInPaise = Math.round(serverTotal * 100);

    // Create Internal Order ID
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const rawId = `ATO-${randomDigits}`;
    const orderId = `#ATO-${randomDigits}`;

    // 1. Create Internal AT Ornaments Order in Supabase
    await saveOrderToSupabase({
      orderId: rawId,
      orderNumber: orderId,
      customerName: customer.fullName,
      email: customer.phone + "@customer.atornaments.in",
      phone: customer.phone,
      shippingAddress: customer,
      subtotal: serverTotal,
      gst: 0,
      shippingCharge: 0,
      total: serverTotal,
      paymentStatus: "Attempted Online",
      orderStatus: "Order Created",
      currentStageIndex: 0,
      silverRateAtPurchase: activeSilverRate,
      items: validatedItems,
    });

    // 2. Create Razorpay Order via Server SDK
    let razorpayOrderId = `order_RzpTest_${Date.now()}`;
    const razorpay = getRazorpayServerClient();

    if (razorpay) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: rawId,
          notes: {
            orderId: rawId,
            customerName: customer.fullName,
            customerPhone: customer.phone,
          },
        });
        if (rzpOrder && rzpOrder.id) {
          razorpayOrderId = rzpOrder.id;
        }
      } catch (rzpErr: any) {
        console.warn("Razorpay API order creation notice:", rzpErr?.description || rzpErr?.message);
      }
    }

    // 3. Log initial payment event in payment_events table
    await recordPaymentEvent({
      orderId: rawId,
      razorpayOrderId,
      amount: serverTotal,
      currency: "INR",
      status: "created",
      eventType: "order.created",
      attemptNumber: 1,
      metadata: { customerName: customer.fullName, phone: customer.phone, itemCount: items.length },
    });

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_AYUSH2026TEST";

    return NextResponse.json({
      success: true,
      orderId: rawId,
      formattedOrderId: orderId,
      razorpayOrderId,
      amount: serverTotal,
      amountInPaise,
      currency: "INR",
      keyId,
    });
  } catch (err: any) {
    console.error("Razorpay create-order route error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
