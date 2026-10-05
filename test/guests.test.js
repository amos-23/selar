import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, toCsv } from "../lib/csv.js";
import { guestsFromCsv, validateRsvp, computeStats, guestStatus, recipientsFor, makeSlug } from "../lib/guests.js";

test("parseCsv handles quotes, commas, CRLF and BOM", () => {
  const rows = parseCsv('﻿Name,Company\r\n"Doe, John","Acme ""Inc"""\r\n');
  assert.deepEqual(rows, [["Name", "Company"], ["Doe, John", 'Acme "Inc"']]);
});

test("toCsv neutralises spreadsheet formulas", () => {
  assert.equal(toCsv([["=HYPERLINK(1)", "ok"]]), "'=HYPERLINK(1),ok\r\n");
});

test("guestsFromCsv imports valid rows and reports bad ones", () => {
  const csv = "Name,Email,Phone,Guest Type,Plus One Allowed\nAmos,a@x.com,0801,VIP,no\n,b@x.com,,,\nBad,notanemail,,,\nAmos 2,A@x.com,,,\n";
  const { guests, errors } = guestsFromCsv(csv);
  assert.equal(guests.length, 1);
  assert.equal(guests[0].plusOneAllowed, false);
  assert.deepEqual(errors.map((e) => e.row), [3, 4, 5]);
});

test("guestsFromCsv requires Name and Email headers and skips existing emails", () => {
  assert.equal(guestsFromCsv("Foo,Bar\n1,2").guests.length, 0);
  const { guests } = guestsFromCsv("Name,Email\nAmos,a@x.com", [{ email: "A@X.com" }]);
  assert.equal(guests.length, 0);
});

test("slugs are unique per call", () => {
  assert.notEqual(makeSlug("Amos"), makeSlug("Amos"));
  assert.match(makeSlug("Amos Féranming"), /^amos-feranming-[0-9a-f]{12}$/);
});

test("validateRsvp", () => {
  const guest = { plusOneAllowed: true };
  assert.equal(validateRsvp({}, guest).ok, false);
  assert.equal(validateRsvp({ attending: false }, guest).rsvp.attending, false);
  assert.equal(validateRsvp({ attending: true, name: "A", email: "bad", phone: "0801234567" }, guest).ok, false);
  assert.equal(validateRsvp({ attending: true, name: "A", email: "a@x.com", phone: "abc" }, guest).ok, false);
  assert.equal(validateRsvp({ attending: true, name: "A", email: "a@x.com", phone: "0801234567", plusOne: true }, guest).ok, false);
  const ok = validateRsvp({ attending: true, name: "A", email: "a@x.com", phone: "+234 801 234 5678", plusOne: true, plusOneName: "B" }, guest);
  assert.equal(ok.rsvp.plusOneName, "B");
  // plus one is ignored when not allowed
  assert.equal(validateRsvp({ attending: true, name: "A", email: "a@x.com", phone: "0801234567", plusOne: true, plusOneName: "B" }, { plusOneAllowed: false }).rsvp.plusOne, false);
});

test("status, stats and recipients", () => {
  const g = (o) => ({ email: "e@x.com", rsvp: null, sentAt: null, deliveredAt: null, openedAt: null, ...o });
  const yes = g({ sentAt: "t", openedAt: "t", rsvp: { attending: true, plusOne: true } });
  const no = g({ sentAt: "t", rsvp: { attending: false } });
  const pending = g({ sentAt: "t", deliveredAt: "t" });
  const fresh = g({});
  assert.equal(guestStatus(yes), "rsvpd");
  assert.equal(guestStatus(no), "declined");
  assert.equal(guestStatus(pending), "delivered");
  assert.equal(guestStatus(fresh), "not_sent");
  const s = computeStats([yes, no, pending, fresh]);
  assert.deepEqual([s.invited, s.sent, s.attending, s.declined, s.pending, s.headcount], [4, 3, 1, 1, 2, 2]);
  assert.deepEqual(recipientsFor("invitation", [yes, no, pending, fresh]), [fresh]);
  assert.deepEqual(recipientsFor("rsvp_reminder", [yes, no, pending, fresh]), [pending]);
  assert.deepEqual(recipientsFor("day_before", [yes, no, pending, fresh]), [yes]);
});
