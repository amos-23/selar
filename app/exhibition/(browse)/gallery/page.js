import Link from "next/link";
import Room from "@/components/exhibition/Room";
import ShareControls from "@/components/exhibition/ShareControls";
import { collections, collectionWithExhibits, categoriesWithExhibits, hasMedia, allExhibits } from "@/lib/exhibition/content";

export const metadata = {
  title: "The Main Gallery",
  description: "Choose a room: the Hall of Fame, the numbers, the firsts, the products, the people and a decade of Creators of the Year.",
  alternates: { canonical: "/exhibition/gallery" },
};

export default function Gallery() {
  const total = allExhibits().length;
  const hof = categoriesWithExhibits();
  const names = (slug) => {
    const c = collectionWithExhibits(slug);
    const list = c.categories.flatMap((x) => x.exhibits).slice(0, 3).map((e) => e.title);
    return { count: c.count, list };
  };
  const rooms = [
    { key: "hof", n: 4, href: "/exhibition/hall-of-fame", title: "The Hall of Fame", text: "Every category of achievement, from the fastest sales to Creator of the Year.", meta: `${hof.length} categories · ${total} exhibits`, tone: "blush" },
    ...collections.map((c) => {
      const x = names(c.slug);
      return { key: c.slug, n: c.number, href: `/exhibition/collections/${c.slug}`, title: c.title, text: c.intro, meta: `${x.count} ${x.count === 1 ? "exhibit" : "exhibits"}`, list: x.list, tone: c.theme };
    }),
    { key: "timeline", n: null, href: "/exhibition/timeline", title: "The Timeline", text: "Milestones in order, from the earliest recorded dates to today.", meta: "Chronological", tone: "grey" },
    { key: "statement", n: 2, href: "/exhibition/about", title: "The Exhibition Statement", text: "Why this exhibition exists, in the words of the Selar team.", meta: "Read", tone: "blush" },
    ...(hasMedia() ? [{ key: "inside", n: 10, href: "/exhibition/highlights", title: "Inside the Exhibition", text: "Photographs and films from the physical exhibition.", meta: "Media room", tone: "grey" }] : []),
    { key: "closing", n: 11, href: "/exhibition/closing", title: "The Closing Reflection", text: "We are all Creators.", meta: "Finish here", tone: "purple" },
  ];

  return (
    <Room theme="deep" className="rise">
      <header className="room-head">
        <p className="ex-eyebrow">Explore the exhibition</p>
        <h1>The Main Gallery</h1>
        <p className="ex-lede">Visit the rooms in any order, or follow the guided route from the statement to the closing reflection. Every room has a way back here.</p>
        <div className="ex-actions">
          <Link href="/exhibition/about" className="btn primary">Start the guided route</Link>
          <Link href="/exhibition/hall-of-fame#search" className="btn ghost">Find a creator</Link>
          <ShareControls title="Selar at 10 | The Gears of Creativity" text="Explore the creators, products and milestones that shaped the African creator economy." path="/exhibition" />
        </div>
      </header>
      <ul className="plan" aria-label="Exhibition rooms">
        {rooms.map((r) => (
          <li key={r.key} className={`plan-${r.key}`}>
            <Link href={r.href} className={`room-panel tone-${r.tone}`}>
              <span className="room-no" aria-hidden="true">{r.n ?? "→"}</span>
              <span className="room-title">{r.title}</span>
              <span className="room-text">{r.text}</span>
              {r.list?.length ? <span className="room-names">{r.list.join(" · ")}{r.list.length >= 3 ? " …" : ""}</span> : null}
              <span className="room-meta">{r.meta} <span aria-hidden="true">→</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </Room>
  );
}
