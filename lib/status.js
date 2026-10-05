// Browser-safe helpers (no node imports) shared by the dashboard and the server.
export const STATUS_LABELS = {
  not_sent: "Not sent",
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  rsvpd: "RSVP'd",
  declined: "Declined",
};

export function guestStatus(g) {
  if (g.rsvp) return g.rsvp.attending ? "rsvpd" : "declined";
  if (g.openedAt) return "opened";
  if (g.deliveredAt) return "delivered";
  if (g.sentAt) return "sent";
  return "not_sent";
}

export function computeStats(guests) {
  const attending = guests.filter((g) => g.rsvp?.attending).length;
  const declined = guests.filter((g) => g.rsvp && !g.rsvp.attending).length;
  const headcount = guests.reduce((n, g) => n + (g.rsvp?.attending ? 1 + (g.rsvp.plusOne ? 1 : 0) : 0), 0);
  return {
    invited: guests.length,
    sent: guests.filter((g) => g.sentAt).length,
    delivered: guests.filter((g) => g.deliveredAt).length,
    opened: guests.filter((g) => g.openedAt).length,
    attending,
    declined,
    pending: guests.length - attending - declined,
    headcount,
  };
}

export const MESSAGE_KINDS = {
  invitation: "Invitation",
  rsvp_reminder: "RSVP reminder",
  day_before: "Event reminder (24 hours before)",
  event_day: "Event day reminder",
  update: "Event update",
};

// Who a given send should go to. Shared by the dashboard (for the confirm prompt) and the server.
export function recipientsFor(kind, guests) {
  const withEmail = guests.filter((g) => g.email);
  switch (kind) {
    case "invitation": return withEmail.filter((g) => !g.sentAt);
    case "rsvp_reminder": return withEmail.filter((g) => g.sentAt && !g.rsvp);
    case "day_before":
    case "event_day":
    case "update": return withEmail.filter((g) => g.rsvp?.attending);
    default: return [];
  }
}
