import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { vcalendar } from "./src/ics.mjs";
import { nameDays } from "./src/names.mjs";

const OUT = "dist";

const LAYOUTS = { dohromady: false, zvlast: true };
const ALARMS = { rano: 8, odpoledne: 14, vecer: 18 };

const days = nameDays();

// Empty dist/ instead of deleting it, so the dev server's file watcher keeps working.
await mkdir(OUT, { recursive: true });
for (const entry of await readdir(OUT)) {
	await rm(`${OUT}/${entry}`, { recursive: true, force: true });
}

for (const [layout, separate] of Object.entries(LAYOUTS)) {
	await writeFile(`${OUT}/${layout}.ics`, vcalendar(days, { separate, alarmHour: null }));
	for (const [alarm, alarmHour] of Object.entries(ALARMS)) {
		await writeFile(`${OUT}/${layout}-upozorneni-${alarm}.ics`, vcalendar(days, { separate, alarmHour }));
	}
}

await copyFile("site/index.html", `${OUT}/index.html`);
await writeFile(`${OUT}/.nojekyll`, "");

console.log(`Built ${Object.keys(LAYOUTS).length * (Object.keys(ALARMS).length + 1)} calendars from ${days.length} dates into ${OUT}/`);
