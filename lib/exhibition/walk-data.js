import { collections, collectionWithExhibits, getCategory, relatedExhibits, timelineEntries, formatExhibitDate, hasMedia, visibleMedia, openingStatement, openingStatementVisible, isPreview, STATUS_LABELS } from "./content.js";
import { statement } from "../../content/exhibition/statement.js";

// Everything the 3D walkthrough needs, as plain serialisable data (rooms for layout + detail records for the overlay).
export function buildWalkData() {
  const preview = isPreview();
  const exhibits = {};
  const rooms = [];

  // Room 2: the exhibition statement (approved text only; opening statement appears when published, or as a labelled stub in preview).
  const statementItems = statement.paragraphs.map((text, i) => ({ kind: "text", id: `statement-${i + 1}`, text, lead: i === 0 }));
  if (openingStatementVisible()) {
    const s = openingStatement;
    const has = Array.isArray(s.text) && s.text.length > 0;
    statementItems.push({ kind: "text", id: "opening-statement", heading: s.title || "Opening statement", byline: `${s.speaker}${s.role ? `, ${s.role}` : ""}`, text: has ? s.text.join(" ") : "The approved text of this statement has not been supplied yet.", status: preview && s.publicationStatus !== "published" ? STATUS_LABELS[s.publicationStatus] : null });
  }
  rooms.push({ key: "statement", number: 2, title: "The Exhibition Statement", theme: "blush", sections: [{ key: "statement", items: statementItems }] });

  for (const c of collections) {
    const col = collectionWithExhibits(c.slug);
    rooms.push({
      key: c.slug, number: c.number, title: c.title, theme: c.theme, intro: c.intro,
      sections: col.categories.map((cat) => ({
        key: cat.slug, title: cat.title, intro: cat.intro,
        items: cat.exhibits.map((e) => {
          exhibits[e.slug] = detailOf(e, preview);
          return { kind: "exhibit", id: e.slug, title: e.title, creator: e.creator, figure: e.figure ?? null, category: cat.title, categorySlug: cat.slug, achievement: e.achievement, yearCard: cat.slug === "creator-of-the-year", status: preview && e.publicationStatus !== "published" ? STATUS_LABELS[e.publicationStatus] : null };
        }),
      })),
    });
  }

  if (hasMedia()) {
    rooms.push({ key: "inside", number: 10, title: "Inside the Exhibition", theme: "grey", sections: [{ key: "media", items: visibleMedia().map((m) => ({ kind: "media", id: m.id, type: m.type, src: m.src, poster: m.poster ?? null, title: m.title ?? "", caption: m.caption ?? "", alt: m.alt ?? m.title ?? "", status: preview && m.publicationStatus !== "published" ? STATUS_LABELS[m.publicationStatus] : null })) }] });
  }

  rooms.push({ key: "closing", number: 11, title: "The Closing Reflection", theme: "purple", kind: "closing", sections: [{ key: "closing", items: [{ kind: "closing", id: "closing", text: statement.closingLine }] }] });

  const timeline = timelineEntries().map((e) => ({
    slug: e.slug, title: e.title, creator: e.creator, achievement: e.achievement, figure: e.figure ?? null,
    when: formatExhibitDate(e.date, e.datePrecision), year: e.date.slice(0, 4), categoryTitle: getCategory(e.category)?.title ?? "", status: e.publicationStatus,
  }));

  return { rooms, exhibits, timeline, statement: { title: statement.title, intro: statement.intro, closingLine: statement.closingLine }, preview };
}

function detailOf(e, preview) {
  const cat = getCategory(e.category);
  return {
    slug: e.slug, title: e.title, creator: e.creator ?? "", achievement: e.achievement, description: e.description ?? "",
    figure: e.figure ?? null, when: e.date && e.datePrecision !== "year" ? formatExhibitDate(e.date, e.datePrecision) : "", year: e.date ? e.date.slice(0, 4) : "",
    category: cat.title, categorySlug: cat.slug, leaderOf: e.leaderOf ?? null, award: e.award ?? null,
    isYearCard: e.category === "creator-of-the-year",
    images: [e.image, ...(e.media ?? []).filter((m) => m.type !== "video")].filter((m) => m?.src),
    related: relatedExhibits(e).map((r) => ({ slug: r.slug, title: r.category === "creator-of-the-year" ? `${r.title}: ${r.creator}` : r.title })),
    status: e.publicationStatus, statusLabel: STATUS_LABELS[e.publicationStatus], verified: e.verificationStatus === "verified", sourceNote: preview ? e.sourceNote ?? "" : "",
  };
}
