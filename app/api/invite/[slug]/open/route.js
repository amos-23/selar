import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";

// Records the first time a guest opens their invitation. An open also implies the email was delivered.
export async function POST(_req, { params }) {
  const found = await mutate((db) => {
    const g = db.guests.find((x) => x.slug === params.slug);
    if (!g) return false;
    if (!g.openedAt) g.openedAt = new Date().toISOString();
    if (!g.deliveredAt) g.deliveredAt = g.openedAt;
    return true;
  });
  return NextResponse.json({ ok: found }, { status: found ? 200 : 404 });
}
