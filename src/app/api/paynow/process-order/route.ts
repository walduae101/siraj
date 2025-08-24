import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";
import { ProductCatalogService } from "~/server/services/productCatalog";
import { WalletLedgerService } from "~/server/services/walletLedger";

export async function POST(req: NextRequest) {
  try {
    const { orderId, userId } = await req.json();
    
    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Missing orderId or userId" },
        { status: 400 }
      );
    }

    console.log(`[process-order] Processing order ${orderId} for user ${userId}`);

    // Get PayNow order details
    const config = await getConfig();
    
    // Try different PayNow API endpoints
    let order = null;
    let paynowResponse = null;
    
    // First try with the order ID as-is
    try {
      paynowResponse = await fetch(`https://api.paynow.gg/v1/orders/${orderId}`, {
        headers: {
          "Authorization": `Bearer ${config.paynow.apiKey}`,
          "Content-Type": "application/json",
        },
      });
      
      if (paynowResponse.ok) {
        order = await paynowResponse.json();
        console.log(`[process-order] Found order with ID ${orderId}`);
      }
    } catch (error) {
      console.log(`[process-order] Failed to fetch order with ID ${orderId}:`, error);
    }
    
    // If not found, try with store prefix
    if (!order && !orderId.startsWith(config.paynow.storeId)) {
      try {
        const storeOrderId = `${config.paynow.storeId}-${orderId}`;
        paynowResponse = await fetch(`https://api.paynow.gg/v1/orders/${storeOrderId}`, {
          headers: {
            "Authorization": `Bearer ${config.paynow.apiKey}`,
            "Content-Type": "application/json",
          },
        });
        
        if (paynowResponse.ok) {
          order = await paynowResponse.json();
          console.log(`[process-order] Found order with store prefix: ${storeOrderId}`);
        }
      } catch (error) {
        console.log(`[process-order] Failed to fetch order with store prefix:`, error);
      }
    }
    
    // If still not found, try listing orders to find it
    if (!order) {
      try {
        console.log(`[process-order] Order not found, trying to list orders...`);
        paynowResponse = await fetch(`https://api.paynow.gg/v1/stores/${config.paynow.storeId}/orders?limit=10`, {
          headers: {
            "Authorization": `Bearer ${config.paynow.apiKey}`,
            "Content-Type": "application/json",
          },
        });
        
        if (paynowResponse.ok) {
          const ordersList = await paynowResponse.json();
          console.log(`[process-order] Found ${ordersList.length} recent orders`);
          
          // Look for order with matching ID or customer
          order = ordersList.find((o: any) => 
            o.id === orderId || 
            o.pretty_id === orderId ||
            o.customer?.metadata?.uid === userId
          );
          
          if (order) {
            console.log(`[process-order] Found matching order: ${order.id}`);
          }
        }
      } catch (error) {
        console.log(`[process-order] Failed to list orders:`, error);
      }
    }

    if (!order) {
      console.error(`[process-order] Order not found after all attempts`);
      return NextResponse.json(
        { error: "Order not found in PayNow" },
        { status: 404 }
      );
    }

    console.log(`[process-order] Order status: ${order.status}, payment_state: ${order.payment_state}`);

    // Check if order is paid
    if (order.payment_state !== "paid" || order.status !== "completed") {
      return NextResponse.json(
        { error: `Order not paid (status=${order.status}, payment=${order.payment_state})` },
        { status: 400 }
      );
    }

    // Ensure user document exists
    const db = await getDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      await userRef.set({
        uid: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      });
    }

    let totalCredited = 0;
    const results = [];

    // Process each line item
    for (const line of order.lines ?? []) {
      const productId = String(line.product_id);
      const quantity = Number(line.quantity ?? 1);

      // Get product points
      let points: number | null = null;
      let productSource = "unknown";
      
      // Try Firestore first
      const product = await ProductCatalogService.getProductByPayNowId(productId);
      if (product) {
        points = product.points;
        productSource = "firestore";
      } else {
        // Fallback to config mapping
        const gsmProduct = await ProductCatalogService.getProductFromGSM(productId);
        if (gsmProduct) {
          points = gsmProduct.points;
          productSource = "gsm";
        }
      }

      if (points && quantity > 0) {
        const delta = points * quantity;

        // Create ledger entry
        const { ledgerId, newBalance } = await WalletLedgerService.createLedgerEntry(
          userId,
          {
            amount: delta,
            currency: "POINTS",
            kind: "purchase",
            status: "posted",
            source: {
              eventId: order.id,
              orderId: order.pretty_id || order.id,
              productId: product?.id,
              productVersion: product?.version,
            },
          },
          "system:process-order",
        );

        console.log(`[process-order] Credited ${delta} points for product ${productId} (source: ${productSource})`);
        
        totalCredited += delta;
        results.push({
          productId,
          quantity,
          points: delta,
          productSource,
          ledgerId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      credited: totalCredited,
      orderId: order.pretty_id || order.id,
      items: results,
    });

  } catch (error) {
    console.error("[process-order] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
