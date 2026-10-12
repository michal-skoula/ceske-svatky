# České svátky

*Kalendář českých jmenin, který si přidáte jako odběr. Každý den ukáže, kdo má svátek.*

A subscribable calendar of Czech name days (jmeniny, svátky). Subscribe once and every day shows whose name day it is. The events repeat yearly, so the feed never runs out.

**Pick a calendar at [michal-skoula.github.io/ceske-svatky](https://michal-skoula.github.io/ceske-svatky/).**

## Feeds

All feeds live at `https://michal-skoula.github.io/ceske-svatky/<file>`.

| File | Names | Alarm |
|---|---|---|
| [`dohromady.ics`](https://michal-skoula.github.io/ceske-svatky/dohromady.ics) | one event per day | none |
| [`dohromady-upozorneni-rano.ics`](https://michal-skoula.github.io/ceske-svatky/dohromady-upozorneni-rano.ics) | one event per day | 8:00 |
| [`dohromady-upozorneni-odpoledne.ics`](https://michal-skoula.github.io/ceske-svatky/dohromady-upozorneni-odpoledne.ics) | one event per day | 14:00 |
| [`dohromady-upozorneni-vecer.ics`](https://michal-skoula.github.io/ceske-svatky/dohromady-upozorneni-vecer.ics) | one event per day | 18:00 |
| [`zvlast.ics`](https://michal-skoula.github.io/ceske-svatky/zvlast.ics) | one event per name | none |
| [`zvlast-upozorneni-rano.ics`](https://michal-skoula.github.io/ceske-svatky/zvlast-upozorneni-rano.ics) | one event per name | 8:00 |
| [`zvlast-upozorneni-odpoledne.ics`](https://michal-skoula.github.io/ceske-svatky/zvlast-upozorneni-odpoledne.ics) | one event per name | 14:00 |
| [`zvlast-upozorneni-vecer.ics`](https://michal-skoula.github.io/ceske-svatky/zvlast-upozorneni-vecer.ics) | one event per name | 18:00 |

On 6 January, `dohromady` shows one event, "Svátek: Kašpar, Melichar a Baltazar". `zvlast` shows three: "Svátek: Kašpar", "Svátek: Melichar" and "Svátek: Baltazar".

Alarm times are local to wherever the user is. Events are all-day and marked as free, so they never block your schedule.

## Subscribing

- **Apple Calendar (macOS, iOS):** open the `webcal://` link from the site, or go to File → New Calendar Subscription and paste the URL.
- **Google Calendar:** use the "Přidat do Google Kalendáře" button, or Other calendars → + → From URL. Google ignores alarms in subscribed calendars, so if you want a reminder, set a default notification for the "Svátky" calendar in its settings.
- **Outlook:** Add calendar → Subscribe from web, then paste the URL.

Subscribe instead of importing the file. An imported copy works too, but it won't pick up corrections.

## How it works

GitHub Pages only serves fixed files and ignores query strings, so a URL like `?notify=8am` can't change what gets returned. Every combination of options is built ahead of time as its own file, and the file name carries the options.

Each date with a name day becomes one all-day event with `RRULE:FREQ=YEARLY`, anchored in 2024. 2024 is a leap year, so Horymír (29 February) has a valid start date. His rule is spelled out as `BYMONTH=2;BYMONTHDAY=29`, so clients skip non-leap years instead of moving him to 1 March.

Name data comes from [`namedays-cs`](https://github.com/OzzyCzech/namedays-cs). 361 of the 366 dates have at least one name. The ICS serializer in [`src/ics.mjs`](src/ics.mjs) is hand-written: it escapes text, folds lines at 75 bytes without splitting UTF-8 characters, and uses a fixed `DTSTAMP` so the same data always produces the same bytes.

UIDs are built from the date (plus the name in `zvlast` files). Keep them and the file names stable, because subscribers' calendar apps depend on both.

## Development

Needs Node 24 or newer.

```bash
npm ci
```

```bash
npm run build
```

```bash
npm test
```

`npm run build` writes the calendars and `index.html` to `dist/`. `npm test` builds first, then parses every file with [ical.js](https://github.com/kewisch/ical.js) and checks recurrence, alarms, line folding and the leap day.

The page lives in [`site/index.html`](site/index.html). It's plain HTML with a few lines of JS that turn the form choices into a file name.

## Deploying

Name days don't change, so the [Deploy workflow](.github/workflows/pages.yml) only runs by hand: Actions → Deploy → Run workflow. It builds, runs the tests, and publishes `dist/` to GitHub Pages.

One-time setup: Settings → Pages → Source: **GitHub Actions**.

To pick up new data from `namedays-cs`, bump its version in `package.json`, run `npm install`, and run the workflow.

## Credits

- Name day data: [namedays-cs](https://github.com/OzzyCzech/namedays-cs) by Roman Ožana (MIT), based on [Jmeniny v Česku](https://cs.wikipedia.org/wiki/Jmeniny_v_%C4%8Cesku) on Czech Wikipedia.

## License

[MIT](LICENSE)
