import { exhibits as prdExhibits } from "../../content/exhibition/exhibits.js";
import { records, creatorPhotos } from "../../content/exhibition/records.js";
import { recordStatus } from "../../content/exhibition/records-status.js";
import { categories, collections, tour } from "../../content/exhibition/categories.js";
import { media } from "../../content/exhibition/media.js";
import { openingStatement } from "../../content/exhibition/statement.js";

export { categories, collections, tour };

const nameKey = (n) => String(n ?? "").replace(/™/g, "").replace(/\s+/g, " ").trim().toLowerCase();

// All exhibit records: the milestones-document exhibits (photos attached when the same creator appears on
// records.selar.com) plus the imported records (published unless records-status.js says otherwise).
export const exhibits = [
  ...prdExhibits.map((e) => (e.photo || !creatorPhotos[nameKey(e.creator)] ? e : { ...e, photo: creatorPhotos[nameKey(e.creator)] })),
  ...records.map((r) => ({ publicationStatus: "published", verificationStatus: "verified", ...r, ...recordStatus[r.slug] })),
];

export const STATUS_LABELS = {
  published: "Published",
  ready: "Ready",
  awaiting_copy: "Awaiting copy",
  awaiting_asset: "Awaiting asset",
  needs_verification: "Needs verification",
};

// Team preview shows unpublished items with status labels. It is on in development and on Vercel preview
// deployments, and can be forced with EXHIBITION_PREVIEW=1. It is never on in production.
export function isPreview() {
  if (process.env.EXHIBITION_PREVIEW === "0") return false;
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview" || process.env.EXHIBITION_PREVIEW === "1";
}

export const isPublished = (item) => item?.publicationStatus === "published";
export const isVisible = (item) => isPublished(item) || isPreview();

const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

export const allExhibits = () => exhibits.filter(isVisible).slice().sort(byOrder);
export const getExhibit = (slug) => allExhibits().find((e) => e.slug === slug) ?? null;
export const exhibitsIn = (categorySlug) => allExhibits().filter((e) => e.category === categorySlug);
export const getCategory = (slug) => categories.find((c) => c.slug === slug) ?? null;
export const getCollection = (slug) => collections.find((c) => c.slug === slug) ?? null;

export const categoriesWithExhibits = () =>
  categories.map((c) => ({ ...c, exhibits: exhibitsIn(c.slug) })).filter((c) => c.exhibits.length > 0);

export function collectionWithExhibits(slug) {
  const c = getCollection(slug);
  if (!c) return null;
  const cats = c.categories.map(getCategory).map((cat) => ({ ...cat, exhibits: exhibitsIn(cat.slug) })).filter((cat) => cat.exhibits.length);
  return { ...c, categories: cats, count: cats.reduce((n, cat) => n + cat.exhibits.length, 0) };
}

export const collectionOf = (exhibit) => collections.find((c) => c.categories.includes(exhibit.category)) ?? null;

export function relatedExhibits(exhibit, limit = 4) {
  const explicit = (exhibit.relatedExhibits ?? []).map(getExhibit).filter(Boolean);
  const same = exhibitsIn(exhibit.category).filter((e) => e.slug !== exhibit.slug && !explicit.includes(e));
  return [...explicit, ...same].slice(0, limit);
}

export function neighbours(exhibit) {
  const list = exhibitsIn(exhibit.category);
  const i = list.findIndex((e) => e.slug === exhibit.slug);
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null };
}

export const visibleMedia = () => media.filter(isVisible).slice().sort(byOrder);
export const hasMedia = () => visibleMedia().length > 0 || isPreview();

export function openingStatementVisible() {
  const s = openingStatement;
  return (s.publicationStatus === "published" && Array.isArray(s.text) && s.text.length > 0) || isPreview();
}
export { openingStatement };

// Timeline: every visible exhibit that has a supported date. Nothing is added that is not an exhibit record.
export function timelineEntries() {
  return allExhibits()
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Formats ISO-style partial dates without Date objects, so output never shifts with timezones.
export function formatExhibitDate(date, precision) {
  if (!date) return "";
  const [d, t] = date.split("T");
  const [y, m, day] = d.split("-");
  if (precision === "year" || !m) return y;
  const month = MONTHS[Number(m) - 1];
  if (precision === "month") return `${month} ${y}`;
  const dayText = `${Number(day)} ${month} ${y}`;
  return precision === "minute" && t ? `${dayText}, ${t}` : dayText;
}

export const exhibitHref = (e) => `/exhibition/exhibits/${e.slug}`;
export const collectionHref = (c) => `/exhibition/collections/${c.slug}`;
