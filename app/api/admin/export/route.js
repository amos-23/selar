import { isAdmin } from "@/lib/auth";
import { snapshot } from "@/lib/store";
import { STATUS_LABELS, guestStatus } from "@/lib/guests";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return new Response("Unauthorized", { status: 401 });
  const { guests } = await snapshot();
  const rows = [
    ["Name", "Email", "Phone", "Guest Type", "Company", "Role", "Status", "RSVP", "Plus One", "Plus One Name", "Sent", "Opened", "RSVP Date"],
    ...guests.map((g) => [
      g.name, g.email, g.rsvp?.phone || g.phone, g.guestType, g.company, g.role,
      STATUS_LABELS[guestStatus(g)],
      g.rsvp ? (g.rsvp.attending ? "Yes" : "No") : "Pending",
      g.rsvp?.attending ? (g.rsvp.plusOne ? "Yes" : "No") : "",
      g.rsvp?.plusOneName || "",
      g.sentAt || "", g.openedAt || "", g.rsvp?.at || "",
    ]),
  ];
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="selar-exhibition-guests.csv"',
    },
  });
}
