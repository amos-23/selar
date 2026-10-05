export const TZ = "Africa/Lagos"; // The exhibition is in Lagos; dates are stored with a +01:00 offset.

export function formatDate(iso) {
  if (!iso) return "Date to be announced";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function formatTime(iso) {
  if (!iso) return "Time to be announced";
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
}

// "2026-11-14T16:00:00+01:00" <-> value for <input type="datetime-local"> ("2026-11-14T16:00")
export function isoToLocalInput(iso) {
  if (!iso) return "";
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
  return p.replace(" ", "T");
}

export function localInputToIso(value) {
  return value ? `${value}:00+01:00` : null;
}

export function mapsUrl(event) {
  const q = [event.venue, event.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
