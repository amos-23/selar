// Publication / verification decisions for the records imported from records.selar.com (see scripts/import_records.py).
// Records not listed here are published and treated as verified, because they come straight from the live Selar records site.
// To approve a held record, set both statuses below to "published" / "verified" (or delete its entry once confirmed).
export const recordStatus = {
  "record-longest-daily-sales-streak": {
    publicationStatus: "needs_verification", verificationStatus: "needs_verification",
    sourceNote: "CONFLICT: records.selar.com says COACH DINO's longest daily sales streak is 1,194 days (15 Aug 2026). The milestones document used for the Hall of Fame says 1,110 days (exhibit: coach-dino). May simply be a later figure for a streak that has grown; confirm which to show.",
  },
  "record-most-units-in-a-month": {
    publicationStatus: "needs_verification", verificationStatus: "needs_verification",
    sourceNote: "CONFLICT: records.selar.com says 8,133 units in a month (Jan 2026, listed as \"Oreint Graphic Skills\"); the milestones document says 8,129 units (exhibit: orient-graphic-skills). Confirm the figure and the spelling of the name.",
  },
  "record-first-affiliate-commission": {
    publicationStatus: "needs_verification", verificationStatus: "needs_verification",
    sourceNote: "CONFLICT: records.selar.com names Ajiboye Temitope as the first affiliate commission paid ($5.58, 21 Aug 2017). The milestones document names Temitope Agbana for the same date (exhibit: temitope-agbana). Possibly the same person under different names; confirm.",
  },
  "record-creator-of-the-year": {
    publicationStatus: "needs_verification", verificationStatus: "needs_verification",
    sourceNote: "CONFLICT: the Creator of the Year history on records.selar.com (2025 and 2024 and 2023 COACH DINO, 2022 Taofeek Kareem, 2021 Nelly Agbogu, 2020 Tricia Biz, 2019 Exquisite Magazine, 2018 Outburst Music Group) differs from the milestones document (2018 Tolu Falode, 2019 Jay Becks, 2021 The Discovery Centre, 2023 The Discovery Centre, 2024 The Maintenance Institute / Epsilon Reliability Solutions Limited, 2025 Isi Benedicta Institute). Only 2020 and 2022 agree. The site's ranking appears to be by sales volume. Not reconciled; confirm which list is the official one.",
  },
};
