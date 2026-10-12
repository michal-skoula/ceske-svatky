import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ICAL from "ical.js";
import { escapeText, foldLine } from "../src/ics.mjs";

const LAYOUTS = ["dohromady", "zvlast"];
const ALARMS = { rano: 8, odpoledne: 14, vecer: 18 };
const FILES = LAYOUTS.flatMap((layout) => [`${layout}.ics`, ...Object.keys(ALARMS).map((alarm) => `${layout}-upozorneni:${alarm}.ics`)]);

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), "utf8");

async function parse(file) {
	return new ICAL.Component(ICAL.parse(await read(file)));
}

/** Summaries of every occurrence on the given date (YYYY-MM-DD). */
function summariesOn(calendar, isoDate) {
	const target = ICAL.Time.fromDateString(isoDate);
	const found = [];
	for (const component of calendar.getAllSubcomponents("vevent")) {
		const event = new ICAL.Event(component);
		const iterator = event.iterator();
		for (let next = iterator.next(); next && next.year <= target.year; next = iterator.next()) {
			if (next.compare(target) === 0) found.push(event.summary);
		}
	}
	return found;
}

test("builds all 8 calendars and each parses", async () => {
	assert.equal(FILES.length, 8);
	for (const file of FILES) {
		const calendar = await parse(file);
		assert.ok(calendar.getAllSubcomponents("vevent").length > 300, file);
	}
});

test("together: one event on 6 Jan with all three kings, none on 1 Jan or 25 Dec", async () => {
	const calendar = await parse("dohromady.ics");
	assert.deepEqual(summariesOn(calendar, "2027-01-06"), ["Svátek: Kašpar, Melichar a Baltazar"]);
	assert.deepEqual(summariesOn(calendar, "2027-01-01"), []);
	assert.deepEqual(summariesOn(calendar, "2027-12-25"), []);
});

test("separate: three events on 6 Jan with distinct UIDs", async () => {
	const calendar = await parse("zvlast.ics");
	assert.deepEqual(summariesOn(calendar, "2027-01-06").sort(), ["Svátek: Baltazar", "Svátek: Kašpar", "Svátek: Melichar"]);
	const uids = calendar.getAllSubcomponents("vevent").map((e) => e.getFirstPropertyValue("uid"));
	assert.equal(new Set(uids).size, uids.length);
});

test("Horymír appears on 29 Feb only in leap years", async () => {
	const calendar = await parse("dohromady.ics");
	assert.deepEqual(summariesOn(calendar, "2028-02-29"), ["Svátek: Horymír"]);
	assert.deepEqual(summariesOn(calendar, "2027-02-28"), ["Svátek: Lumír"]);
	assert.deepEqual(summariesOn(calendar, "2027-03-01"), ["Svátek: Bedřich a Bedřiška"]);
});

test("alarm files carry one VALARM at the right hour, plain files carry none", async () => {
	for (const layout of LAYOUTS) {
		assert.ok(!(await read(`${layout}.ics`)).includes("BEGIN:VALARM"));
		for (const [alarm, hour] of Object.entries(ALARMS)) {
			const calendar = await parse(`${layout}-upozorneni:${alarm}.ics`);
			for (const event of calendar.getAllSubcomponents("vevent")) {
				const alarms = event.getAllSubcomponents("valarm");
				assert.equal(alarms.length, 1);
				assert.equal(alarms[0].getFirstPropertyValue("trigger").toString(), `PT${hour}H`);
			}
		}
	}
});

test("no physical line exceeds 75 octets, CRLF endings, diacritics survive unfolding", async () => {
	for (const file of FILES) {
		const text = await read(file);
		assert.ok(text.endsWith("\r\n"));
		assert.ok(!/[^\r]\n/.test(text), `${file} has bare LF`);
		for (const line of text.split("\r\n")) {
			assert.ok(Buffer.byteLength(line) <= 75, `${file}: ${line}`);
		}
	}
	const calendar = await parse("dohromady.ics");
	assert.deepEqual(summariesOn(calendar, "2027-01-08"), ["Svátek: Čestmír"]);
});

test("foldLine never splits a multi-byte character", () => {
	const line = `SUMMARY:${"ž".repeat(100)}`;
	const folded = foldLine(line);
	for (const part of folded.split("\r\n")) {
		assert.ok(Buffer.byteLength(part) <= 75);
		assert.ok(!part.includes("�"));
	}
	assert.equal(folded.replace(/\r\n /g, ""), line);
});

test("escapeText escapes commas, semicolons, backslashes and newlines", () => {
	assert.equal(escapeText("a, b; c\\d\ne"), "a\\, b\\; c\\\\d\\ne");
	return read("dohromady.ics").then((text) => assert.ok(text.includes("SUMMARY:Svátek: Kašpar\\, Melichar a Baltazar")));
});
