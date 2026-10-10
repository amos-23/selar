# Selar at 10: The Gears of Creativity (virtual exhibition)

Lives at `/exhibition` inside this Next.js app, with its own routes, styles (`app/exhibition/exhibition.css`, scoped to `.ex`), components (`components/exhibition/`) and content (`content/exhibition/`). It does not touch the invitation app.

## Run
```bash
npm install
npm run dev        # http://localhost:3000/exhibition  (team preview is on in dev)
npm test           # includes test/exhibition.test.js
npm run build && npm start
```

## What is implemented
| PRD feature | Where |
|---|---|
| A. Entrance | `/exhibition` (Enter Exhibition, link to the statement, animated gears; no loading screen) |
| B. Main gallery | `/exhibition/gallery`: a floor plan of rooms (stacked on mobile), guided route, find-a-creator, share |
| C. Collections | `/exhibition/collections/{numbers,firsts,products,people,decade}` with intro, exhibit cards, related rooms, back to gallery |
| D. Exhibit details | `/exhibition/exhibits/[slug]`: full page with Close (Esc), breadcrumbs, related, prev/next, share. Optional fields are omitted when empty |
| E. Hall of Fame | `/exhibition/hall-of-fame`: 10 categories, category filter, name search, `#category` links |
| F. Timeline | `/exhibition/timeline`: built from dated exhibit records only; expandable entries, year jump |
| G. Media room | `/exhibition/highlights` + `MediaGallery` (lightbox, video with controls, no autoplay, image/video fallbacks). Hidden until media is published |
| H. Opening statement | Section on `/exhibition/about`, hidden until `openingStatement` is published with text |
| I. Closing reflection | `/exhibition/closing` |
| J. Sharing | Web Share API, copy-link fallback, manual-copy fallback; per-exhibit URLs and Open Graph/Twitter metadata |

## Architecture and why
- **Interactive 2D gallery (PRD option A), no 3D.** Rooms are themed spaces (deep purple, purple, blush, grey, yellow) on one visual system. It is fast, works on touch, and every room is plain HTML, so a non-3D route to all content always exists. A 3D scene can be added later without changing the content model.
- **Next.js App Router, plain JS.** The repo is already Next 14 + JavaScript (`jsconfig.json`); adding TypeScript would have added tooling for no user benefit. No new dependencies were added.
- **Server-rendered pages, three small client components** (hall-of-fame filter, timeline toggles, share/back/media). The Hall of Fame renders fully without JavaScript.
- **Content is data.** `content/exhibition/*.js` holds exhibits, categories/collections/tour, media and statements; `lib/exhibition/content.js` filters and queries them. UI components never hardcode creator records.

## Publication workflow
Each record has `publicationStatus` (`published`, `ready`, `awaiting_copy`, `awaiting_asset`, `needs_verification`) and `verificationStatus`. **Only `published` is public.**

**Team preview** shows everything with status labels and internal source notes. It is on in `next dev`, on Vercel *preview* deployments (`VERCEL_ENV=preview`, so PR previews show it), and when `EXHIBITION_PREVIEW=1`. Production never shows it (set `EXHIBITION_PREVIEW=0` to force it off).

## Deviations from the PRD
- Entrance is `/exhibition` and the main gallery is `/exhibition/gallery` (the site root `/` already belongs to the invitation app).
- Plain JavaScript instead of TypeScript (see above).
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
- No 3D environment (deliberate). No analytics. No Lighthouse run was possible in this environment; build, tests, keyboard/touch/JS-off/reduced-motion and overflow checks were run in Chromium instead.
- Scroll position is restored by the browser/Next on Back where it can; it is not guaranteed.
- JSON-LD structured data is not added.
