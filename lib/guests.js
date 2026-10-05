import crypto from "node:crypto";
import { parseCsv } from "./csv.js";
export { STATUS_LABELS, MESSAGE_KINDS, guestStatus, computeStats, recipientsFor } from "./status.js";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function newId() {
  return crypto.randomBytes(8).toString("hex");
}

// Unguessable per-guest slug, e.g. "amos-3fa91c07d2e4". The random part stops people enumerating invitations.
export function makeSlug(name) {
  const base =
    name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "guest";
  return `${base}-${crypto.randomBytes(6).toString("hex")}`;
}

const HEADERS = {
  name: "name",
  email: "email",
  phone: "phone",
  "guest type": "guestType",
  guesttype: "guestType",
  company: "company",
  role: "role",
  "plus one allowed": "plusOneAllowed",
  plusoneallowed: "plusOneAllowed",
};

// Returns { guests, errors }. Skips rows with no name / bad email / duplicate email (within the file or existing).
export function guestsFromCsv(text, existing = []) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { guests: [], errors: [{ row: 0, reason: "File is empty" }] };
  const cols = rows[0].map((h) => HEADERS[h.trim().toLowerCase()] ?? null);
  if (!cols.includes("name") || !cols.includes("email")) {
    return { guests: [], errors: [{ row: 1, reason: "Header must include Name and Email columns" }] };
  }
  const seen = new Set(existing.map((g) => g.email.toLowerCase()));
  const guests = [];
  const errors = [];
  rows.slice(1).forEach((r, i) => {
    const rec = {};
    cols.forEach((key, idx) => { if (key) rec[key] = (r[idx] ?? "").trim(); });
    const row = i + 2;
    if (!rec.name) return errors.push({ row, reason: "Missing name" });
    if (!EMAIL_RE.test(rec.email || "")) return errors.push({ row, reason: `Invalid email "${rec.email ?? ""}"` });
    const key = rec.email.toLowerCase();
    if (seen.has(key)) return errors.push({ row, reason: `Duplicate email ${rec.email}` });
    seen.add(key);
    guests.push({
      id: newId(),
      slug: makeSlug(rec.name),
      name: rec.name.slice(0, 100),
      email: rec.email.slice(0, 200),
      phone: (rec.phone || "").slice(0, 30),
      guestType: (rec.guestType || "").slice(0, 60),
      company: (rec.company || "").slice(0, 100),
      role: (rec.role || "").slice(0, 100),
      // Blank means allowed (the RSVP form's guest question is optional); an explicit "no" turns it off.
      plusOneAllowed: !/^(no|n|false|0)$/i.test(rec.plusOneAllowed || ""),
      createdAt: new Date().toISOString(),
      sentAt: null,
      deliveredAt: null,
      openedAt: null,
      rsvp: null,
      remindersSent: {},
    });
  });
  return { guests, errors };
}

export function firstName(name) {
  return name.trim().split(/\s+/)[0] || name;
}

// Validates an RSVP body against a guest. Returns { ok, rsvp } or { ok:false, error }.
export function validateRsvp(body, guest) {
  if (typeof body?.attending !== "boolean") return { ok: false, error: "Please tell us whether you can attend." };
  const at = new Date().toISOString();
  if (!body.attending) return { ok: true, rsvp: { attending: false, at } };
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  if (!name || name.length > 100) return { ok: false, error: "Please enter your full name." };
  if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: "Please enter a valid email address." };
  if (!/^[+\d][\d\s().-]{5,28}$/.test(phone)) return { ok: false, error: "Please enter a valid phone number." };
  const plusOne = guest.plusOneAllowed && body.plusOne === true;
  const plusOneName = plusOne ? String(body.plusOneName ?? "").trim().slice(0, 100) : "";
  if (plusOne && !plusOneName) return { ok: false, error: "Please enter your guest's name." };
  return { ok: true, rsvp: { attending: true, name, email, phone, plusOne, plusOneName, at } };
}
