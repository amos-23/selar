import { firstName } from "./guests.js";
import { formatDate, formatTime } from "./format.js";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(event, body, cta) {
  return `<div style="background:#f6f1e9;padding:32px 16px;font-family:Georgia,serif;color:#1a1a2e">
<div style="max-width:520px;margin:auto;background:#fffdf9;padding:40px 32px;text-align:center;border:1px solid #e6dccb">
<p style="letter-spacing:.2em;text-transform:uppercase;font:12px Arial,sans-serif;color:#8a7a5c">${esc(event.name)}</p>
${body}
${cta ? `<p style="margin:32px 0 8px"><a href="${esc(cta.url)}" style="background:#1a1a2e;color:#fff;padding:14px 28px;text-decoration:none;font:15px Arial,sans-serif">${esc(cta.label)}</a></p>` : ""}
</div></div>`;
}

const details = (event) =>
  `<p style="font:15px/1.7 Arial,sans-serif">${esc(formatDate(event.startsAt))}<br>${esc(formatTime(event.startsAt))}<br>${esc(event.venue)}${event.address ? `<br>${esc(event.address)}` : ""}</p>`;

export function buildEmail(kind, { guest, event, url, message }) {
  const hi = `<h1 style="font-weight:400;font-size:28px;margin:16px 0">Hi ${esc(firstName(guest.name))},</h1>`;
  switch (kind) {
    case "invitation":
      return {
        subject: `You're invited: ${event.name}`,
        html: layout(event, `${hi}<p style="font-size:18px;line-height:1.6">We'd love to have you join us as we celebrate another year of Selar.</p>${details(event)}`, { label: "Open your invitation", url }),
      };
    case "rsvp_reminder":
      return {
        subject: `Will you join us? ${event.name}`,
        html: layout(event, `${hi}<p style="font-size:18px;line-height:1.6">We noticed you haven't confirmed your attendance yet.</p>${details(event)}`, { label: "Confirm attendance", url }),
      };
    case "day_before":
      return {
        subject: `Tomorrow, we're celebrating`,
        html: layout(event, `${hi}<p style="font-size:18px;line-height:1.6">Tomorrow, we're celebrating.</p>${details(event)}`, { label: "View invitation", url }),
      };
    case "event_day":
      return {
        subject: `Today's the day`,
        html: layout(event, `${hi}<p style="font-size:18px;line-height:1.6">Today's the day. We can't wait to have you with us.</p>${details(event)}`, { label: "View invitation", url }),
      };
    case "update":
      return {
        subject: `An update on ${event.name}`,
        html: layout(event, `${hi}<p style="font-size:17px;line-height:1.6;white-space:pre-wrap">${esc(message)}</p>${details(event)}`, { label: "View invitation", url }),
      };
    case "confirmation":
      return {
        subject: `You're on the list: ${event.name}`,
        html: layout(event, `<h1 style="font-weight:400;font-size:28px;margin:16px 0">You're on the list.</h1><p style="font-size:18px">We look forward to celebrating with you.</p>${details(event)}`, { label: "Add to calendar", url }),
      };
    default:
      throw new Error(`Unknown email kind: ${kind}`);
  }
}
