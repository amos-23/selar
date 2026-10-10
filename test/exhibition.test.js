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

test("Hall of Fame has the ten categories from the PRD first, then the record groups", () => {
  assert.deepEqual(categories.slice(0, 10).map((c) => c.title), ["Fastest Sales", "Consistency Streak", "Top Monthly Sales", "Global Reach", "Product Excellence", "Affiliate Legend", "Selar Firsts", "Category Leaders", "Ecosystem Impact", "Creator of the Year"]);
  for (const c of categories.slice(0, 10)) assert.ok(exhibits.some((e) => e.category === c.slug), `${c.slug} has no exhibits`);
  assert.deepEqual(categories.slice(10).map((c) => c.slug).sort(), ["records-firsts", "records-honour", "records-speed", "records-streaks", "records-volume"]);
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
    assert.equal(allExhibits().length, 59);
    process.env.EXHIBITION_PREVIEW = "1";
    assert.equal(getExhibit("muyiwa").slug, "muyiwa");
    assert.equal(exhibitsIn("selar-firsts").length, 4);
    assert.equal(allExhibits().length, 65);
  } finally { process.env = prev; }
});

test("collections cover real categories; tour and timeline resolve", () => {
  for (const c of collections) for (const slug of c.categories) assert.ok(categories.some((x) => x.slug === slug));
  assert.equal(collectionWithExhibits("numbers").count, 8);
  assert.equal(collectionWithExhibits("records").count, 30, "30 of the 34 imported records are public");
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

import { buildLayout, DIMS, roomIndexAt, standPoint, exhibitOrder } from "../components/exhibition/walk/layout.js";

function sampleRooms() {
  const ex = (n) => Array.from({ length: n }, (_, i) => ({ kind: "exhibit", id: `e${n}-${i}` }));
  return [
    { key: "statement", title: "S", theme: "blush", sections: [{ key: "s", items: [{ kind: "text", id: "t1" }, { kind: "text", id: "t2" }] }] },
    { key: "a", title: "A", theme: "purple", sections: [{ key: "a1", title: "One", items: ex(3) }, { key: "a2", title: "Two", items: ex(4) }] },
    { key: "closing", title: "C", theme: "purple", kind: "closing", sections: [{ key: "c", items: [{ kind: "closing", id: "closing" }] }] },
  ];
}

test("walk layout: rooms are contiguous and run down the hall", () => {
  const L = buildLayout(sampleRooms());
  assert.equal(L.rooms[0].key, "lobby");
  for (let i = 1; i < L.rooms.length; i++) {
    assert.ok(L.rooms[i].zStart < L.rooms[i - 1].zStart);
    if (i > 1) assert.equal(L.rooms[i].zStart, L.rooms[i - 1].zEnd);
  }
  assert.equal(roomIndexAt(L, 1.5), 0);
  assert.equal(roomIndexAt(L, L.rooms[2].zStart - 3), 2);
});

test("walk layout: every item is placed once, on a wall, inside its room, without overlapping", () => {
  const L = buildLayout(sampleRooms());
  const ids = L.rooms.flatMap((r) => r.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const r of L.rooms.slice(1)) {
    const bySide = { left: [], right: [] };
    for (const it of [...r.items, ...r.headers]) {
      if (it.side === "end") continue;
      assert.ok(Math.abs(it.x) <= DIMS.wallX + 1e-9);
      assert.ok(it.z < r.zStart - DIMS.roomPadStart + DIMS.slot / 2 + 1e-9 && it.z > r.zEnd, `${it.id} outside ${r.key}`);
      bySide[it.side].push(it.z);
    }
    for (const zs of Object.values(bySide)) {
      zs.sort((a, b) => b - a);
      for (let i = 1; i < zs.length; i++) assert.ok(zs[i - 1] - zs[i] >= DIMS.slot - 1e-6, "panels overlap");
    }
  }
});

test("walk layout: standing points keep the camera inside the doorway and facing the wall", () => {
  const L = buildLayout(sampleRooms());
  for (const it of L.rooms[2].items) {
    const s = standPoint(it, 1.6);
    assert.ok(Math.abs(s.x) <= 2.2 && Math.abs(s.x) >= 0.8);
    assert.equal(Math.sign(s.x) === -1, it.side === "left");
  }
  assert.ok(exhibitOrder(L).length === 7);
});

test("walk layout works on the real exhibition data", async () => {
  process.env.EXHIBITION_PREVIEW = "0";
  const { buildWalkData } = await import("../lib/exhibition/walk-data.js");
  const { rooms, exhibits: byId } = buildWalkData();
  const L = buildLayout(rooms);
  const placed = L.rooms.flatMap((r) => r.items).filter((i) => i.kind === "exhibit");
  assert.equal(placed.length, 59);
  assert.equal(Object.keys(byId).length, 59);
  assert.ok(!placed.some((i) => i.id === "muyiwa" || i.id === "ut-first-account"), "conflicting records stay off the public walk");
  assert.ok(L.rooms.map((r) => r.key).join().startsWith("lobby,statement,records,numbers,firsts,products,people,decade"));
  assert.equal(L.rooms.at(-1).key, "closing");
  delete process.env.EXHIBITION_PREVIEW;
});

import { records, recordsMeta, creatorPhotos } from "../content/exhibition/records.js";
import { recordStatus } from "../content/exhibition/records-status.js";
import { existsSync } from "node:fs";

test("imported records are complete, well formed, and every photo exists on disk", () => {
  assert.equal(records.length, recordsMeta.count);
  const slugs = new Set();
  for (const r of records) {
    assert.ok(r.slug && r.title && r.creator && r.figure?.value && r.category.startsWith("records-"), r.slug);
    assert.ok(!slugs.has(r.slug), `duplicate ${r.slug}`); slugs.add(r.slug);
    assert.ok(!/\$\$|undefined/.test(JSON.stringify([r.figure, r.achievement, r.creator])), `bad escape in ${r.slug}`);
    for (const p of [r.photo, ...r.runnerUps.map((x) => x.photo), ...r.pastHolders.map((x) => x.photo)].filter(Boolean)) assert.ok(existsSync(`public${p}`), `missing photo ${p}`);
  }
  assert.equal(records.find((r) => r.slug === "record-highest-monthly-revenue").figure.value, "$144,434.01");
  for (const p of Object.values(creatorPhotos)) assert.ok(existsSync(`public${p}`));
});

test("records that contradict the milestones document are held back and explained", () => {
  for (const [slug, st] of Object.entries(recordStatus)) {
    assert.ok(records.some((r) => r.slug === slug), `${slug} is not an imported record`);
    assert.notEqual(st.publicationStatus, "published");
    assert.match(st.sourceNote, /CONFLICT/);
  }
  assert.equal(Object.keys(recordStatus).length, 4);
});
