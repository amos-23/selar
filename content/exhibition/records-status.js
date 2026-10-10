// Publication / verification decisions for the records imported from records.selar.com (see scripts/import_records.py).
//
// RULE (project owner): wherever records.selar.com and the milestones document disagree, the records site wins.
// Records not listed in `recordStatus` are published and treated as verified (they come straight from the live site).
export const recordStatus = {};

// Milestones-document exhibits that contradict the records site. They are retired (kept for reference, shown only in team preview).
export const supersededByRecords = {
  "coach-dino": "Records site: Coach Dino's longest daily sales streak is 1,194 days (15 Aug 2026), not the 1,110 days in the milestones document. Shown as record-longest-daily-sales-streak.",
  "orient-graphic-skills": "Records site: 8,133 units in a month (Jan 2026, spelled \"Oreint Graphic Skills\"), not the 8,129 in the milestones document. Shown as record-most-units-in-a-month.",
  "temitope-agbana": "Records site: the first affiliate commission paid was to Ajiboye Temitope ($5.58, 21 Aug 2017), not Temitope Agbana. Shown as record-first-affiliate-commission.",
  "funky-collections": "Records site: Funky Collections reached $10K in 3 days (6 Aug 2023), ranking 2nd for \"Fastest to $10K in revenue\", which contradicts five-figure sales within seven hours. Shown in the runners-up of record-fastest-to-10k-in-revenue.",
};

// Creator of the Year: the records site's history replaces the milestones document for every year it covers (2018 to 2025).
// 2016 and 2017 are only in the milestones document, so they stay.
export const creatorOfTheYearFromRecords = true;
