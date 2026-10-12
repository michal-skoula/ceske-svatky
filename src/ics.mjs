import { ANCHOR_YEAR, joinNames } from "./names.mjs";

// Fixed so that rebuilding the same data produces the same bytes.
const DTSTAMP = "20260101T000000Z";
const UID_DOMAIN = "ceske-svatky";

const pad = (n) => String(n).padStart(2, "0");

export function escapeText(text) {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");
}

/** Fold a content line at 75 octets without splitting a UTF-8 sequence (RFC 5545 §3.1). */
export function foldLine(line) {
	const encoder = new TextEncoder();
	const parts = [];
	let current = "";
	let currentBytes = 0;
	let limit = 75;
	for (const char of line) {
		const size = encoder.encode(char).length;
		if (currentBytes + size > limit) {
			parts.push(current);
			current = "";
			currentBytes = 0;
			limit = 74; // continuation lines start with a space
		}
		current += char;
		currentBytes += size;
	}
	parts.push(current);
	return parts.join("\r\n ");
}

function slug(name) {
	return name
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-");
}

function dateValue(date) {
	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/**
 * @param {{month: number, day: number, names: string[]}} nameDay
 * @param {{alarmHour: number | null, uidSuffix?: string}} options
 */
export function vevent({ month, day, names }, { alarmHour, uidSuffix }) {
	const start = new Date(ANCHOR_YEAR, month - 1, day);
	const end = new Date(ANCHOR_YEAR, month - 1, day + 1);
	const summary = escapeText(`Svátek: ${joinNames(names)}`);
	const uid = `${ANCHOR_YEAR}-${pad(month)}${pad(day)}${uidSuffix ? `-${uidSuffix}` : ""}@${UID_DOMAIN}`;

	const lines = [
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`DTSTAMP:${DTSTAMP}`,
		`DTSTART;VALUE=DATE:${dateValue(start)}`,
		`DTEND;VALUE=DATE:${dateValue(end)}`,
		// Spelled out for 29 Feb so clients skip non-leap years instead of moving it to 1 Mar.
		month === 2 && day === 29 ? "RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=29" : "RRULE:FREQ=YEARLY",
		`SUMMARY:${summary}`,
		"TRANSP:TRANSPARENT",
	];
	if (alarmHour !== null) {
		// All-day events float, so the offset from midnight is local time wherever the user is.
		lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${summary}`, `TRIGGER;RELATED=START:PT${alarmHour}H`, "END:VALARM");
	}
	lines.push("END:VEVENT");
	return lines;
}

/**
 * @param {{month: number, day: number, names: string[]}[]} nameDays
 * @param {{separate: boolean, alarmHour: number | null}} options
 */
export function vcalendar(nameDays, { separate, alarmHour }) {
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//ceske-svatky//CS",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"X-WR-CALNAME:Svátky",
		"X-WR-CALDESC:Kdo má dnes svátek (české jmeniny)",
		"REFRESH-INTERVAL;VALUE=DURATION:P1W",
		"X-PUBLISHED-TTL:P1W",
	];
	for (const nameDay of nameDays) {
		if (separate) {
			for (const name of nameDay.names) {
				lines.push(...vevent({ ...nameDay, names: [name] }, { alarmHour, uidSuffix: slug(name) }));
			}
		} else {
			lines.push(...vevent(nameDay, { alarmHour }));
		}
	}
	lines.push("END:VCALENDAR");
	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
