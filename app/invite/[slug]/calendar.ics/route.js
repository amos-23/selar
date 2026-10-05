import { getGuestBySlug, snapshot } from "@/lib/store";
import { icsFile } from "@/lib/calendar";
import { siteUrl, inviteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  // "preview" can never collide with a real guest slug (those always end in a random hex suffix).
  const found = params.slug === "preview"
    ? { event: (await snapshot()).event, guest: { id: "preview", slug: "" } }
    : await getGuestBySlug(params.slug);
  if (!found || !found.event.startsAt) return new Response("Not found", { status: 404 });
  const body = icsFile(found.event, params.slug === "preview" ? siteUrl(req) : inviteUrl(siteUrl(req), found.guest), found.guest.id);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="selar-anniversary-exhibition.ics"',
    },
  });
}
