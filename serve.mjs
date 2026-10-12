// Local preview of dist/ at http://localhost:1234. Run via `npm run dev`.
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const PORT = 1234;
const ROOT = "dist";
const TYPES = {
	".html": "text/html; charset=utf-8",
	".ics": "text/calendar; charset=utf-8",
};

createServer(async (req, res) => {
	const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
	const file = join(ROOT, normalize(path.endsWith("/") ? `${path}index.html` : path));
	try {
		const body = await readFile(file);
		res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
		res.end(body);
	} catch {
		res.writeHead(404).end("Not found");
	}
}).listen(PORT, () => {
	const url = `http://localhost:${PORT}/`;
	console.log(`Serving ${ROOT}/ at ${url}`);
	const open = { darwin: "open", win32: "start" }[process.platform] ?? "xdg-open";
	exec(`${open} ${url}`);
});
