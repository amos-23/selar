import Link from "next/link";
import { notFound } from "next/navigation";
import Room from "@/components/exhibition/Room";
import ExhibitCard from "@/components/exhibition/ExhibitCard";
import StatusBadge from "@/components/exhibition/StatusBadge";
import ShareControls from "@/components/exhibition/ShareControls";
import BackButton from "@/components/exhibition/BackButton";
import SafeImage from "@/components/exhibition/SafeImage";
import { allExhibits, getExhibit, getCategory, collectionOf, relatedExhibits, neighbours, formatExhibitDate, isPreview, STATUS_LABELS } from "@/lib/exhibition/content";

export const generateStaticParams = () => allExhibits().map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = getExhibit(slug);
  if (!e) return {};
  const title = e.category === "creator-of-the-year" ? `${e.title}: ${e.creator}` : e.title;
  return {
    title,
    description: e.achievement,
    alternates: { canonical: `/exhibition/exhibits/${e.slug}` },
    openGraph: { type: "article", title: `${title} | Selar at 10`, description: e.achievement, url: `/exhibition/exhibits/${e.slug}` },
    twitter: { card: "summary", title: `${title} | Selar at 10`, description: e.achievement },
  };
}

export default async function ExhibitPage({ params }) {
  const { slug } = await params;
  const e = getExhibit(slug);
  if (!e) notFound();
  const preview = isPreview();
  const cat = getCategory(e.category);
  const col = collectionOf(e);
  const related = relatedExhibits(e);
  const { prev, next } = neighbours(e);
  const when = formatExhibitDate(e.date, e.datePrecision);
  const images = [e.image, ...(e.media ?? []).filter((m) => m.type !== "video")].filter((m) => m?.src);

  return (
    <Room theme={col?.theme === "yellow" ? "yellow" : "blush"} as="article" className="exhibit">
      <div className="exhibit-bar">
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link href="/exhibition/gallery">Gallery</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/exhibition/hall-of-fame">Hall of Fame</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/exhibition/hall-of-fame#${cat.slug}`}>{cat.title}</Link>
        </nav>
        <Link href={`/exhibition#${e.slug}`} className="btn sm">Walk to this exhibit</Link>
        <BackButton fallback={col ? `/exhibition/collections/${col.slug}` : "/exhibition/hall-of-fame"} label="Close" />
      </div>

      <div className="exhibit-grid">
        <aside className="plaque" aria-label="Key figure">
          <p className="ex-eyebrow">{cat.title}</p>
          {e.figure ? (
            <p className="plaque-figure"><strong>{e.figure.value}</strong><span>{e.figure.label}</span></p>
          ) : <p className="plaque-figure none"><strong>{e.leaderOf ?? e.award ?? (e.date ? e.date.slice(0, 4) : "★")}</strong></p>}
          {when && e.datePrecision !== "year" ? <p className="plaque-date">{when}</p> : null}
        </aside>

        <div className="exhibit-body">
          <h1>{e.title}</h1>
          {e.creator && e.creator !== e.title ? <p className="exhibit-creator">{e.category === "product-excellence" || e.category === "category-leaders" ? "By " : ""}{e.creator}</p> : null}
          <p className="exhibit-achievement">{e.achievement}</p>
          {e.description ? <p className="exhibit-description">{e.description}</p> : null}
          {images.map((m, i) => (
            <figure key={i} className="exhibit-media"><SafeImage src={m.src} alt={m.alt ?? ""} />{m.caption ? <figcaption>{m.caption}</figcaption> : null}</figure>
          ))}
          <StatusBadge status={e.publicationStatus} preview={preview} />
          {preview ? (
            <aside className="internal" aria-label="Internal notes">
              <h2>Team notes (preview only)</h2>
              <dl>
                <dt>Publication</dt><dd>{STATUS_LABELS[e.publicationStatus]}</dd>
                <dt>Verification</dt><dd>{e.verificationStatus === "verified" ? "Verified against supplied source" : "Needs verification"}</dd>
                <dt>Source</dt><dd>{e.sourceNote}</dd>
              </dl>
            </aside>
          ) : null}
          <ShareControls title={`${e.title} | Selar at 10`} text={e.achievement} path={`/exhibition/exhibits/${e.slug}`} />
        </div>
      </div>

      {related.length ? (
        <section className="related-exhibits" aria-labelledby="related-h">
          <h2 id="related-h">Related exhibits</h2>
          <div className="cards">{related.map((r) => <ExhibitCard key={r.slug} exhibit={r} categoryTitle={getCategory(r.category)?.title} preview={preview} />)}</div>
        </section>
      ) : null}

      <nav className="pager" aria-label={`More in ${cat.title}`}>
        {prev ? <Link href={`/exhibition/exhibits/${prev.slug}`} className="pager-link"><small>Previous in {cat.title}</small><span>← {prev.title}</span></Link> : <span />}
        {next ? <Link href={`/exhibition/exhibits/${next.slug}`} className="pager-link next"><small>Next in {cat.title}</small><span>{next.title} →</span></Link> : <span />}
      </nav>
    </Room>
  );
}
