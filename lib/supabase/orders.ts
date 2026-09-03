import { getSupabaseClient } from "./client";

export interface SupabaseOrderPayload {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: any;
  subtotal: number;
  gst: number;
  shippingCharge: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  currentStageIndex: number;
  awbNumber?: string;
  shipmentId?: string;
  silverRateAtPurchase: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    weight?: number;
    unitPrice: number;
    totalPrice: number;
    selectedSize?: string;
    image?: string;
  }>;
}

export async function saveOrderToSupabase(order: SupabaseOrderPayload): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const orderRow = {
      id: order.orderId,
      order_number: order.orderNumber,
      customer_id: order.customerId || null,
      customer_name: order.customerName,
      email: order.email,
      phone: order.phone,
      shipping_address: order.shippingAddress,
      subtotal: order.subtotal,
      gst: order.gst,
      shipping_charge: order.shippingCharge,
      total: order.total,
      payment_status: order.paymentStatus || "Attempted Online",
      order_status: order.orderStatus || "Payment Pending",
      current_stage_index: order.currentStageIndex ?? 0,
      awb_number: order.awbNumber || "",
      shipment_id: order.shipmentId || "",
      silver_rate_at_purchase: order.silverRateAtPurchase,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: orderError } = await supabase.from("orders").upsert(orderRow);
    if (orderError) {
      console.error("Supabase saveOrder error:", orderError);
      return false;
    }

    const itemRows = order.items.map((item) => ({
      order_id: order.orderId,
      product_id: item.productId,
      product_name_snapshot: item.productName,
      quantity: item.quantity,
      weight_snapshot: item.weight || null,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      selected_size: item.selectedSize || "",
      image_snapshot: item.image || "",
    }));

    const { error: itemError } = await supabase.from("order_items").insert(itemRows);
    if (itemError) {
      console.error("Supabase saveOrderItems error:", itemError);
    }

    return true;
  } catch (err) {
    console.error("Supabase saveOrder failed:", err);
    return false;
  }
}

export async function fetchOrdersFromSupabase(): Promise<any[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError || !ordersData) return null;

    const { data: itemsData } = await supabase.from("order_items").select("*");

    return ordersData.map((ord: any) => {
      const matchedItems = (itemsData || [])
        .filter((item: any) => item.order_id === ord.id)
        .map((item: any) => ({
          id: item.product_id,
          name: item.product_name_snapshot,
          price: parseFloat(item.unit_price),
          quantity: item.quantity,
          image: item.image_snapshot,
          selectedSize: item.selected_size,
          weight: item.weight_snapshot ? parseFloat(item.weight_snapshot) : undefined,
        }));

      return {
        orderId: ord.order_number || ord.id,
        rawId: ord.id,
        date: new Date(ord.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        customer: {
          fullName: ord.customer_name,
          email: ord.email,
          phone: ord.phone,
          address: ord.shipping_address?.address || "",
          city: ord.shipping_address?.city || "",
          state: ord.shipping_address?.state || "",
          pincode: ord.shipping_address?.pincode || "",
        },
        items: matchedItems,
        total: parseFloat(ord.total),
        subtotal: parseFloat(ord.subtotal),
        gst: parseFloat(ord.gst),
        shippingCharge: parseFloat(ord.shipping_charge),
        currentStageIndex: ord.current_stage_index,
        silverRateAtPurchase: parseFloat(ord.silver_rate_at_purchase),
        paymentStatus: ord.payment_status,
        orderStatus: ord.order_status,
        awb: ord.awb_number,
        courier: ord.courier || "Shiprocket Express",
      };
    });
  } catch (err) {
    console.warn("Supabase fetchOrders failed, falling back to local state:", err);
    return null;
  }
}

export async function updateOrderStatusInSupabase(
  orderId: string,
  stageIndex: number
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const STAGE_LABELS = [
      "Order Confirmed",
      "Packed",
      "Dispatched",
      "Out for Delivery",
      "Delivered",
    ];

    const { error } = await supabase
      .from("orders")
      .update({
        current_stage_index: stageIndex,
        order_status: STAGE_LABELS[stageIndex] || "Dispatched",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return !error;
  } catch (err) {
    console.error("Supabase updateOrderStatus failed:", err);
    return false;
  }
}
