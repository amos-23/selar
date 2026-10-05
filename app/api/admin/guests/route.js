import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { mutate } from "@/lib/store";
import { guestsFromCsv } from "@/lib/guests";

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { csv } = await req.json().catch(() => ({}));
  if (typeof csv !== "string" || !csv.trim()) return NextResponse.json({ error: "No CSV provided." }, { status: 400 });
  const result = await mutate((db) => {
    const { guests, errors } = guestsFromCsv(csv, db.guests);
    db.guests.push(...guests);
    return { added: guests.length, errors };
  });
  return NextResponse.json(result);
}
