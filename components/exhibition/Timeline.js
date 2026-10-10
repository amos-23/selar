"use client";
import Link from "next/link";
import { useState } from "react";
import StatusBadge from "./StatusBadge";

// entries: [{ slug, title, creator, achievement, figure, when, year, categoryTitle, status }]
export default function Timeline({ entries, preview, onOpen }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const years = [...new Set(entries.map((e) => e.year))];
  const allOpen = openIds.size === entries.length;

  const toggle = (slug) => setOpenIds((s) => { const n = new Set(s); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });

  return (
    <>
      <div className="tl-controls">
        <nav aria-label="Jump to year" className="chips">
          {years.map((y) => <a key={y} className="chip" href={`#y-${y}`}>{y}</a>)}
        </nav>
        <button type="button" className="btn ghost sm" onClick={() => setOpenIds(allOpen ? new Set() : new Set(entries.map((e) => e.slug)))}>
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <ol className="tl">
        {years.map((y) => (
          <li key={y} id={`y-${y}`} className="tl-year">
            <h2 className="tl-year-label">{y}</h2>
            <ul className="tl-items">
              {entries.filter((e) => e.year === y).map((e) => {
                const open = openIds.has(e.slug);
                return (
                  <li key={e.slug} className={`tl-item ${open ? "open" : ""}`}>
                    <button type="button" className="tl-toggle" aria-expanded={open} aria-controls={`tl-${e.slug}`} onClick={() => toggle(e.slug)}>
                      <span className="tl-when">{e.when}</span>
                      <span className="tl-title">{e.title}{e.creator && e.creator !== e.title ? <em> · {e.creator}</em> : null}</span>
                      <span className="tl-cat">{e.categoryTitle}</span>
                      <StatusBadge status={e.status} preview={preview} />
                    </button>
                    <div id={`tl-${e.slug}`} className="tl-body" hidden={!open}>
                      <p>{e.achievement}</p>
                      {e.figure ? <p className="tl-figure"><strong>{e.figure.value}</strong> {e.figure.label}</p> : null}
                      {onOpen
                        ? <button type="button" className="btn sm" onClick={() => onOpen(e.slug)}>Walk to this exhibit</button>
                        : <Link href={`/exhibition/exhibits/${e.slug}`} className="btn sm">Open exhibit</Link>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
