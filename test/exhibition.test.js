import test from "node:test";
import assert from "node:assert/strict";
import { exhibits } from "../content/exhibition/exhibits.js";
import { categories, collections, tour } from "../content/exhibition/categories.js";
import { statement } from "../content/exhibition/statement.js";
import { media } from "../content/exhibition/media.js";
import { allExhibits, exhibitsIn, getExhibit, relatedExhibits, timelineEntries, formatExhibitDate, collectionWithExhibits, isPreview, openingStatementVisible, hasMedia } from "../lib/exhibition/content.js";

const STATUSES = ["published", "ready", "awaiting_copy", "awaiting_asset", "needs_verification"];

test("exhibit records are structurally valid", () => {
  const slugs = new Set(), ids = new Set();
  for (const e of exhibits) {
    assert.ok(e.id && e.slug && e.title && e.category && e.achievement, `missing field in ${e.slug}`);
    assert.ok(!slugs.has(e.slug) && !ids.has(e.id), `duplicate ${e.slug}`);
    slugs.add(e.slug); ids.add(e.id);
    assert.ok(categories.some((c) => c.slug === e.category), `unknown category ${e.category}`);
    assert.ok(STATUSES.includes(e.publicationStatus), `bad status ${e.slug}`);
    if (e.date) assert.ok(["year", "month", "day", "minute"].includes(e.datePrecision), `bad precision ${e.slug}`);
    for (const r of e.relatedExhibits ?? []) assert.ok(slugs.has(r) || exhibits.some((x) => x.slug === r), `${e.slug} relates to unknown ${r}`);
  }
});

test("Hall of Fame has the ten categories from the PRD, in order", () => {
  assert.deepEqual(categories.map((c) => c.title), ["Fastest Sales", "Consistency Streak", "Top Monthly Sales", "Global Reach", "Product Excellence", "Affiliate Legend", "Selar Firsts", "Category Leaders", "Ecosystem Impact", "Creator of the Year"]);
  for (const c of categories) assert.ok(exhibits.some((e) => e.category === c.slug), `${c.slug} has no exhibits`);
});

test("supplied milestone records are present and accurate", () => {
  const get = (slug) => exhibits.find((e) => e.slug === slug);
  assert.match(get("funky-collections").achievement, /five-figure sales in USD within seven hours/);
  assert.equal(get("coach-dino").figure.value, "1,110 days");
  assert.equal(get("orient-graphic-skills").figure.value, "8,129");
  assert.equal(get("felix-ohaeri").figure.value, "91");
  assert.equal(get("simplified-online-survey-guide").figure.value, "17,472");
  assert.equal(get("adebisi-odunayo-temitope").figure.value, "6,497");
  const coy = exhibits.filter((e) => e.category === "creator-of-the-year").map((e) => `${e.date}:${e.creator}`);
  assert.deepEqual(coy, ["2016:Muyiwà", "2017:Tolu Falode", "2018:Tolu Falode", "2019:Jay Becks™", "2020:Tricia Biz", "2021:The Discovery Centre", "2022:Taofeek Kareem", "2023:The Discovery Centre", "2024:The Maintenance Institute / Epsilon Reliability Solutions Limited", "2025:Isi Benedicta Institute"]);
});

test("the first-creator / first-account discrepancy is preserved, flagged and kept off the public site", () => {
  const a = exhibits.find((e) => e.slug === "muyiwa"), b = exhibits.find((e) => e.slug === "ut-first-account");
  for (const e of [a, b]) {
    assert.equal(e.verificationStatus, "needs_verification");
    assert.notEqual(e.publicationStatus, "published");
    assert.match(e.sourceNote, /CONFLICT/);
  }
  assert.match(a.achievement, /11 October 2016 at 14:21/);
  assert.match(b.achievement, /9 October 2016 at 09:03/);
});

test("public view only contains published records; preview adds the rest", () => {
  const prev = { ...process.env };
  try {
    process.env.EXHIBITION_PREVIEW = "0";
    assert.equal(isPreview(), false);
    assert.ok(allExhibits().every((e) => e.publicationStatus === "published"));
    assert.equal(getExhibit("muyiwa"), null);
    assert.equal(exhibitsIn("selar-firsts").length, 2);
    process.env.EXHIBITION_PREVIEW = "1";
    assert.equal(getExhibit("muyiwa").slug, "muyiwa");
    assert.equal(exhibitsIn("selar-firsts").length, 4);
  } finally { process.env = prev; }
});

test("collections cover real categories; tour and timeline resolve", () => {
  for (const c of collections) for (const slug of c.categories) assert.ok(categories.some((x) => x.slug === slug));
  assert.equal(collectionWithExhibits("numbers").count, 8);
  assert.ok(tour.length >= 8);
  process.env.EXHIBITION_PREVIEW = "0";
  const t = timelineEntries();
  assert.ok(t.length > 0);
  assert.deepEqual(t.map((e) => e.date), [...t.map((e) => e.date)].sort());
  for (const e of t) assert.ok(getExhibit(e.slug));
  delete process.env.EXHIBITION_PREVIEW;
});

test("related exhibits never point at the exhibit itself", () => {
  process.env.EXHIBITION_PREVIEW = "1";
  for (const e of allExhibits()) assert.ok(relatedExhibits(e).every((r) => r.slug !== e.slug));
  delete process.env.EXHIBITION_PREVIEW;
});

test("dates format without timezone drift", () => {
  assert.equal(formatExhibitDate("2016-10-11T14:21", "minute"), "11 October 2016, 14:21");
  assert.equal(formatExhibitDate("2025-09", "month"), "September 2025");
  assert.equal(formatExhibitDate("2017-08-21", "day"), "21 August 2017");
  assert.equal(formatExhibitDate("2023", "year"), "2023");
});

test("unfinished sections are hidden publicly", () => {
  process.env.EXHIBITION_PREVIEW = "0";
  assert.equal(openingStatementVisible(), false);
  assert.equal(media.length, 0);
  assert.equal(hasMedia(), false);
  delete process.env.EXHIBITION_PREVIEW;
});

test("approved statement text is preserved", () => {
  assert.equal(statement.closingLine, "Welcome to the celebration of African Creators. We are all Creators.");
  assert.match(statement.paragraphs[2], /over the last 10 to 15 years/);
});
