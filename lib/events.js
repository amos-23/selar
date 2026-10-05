// Demo events. Swap for a database / Selar API lookup.
export const events = {
  "summer-rooftop": {
    title: "Summer Rooftop Party",
    host: "Selar Events",
    date: "2026-12-12T18:00:00",
    venue: "Skyline Terrace, Lekki, Lagos",
    message: "Music, food and good company. Come celebrate with us!",
    theme: { from: "#6d28d9", to: "#ec4899" },
  },
  "founders-dinner": {
    title: "Founders Dinner",
    host: "Selar Events",
    date: "2026-11-20T19:30:00",
    venue: "The Grill House, Victoria Island",
    message: "An intimate evening with creators and builders.",
    theme: { from: "#0f766e", to: "#f59e0b" },
  },
};

export function getEvent(slug) {
  return events[slug] ?? null;
}

// Deterministic short ticket code from event + guest, so links are stable.
export function ticketCode(slug, guest) {
  const s = `${slug}:${guest.trim().toLowerCase()}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}
