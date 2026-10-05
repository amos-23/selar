import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";

// Optional: point a Resend webhook (email.delivered) at /api/webhooks/resend?secret=$WEBHOOK_SECRET
// so the dashboard's "Delivered" count reflects real delivery.
export async function POST(req) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || new URL(req.url).searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const evt = await req.json().catch(() => null);
  const tags = evt?.data?.tags;
  const guestId = Array.isArray(tags) ? tags.find((t) => t.name === "guest")?.value : tags?.guest;
  if (evt?.type === "email.delivered" && guestId) {
    await mutate((db) => {
      const g = db.guests.find((x) => x.id === guestId);
      if (g && !g.deliveredAt) g.deliveredAt = new Date().toISOString();
    });
  }
  return NextResponse.json({ ok: true });
}
