import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { mutate, snapshot } from "@/lib/store";
import { MESSAGE_KINDS, recipientsFor } from "@/lib/guests";
import { buildEmail } from "@/lib/email";
import { mailConfigured, sendMail } from "@/lib/mail";
import { siteUrl, inviteUrl } from "@/lib/site";

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { kind, guestIds, message } = await req.json().catch(() => ({}));
  if (!(kind in MESSAGE_KINDS)) return NextResponse.json({ error: "Unknown message type." }, { status: 400 });
  if (kind === "update" && !String(message ?? "").trim()) {
    return NextResponse.json({ error: "Write the update message first." }, { status: 400 });
  }

  const { guests, event } = await snapshot();
  let targets = recipientsFor(kind, guests);
  if (Array.isArray(guestIds)) targets = targets.filter((g) => guestIds.includes(g.id));

  const base = siteUrl(req);
  const results = [];
  for (let i = 0; i < targets.length; i += 5) {
    const batch = targets.slice(i, i + 5);
    results.push(
      ...(await Promise.all(
        batch.map(async (guest) => {
          const mail = buildEmail(kind, { guest, event, url: inviteUrl(base, guest), message });
          const r = await sendMail({ to: guest.email, ...mail, guestId: guest.id });
          return { id: guest.id, email: guest.email, ...r };
        }),
      )),
    );
  }

  const now = new Date().toISOString();
  const okIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
  await mutate((db) => {
    for (const g of db.guests) {
      if (!okIds.has(g.id)) continue;
      if (kind === "invitation") g.sentAt = now;
      else g.remindersSent = { ...g.remindersSent, [kind]: now };
    }
  });

  return NextResponse.json({
    sent: okIds.size,
    failed: results.filter((r) => !r.ok).map((r) => ({ email: r.email, error: r.error })),
    simulated: !mailConfigured(),
  });
}
