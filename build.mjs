import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { vcalendar } from "./src/ics.mjs";
import { nameDays } from "./src/names.mjs";

const OUT = "dist";

const LAYOUTS = { dohromady: false, zvlast: true };
const ALARMS = { rano: 8, odpoledne: 14, vecer: 18 };

const days = nameDays();

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT);

for (const [layout, separate] of Object.entries(LAYOUTS)) {
	await writeFile(`${OUT}/${layout}.ics`, vcalendar(days, { separate, alarmHour: null }));
	for (const [alarm, alarmHour] of Object.entries(ALARMS)) {
		await writeFile(`${OUT}/${layout}-upozorneni-${alarm}.ics`, vcalendar(days, { separate, alarmHour }));
	}
}

await copyFile("site/index.html", `${OUT}/index.html`);
await writeFile(`${OUT}/.nojekyll`, "");

console.log(`Built ${Object.keys(LAYOUTS).length * (Object.keys(ALARMS).length + 1)} calendars from ${days.length} dates into ${OUT}/`);
