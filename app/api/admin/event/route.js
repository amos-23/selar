import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { mutate } from "@/lib/store";

const FIELDS = { name: 120, tagline: 240, description: 800, venue: 160, address: 240, coverImage: 500 };

export async function PUT(req) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const event = await mutate((db) => {
    for (const [k, max] of Object.entries(FIELDS)) {
      if (typeof body[k] === "string") db.event[k] = body[k].trim().slice(0, max);
    }
    for (const k of ["startsAt", "endsAt"]) {
      if (k in body) {
        const d = body[k] ? new Date(body[k]) : null;
        db.event[k] = d && !isNaN(d) ? body[k] : null;
      }
    }
    return db.event;
  });
  return NextResponse.json({ ok: true, event });
}
