import { getNameDay } from "namedays-cs";

// 2024 is a leap year, so 29 February (Horymír) is a real date.
export const ANCHOR_YEAR = 2024;

/** Every date that has at least one name day, in calendar order. */
export function nameDays() {
	const days = [];
	for (let d = new Date(ANCHOR_YEAR, 0, 1); d.getFullYear() === ANCHOR_YEAR; d.setDate(d.getDate() + 1)) {
		const names = getNameDay(d);
		if (names.length > 0) {
			days.push({ month: d.getMonth() + 1, day: d.getDate(), names });
		}
	}
	return days;
}

/** "A", "A a B", "A, B a C" */
export function joinNames(names) {
	if (names.length <= 1) return names.join("");
	return `${names.slice(0, -1).join(", ")} a ${names.at(-1)}`;
}
