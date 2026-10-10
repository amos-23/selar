import Link from "next/link";
import { notFound } from "next/navigation";
import Room from "@/components/exhibition/Room";
import RoomPager from "@/components/exhibition/RoomPager";
import ExhibitCard from "@/components/exhibition/ExhibitCard";
import { collections, collectionWithExhibits, isPreview } from "@/lib/exhibition/content";

export const generateStaticParams = () => collections.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = collections.find((x) => x.slug === slug);
  if (!c) return {};
  return { title: c.title, description: c.intro, alternates: { canonical: `/exhibition/collections/${c.slug}` } };
}

export default async function Collection({ params }) {
  const { slug } = await params;
  const c = collectionWithExhibits(slug);
  if (!c) notFound();
  const preview = isPreview();
  const others = collections.filter((x) => x.slug !== c.slug);

  return (
    <Room theme={c.theme}>
      <header className="room-head">
        <p className="ex-eyebrow">Room {c.number}</p>
        <h1>{c.title}</h1>
        <p className="ex-lede">{c.intro}</p>
        <div className="ex-actions">
          <Link href="/exhibition/gallery" className="btn ghost">← Main gallery</Link>
          {c.slug === "decade" ? <Link href="/exhibition/timeline" className="btn ghost">See the timeline</Link> : null}
        </div>
      </header>
      {c.categories.map((cat) => (
        <section key={cat.slug} className="category" aria-labelledby={`h-${cat.slug}`}>
          {c.categories.length > 1 || c.slug !== "decade" ? (
            <header className="category-head">
              <h2 id={`h-${cat.slug}`}>{cat.title}</h2>
              <p>{cat.intro}</p>
            </header>
          ) : <h2 id={`h-${cat.slug}`} className="sr-only">{cat.title}</h2>}
          <div className="cards">
            {cat.exhibits.map((e) => <ExhibitCard key={e.slug} exhibit={e} preview={preview} showCategory={false} />)}
          </div>
        </section>
      ))}
      <nav className="related" aria-label="Related collections">
        <h2>Continue exploring</h2>
        <ul>
          <li><Link href="/exhibition/hall-of-fame">The Hall of Fame</Link></li>
          {others.map((o) => <li key={o.slug}><Link href={`/exhibition/collections/${o.slug}`}>{o.title}</Link></li>)}
        </ul>
      </nav>
      <RoomPager href={`/exhibition/collections/${c.slug}`} />
    </Room>
  );
}
