import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { validateRsvp } from "@/lib/guests";
import { buildEmail } from "@/lib/email";
import { sendMail } from "@/lib/mail";
import { siteUrl, inviteUrl } from "@/lib/site";

export async function POST(req, { params }) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const result = await mutate((db) => {
    const guest = db.guests.find((x) => x.slug === params.slug);
    if (!guest) return { status: 404, error: "Invitation not found." };
    const v = validateRsvp(body, guest);
    if (!v.ok) return { status: 400, error: v.error };
    // The RSVP belongs to the invited guest record. A forwarded link can edit the response but never changes who it is for.
    guest.rsvp = v.rsvp;
    if (!guest.openedAt) guest.openedAt = v.rsvp.at;
    if (!guest.deliveredAt) guest.deliveredAt = guest.openedAt;
    return { status: 200, guest: { ...guest }, event: db.event };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  const { guest, event } = result;
  const url = inviteUrl(siteUrl(req), guest);
  // Email failures must not fail the RSVP itself.
  if (guest.rsvp.attending) {
    const mail = buildEmail("confirmation", { guest, event, url });
    await sendMail({ to: guest.rsvp.email, ...mail, guestId: guest.id });
  }
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    const who = `${guest.name} ${guest.rsvp.attending ? "is attending" : "declined"}`;
    await sendMail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject: `RSVP: ${who}`, html: `<p>${who.replace(/[<>&]/g, "")}.</p>` });
  }
  return NextResponse.json({ ok: true, rsvp: guest.rsvp });
}
