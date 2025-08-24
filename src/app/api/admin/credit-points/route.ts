import { type NextRequest, NextResponse } from "next/server";
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
        { status: 400 },
      );
    }

    console.log(
      `[admin/credit-points] Processing order ${orderId} for user ${userId}`,
    );

    // Get PayNow order details
    const config = await getConfig();
    const paynowResponse = await fetch(
      `https://api.paynow.gg/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${config.paynow.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!paynowResponse.ok) {
      console.error(
        `[admin/credit-points] PayNow API error: ${paynowResponse.status}`,
      );
      return NextResponse.json(
        { error: "Failed to fetch order from PayNow" },
        { status: 500 },
      );
    }

    const order = await paynowResponse.json();
    console.log(
      `[admin/credit-points] Order status: ${order.status}, payment_state: ${order.payment_state}`,
    );

    // Check if order is paid
    if (order.payment_state !== "paid" || order.status !== "completed") {
      return NextResponse.json(
        {
          error: `Order not paid (status=${order.status}, payment=${order.payment_state})`,
        },
        { status: 400 },
      );
    }

    let totalCredited = 0;
    const results = [];

    // Process each line item
    for (const line of order.lines ?? []) {
      const productId = String(line.product_id);
      const quantity = Number(line.quantity ?? 1);

      // Get product points
      let points: number | null = null;

      // Try Firestore first
      const product =
        await ProductCatalogService.getProductByPayNowId(productId);
      if (product) {
        points = product.points;
      } else {
        // Fallback to config mapping
        const gsmProduct =
          await ProductCatalogService.getProductFromGSM(productId);
        if (gsmProduct) {
          points = gsmProduct.points;
        }
      }

      if (points && quantity > 0) {
        const delta = points * quantity;

        // Create ledger entry
        const { ledgerId, newBalance } =
          await WalletLedgerService.createLedgerEntry(
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
            "admin:manual-credit",
          );

        console.log(
          `[admin/credit-points] Credited ${delta} points for product ${productId}`,
        );

        totalCredited += delta;
        results.push({
          productId,
          quantity,
          points: delta,
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
    console.error("[admin/credit-points] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
