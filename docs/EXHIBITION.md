# Selar at 10: The Gears of Creativity (virtual exhibition)

Lives at `/exhibition` inside this Next.js app, with its own routes, styles (`app/exhibition/exhibition.css`, scoped to `.ex`), components (`components/exhibition/`) and content (`content/exhibition/`). It does not touch the invitation app.

## Run
```bash
npm install
npm run dev        # http://localhost:3000/exhibition  (team preview is on in dev; add ?debug to expose window.__walk)
npm test           # includes test/exhibition.test.js
npm run build && npm start
```

## What is implemented
**`/exhibition` is one continuous 3D gallery. There are no page changes.** The visitor starts in an entrance lobby (gears on the walls, the title and statement), presses Enter, and walks down a long hall of rooms through arches with room signs. Exhibits hang on the walls as framed panels; walking up to one opens its details in a panel on the same screen.

| | |
|---|---|
| Rooms (in walking order) | Entrance, 2 The Exhibition Statement, 3 Breakable Records, 5 The Numbers That Tell Our Story, 6 The Firsts, 7 The Products That Made History, 8 The People Behind the Ecosystem, 9 A Decade of Creativity, 10 Inside the Exhibition (only when media is published), 11 The Closing Reflection |
| Hall of Fame | Rooms 5 to 9 together: all 10 categories, each introduced by a header panel on the wall |
| Moving | Drag to look. W A S D / arrow keys to walk (Shift to hurry), mouse wheel to walk, on screen ▲ ▼ (hold) for touch, ◀ ▶ Previous/Next room to glide between rooms |
| Exhibits | Click or tap a panel: the camera steps up to it and a panel opens (figure, story, related exhibits, previous/next, share). Esc, Close, or walking away steps back |
| Rooms drawer | Jump to any room, or search for a creator or product |
| Timeline drawer | Dated milestones in order; "Walk to this exhibit" takes you there |
| Deep links | `/exhibition#coach-dino` opens the scene already at that exhibit. Sharing uses `/exhibition/exhibits/<slug>`, which carries the Open Graph metadata |
| Closing | Closing line on the end wall, return to entrance, Selar link, share |
| Text version | The earlier pages (`/exhibition/gallery`, `/hall-of-fame`, `/timeline`, `/about`, `/collections/*`, `/exhibits/*`, `/closing`) are kept as the accessible, no-WebGL route to all content (PRD section 15). It is linked from the scene ("Text version"), and devices without WebGL are sent there automatically |

Opening statement, media room and the content workflow are unchanged (see below); both appear in the scene automatically once published.

## Architecture and why
- **Three.js (r169), loaded only on `/exhibition`.** A first-person walk is what was asked for. It adds one dependency (`three`), downloaded only for the scene.
- **No assets needed.** The hall, arches, panels and signs are generated in code; exhibit panels are canvas textures drawn from the content records, in the brand palette and typefaces.
- **Pure layout, tested.** `components/exhibition/walk/layout.js` decides where every room and panel sits (no overlaps, panels inside rooms, camera stand points inside the doorways); `walk-data.js` turns content into rooms; `scene.js` is the three.js scene and controls; `Walkthrough.js` is the React HUD and panels.
- **Performance.** The scene renders on demand (idle = no GPU work apart from the lobby gears, which stop when you leave the lobby and under reduced motion), pixel ratio is capped (1.5 on touch devices), textures are smaller on touch/low-memory devices, and nothing is shadowed.
- **Accessibility.** All controls are real buttons; the Rooms drawer reaches every exhibit by keyboard or screen reader; rooms are announced in a live region; reduced motion removes glides and spinning; Esc closes panels; the text version is always one click away.
- **Content is data** in `content/exhibition/*.js`; UI components never hardcode creator records.

## Breakable Records (imported from records.selar.com)
The 34 records on https://records.selar.com/breakable-records ("Yearly Champions") are in the exhibition as a room (**Room 3, Breakable Records**) with a frame for each record, grouped into Fastest to Reach, Streaks and Loyalty, Volume and Revenue, Firsts on Selar, and Creator of the Year. Each frame shows the holder's **circular photo** (initials in a circle when there is no photo), the figure, the date, the site's own description, the runners-up with their photos, past holders (Creator of the Year) and a link to the creator's store.

- **Refresh:** `python3 scripts/import_records.py` re-reads the site, rewrites `content/exhibition/records.js` (generated, do not edit) and downloads photos to `public/exhibition/creators/` (square-cropped; the UI draws them as circles). Needs Pillow and access to `records.selar.com` and `files.selar.co`.
- **Decisions live in** `content/exhibition/records-status.js`, which survives re-imports.
- **Photos are also attached to milestones-document frames** when the same creator appears on the site (matched by name, see `creatorPhotos` in `records.js`).
- **8 old photo files return "Access Denied" at the source** (for example Exquisite Magazine, Outburst Music Group, Coach B, Jazz Entrepreneur, George Okoro and the Ajiboye Temitope photo), so those people show initials. Nelly Agbogu's photo is also missing for the same reason.
- **Rights:** photos are creator images already published on selar.com, imported on request. Confirm Selar has permission to show them in the exhibition (PRD section 18).
- Names are shown as the site spells them, including "Oreint Graphic Skills".

### Disagreements between the site and the milestones document
Held back from the public site (visible, labelled, in team preview) until confirmed. To publish one, edit `records-status.js`.
1. **Creator of the Year.** The site's history (2025, 2024, 2023: Coach Dino; 2022: Taofeek Kareem; 2021: Nelly Agbogu; 2020: Tricia Biz; 2019: Exquisite Magazine; 2018: Outburst Music Group) disagrees with the milestones document in six of the eight years they share (it says 2018 Tolu Falode, 2019 Jay Becks, 2021 and 2023 The Discovery Centre, 2024 The Maintenance Institute, 2025 Isi Benedicta Institute). Only 2020 and 2022 agree. The site appears to rank by sales volume. The milestones-document list is what currently shows publicly.
2. **Longest daily sales streak:** site 1,194 days (15 Aug 2026) vs document 1,110 days (Coach Dino). Possibly just a later figure.
3. **Most units in a month:** site 8,133 vs document 8,129 (and the site spells it "Oreint").
4. **First affiliate commission:** site says Ajiboye Temitope, document says Temitope Agbana, both 21 Aug 2017.

Also worth a look, not held back: the document says Funky Collections reached five-figure USD sales within seven hours of launching a first product (2023), while the site lists Funky Collections 2nd for "Fastest to $10K in revenue" at 3 days (6 Aug 2023). These may be measured differently.

## Publication workflow
Each record has `publicationStatus` (`published`, `ready`, `awaiting_copy`, `awaiting_asset`, `needs_verification`) and `verificationStatus`. **Only `published` is public.**

**Team preview** shows everything with status labels and internal source notes. It is on in `next dev`, on Vercel *preview* deployments (`VERCEL_ENV=preview`, so PR previews show it), and when `EXHIBITION_PREVIEW=1`. Production never shows it (set `EXHIBITION_PREVIEW=0` to force it off).

## Deviations from the PRD
- The walkthrough is at `/exhibition` (the site root `/` belongs to the invitation app). It is a true 3D scene (PRD option B), chosen because the brief is a walk-through experience; the PRD's recommended 2D gallery survives as the text version.
- Plain JavaScript instead of TypeScript, to match the repository.
- Brand fonts (Parkinsans, Google Sans Flex) are loaded from Google Fonts by `<link>` in `app/exhibition/layout.js`; Inter/system fonts are the fallback. Self-host them if you prefer.
- Analytics are not implemented (provider and consent not decided).
- I could not open https://walebuilds.vercel.app/ from this environment (outbound access to it is blocked), so the design takes its principles from the written brief only: exhibits as objects, spatial rooms, discovery-led navigation. Nothing was copied from it.
- `Selar Exhibition Milestones.pdf` was not in the repository. Content comes from section 9 of the PRD, which says it is drawn from that PDF. Section 9.11 (first sale, early registrations, 100th/1,000th user, per-currency firsts, Coach Wendy/Nathel/Nelly Agbogu/Tricia Biz/Tolu Falode histories) has no values in the PRD, so it is **not included** and nothing was invented.

## Content decisions to confirm
1. **First creator vs first account conflict.** `muyiwa` (first creator to sign up, 11 Oct 2016 14:21) and `ut-first-account` (UT / Dotunj_afxc, first account, 9 Oct 2016 09:03) are both preserved, flagged `needs_verification`, and **held back from the public site** (Selar Firsts shows 2 of 4 records publicly). Once the source owner confirms, set `publicationStatus: "published"` and `verificationStatus: "verified"` on the correct record(s) and edit the wording if needed.
2. Category/collection intro lines, the timeline intro and the closing "Thank you for visiting Selar at 10." are proposed copy until approved.
3. For `adebisi-odunayo-temitope` the source qualifies the 6,497 record as the highest in the supplied document; the public text says "the highest number recorded by a Selar affiliate". Confirm the wording.

## When post-exhibition materials arrive (files to update)
- Opening statement: `content/exhibition/statement.js` → `openingStatement` (text, role, portrait, recording; then `publicationStatus: "published"`).
- Photos/videos: add files under `public/exhibition/` and items to `content/exhibition/media.js`. The Highlights nav item and room appear automatically once one item is published.
- Creator portraits / product artwork: add `image: { src, alt }` (or `media`) to records in `content/exhibition/exhibits.js`.
- New exhibits: add a record (they appear in the Hall of Fame, collections, timeline if dated, and get their own URL).
- Sharing image: add an approved image and reference it in `openGraph.images` / `twitter.images` in `app/exhibition/layout.js`.
- Final domain: set `SITE_URL` (used for `metadataBase`, canonical and Open Graph URLs).

## Deploying
Standard Next.js: push to the connected Vercel project (HTTPS and a stable URL come from the host). Set `SITE_URL` to the public origin. No secrets are used by the exhibition.

## Known limitations
- Panels are textures, so very long text is shrunk to fit; the full text is in the opened panel. Not yet tested on a range of real phones (only software-rendered Chromium here, about 8 fps, so smoothness is unmeasured). No analytics. No Lighthouse run was possible in this environment; build, tests, keyboard/touch/JS-off/reduced-motion and overflow checks were run in Chromium instead.
- Scroll position is restored by the browser/Next on Back where it can; it is not guaranteed.
- JSON-LD structured data is not added.
