const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function range(event) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 3 * 3600 * 1000);
  return { start, end };
}

const where = (event) => [event.venue, event.address].filter(Boolean).join(", ");

export function googleCalendarUrl(event, url) {
  const { start, end } = range(event);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `${event.description}\n\n${url}`,
    location: where(event),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function outlookCalendarUrl(event, url) {
  const { start, end } = range(event);
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.name,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: `${event.description}\n\n${url}`,
    location: where(event),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p}`;
}

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function icsFile(event, url, uid) {
  const { start, end } = range(event);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Selar//Anniversary Exhibition//EN",
    "BEGIN:VEVENT",
    `UID:${uid}@selar-invitation`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(event.name)}`,
    `DESCRIPTION:${esc(`${event.description}\n\n${url}`)}`,
    `LOCATION:${esc(where(event))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
