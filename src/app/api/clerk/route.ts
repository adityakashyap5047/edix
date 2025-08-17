import { Webhook } from "svix";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse, } from "next/server";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  // const svixHeaders = {
  //   "svix-id": req.headers["svix-id"] as string,
  //   "svix-timestamp": req.headers["svix-timestamp"] as string,
  //   "svix-signature": req.headers["svix-signature"] as string,
  // };

  const wh = new Webhook(webhookSecret);

  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error("❌ Error verifying webhook:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // const wh = new Webhook(webhookSecret);
  // let evt: any;

  // try {
  //   evt = wh.verify(payload, svixHeaders);
  // } catch (err) {
  //   console.error("Webhook verification failed", err);
  //   return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  // }

  const eventId = evt.data.id;
  const eventType = evt.type;
  const data = evt.data;
  console.log("**********************************", evt.type, " - ", evt.data.status);
  console.log(evt)

  try {
    // find user
    const clerkUserId = data?.payer?.user_id ?? data?.id ?? data?.user_id;
    if (!clerkUserId) {
      return NextResponse.json({ error: "Missing user id in webhook" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      console.warn("User not found for clerkUserId", clerkUserId);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    // idempotency check
    if (user.lastWebhookId === eventId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    let newPlan = user.plan;

    if (eventType === "subscription.created" || eventType === "subscription.updated") {
      const status = data.status; // "active" | "trialing" | "past_due" | "canceled"
      if (status === "active" || status === "trialing") {
        newPlan = "PRO"; // upgrade
      } else {
        newPlan = "FREE"; // fallback if canceled/past_due
      }
    } else if (eventType === "subscription.deleted") {
      newPlan = "FREE"; // downgrade
    }

    // find user
    await db.user.update({
      where: { clerkUserId },
      data: {
        plan: newPlan,
        lastWebhookId: eventId,
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook processing failed", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
