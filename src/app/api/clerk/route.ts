import { Webhook } from "svix";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse, } from "next/server";

interface WebhookEvent {
  data: {
    id: string;
    status?: string;
    plan?: {
      name: string;
    };
    payer?: {
      user_id: string;
    };
    user_id?: string;
  };
  type: string;
}

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, headers) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;
  
  let currentPlan: "FREE" | "PRO" | undefined;
   
  if(eventType === "subscriptionItem.active" && data.plan?.name === "PRO"){
    currentPlan = "PRO";
  } else if (eventType === "subscriptionItem.active" && data.plan?.name === "Free") {
    currentPlan = "FREE";
  } else {
    currentPlan = undefined;
  }


  try {
    const clerkUserId = data?.payer?.user_id ?? data?.id ?? data?.user_id;
    if (!clerkUserId) {
      return NextResponse.json({ error: "Missing user id in webhook" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      console.warn("User Does Not Exist in DB", clerkUserId);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    let newPlan = user.plan;

    if (currentPlan) {
      newPlan = currentPlan;
    } 

    await db.user.update({
      where: { clerkUserId },
      data: {
        plan: newPlan,
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook processing failed", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}