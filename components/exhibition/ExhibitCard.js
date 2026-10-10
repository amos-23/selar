import Link from "next/link";
import StatusBadge from "./StatusBadge";

export default function ExhibitCard({ exhibit, categoryTitle, preview = false, showCategory = true }) {
  const year = exhibit.category === "creator-of-the-year"; // the year is the figure, so the creator is the title
  return (
    <Link href={`/exhibition/exhibits/${exhibit.slug}`} className="ex-card">
      {showCategory && categoryTitle ? <span className="card-kicker">{categoryTitle}</span> : null}
      {exhibit.figure ? (
        <span className="card-figure">
          <strong>{exhibit.figure.value}</strong>
          <small>{exhibit.figure.label}</small>
        </span>
      ) : null}
      <span className="card-title">{year ? exhibit.creator : exhibit.title}</span>
      {!year && exhibit.creator && exhibit.creator !== exhibit.title ? <span className="card-creator">{exhibit.creator}</span> : null}
      {exhibit.category !== "creator-of-the-year" ? <span className="card-text">{exhibit.achievement}</span> : null}
      <StatusBadge status={exhibit.publicationStatus} preview={preview} />
      <span className="card-open" aria-hidden="true">Open exhibit →</span>
    </Link>
  );
}
