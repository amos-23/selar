import { getGuestBySlug } from "@/lib/store";
import { icsFile } from "@/lib/calendar";
import { siteUrl, inviteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const found = await getGuestBySlug(params.slug);
  if (!found || !found.event.startsAt) return new Response("Not found", { status: 404 });
  const body = icsFile(found.event, inviteUrl(siteUrl(req), found.guest), found.guest.id);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="selar-anniversary-exhibition.ics"',
    },
  });
}
