"use client";
import { useEffect, useMemo, useState } from "react";
import ExhibitCard from "./ExhibitCard";

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// All categories render on the server (so the page works without JavaScript); the controls only filter.
export default function HallOfFame({ categories, preview }) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const h = decodeURIComponent(window.location.hash.slice(1));
    if (h && categories.some((c) => c.slug === h)) setActive(h);
  }, [categories]);

  function choose(slug) {
    setActive(slug);
    try { window.history.replaceState(null, "", slug === "all" ? window.location.pathname : `#${slug}`); } catch {}
  }

  const q = norm(query.trim());
  const shown = useMemo(
    () => categories
      .filter((c) => active === "all" || c.slug === active)
      .map((c) => ({ ...c, exhibits: c.exhibits.filter((e) => !q || norm(`${e.title} ${e.creator ?? ""} ${e.achievement}`).includes(q)) }))
      .filter((c) => c.exhibits.length),
    [categories, active, q]
  );
  const total = shown.reduce((n, c) => n + c.exhibits.length, 0);

  return (
    <>
      <div className="hof-controls">
        <label className="search">
          <span>Find a creator or product</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Coach Dino" autoComplete="off" />
        </label>
        <div className="chips" role="group" aria-label="Filter by category">
          <button type="button" className="chip" aria-pressed={active === "all"} onClick={() => choose("all")}>All</button>
          {categories.map((c) => (
            <button key={c.slug} type="button" className="chip" aria-pressed={active === c.slug} onClick={() => choose(c.slug)}>{c.title}</button>
          ))}
        </div>
        <p className="muted-line" role="status" aria-live="polite">{total} {total === 1 ? "exhibit" : "exhibits"}{q ? ` matching “${query.trim()}”` : ""}</p>
      </div>

      {shown.length === 0 ? (
        <p className="empty">No exhibits match. <button type="button" className="link" onClick={() => { setQuery(""); choose("all"); }}>Clear filters</button></p>
      ) : (
        shown.map((c) => (
          <section key={c.slug} id={c.slug} className="category" aria-labelledby={`h-${c.slug}`}>
            <header className="category-head">
              <h2 id={`h-${c.slug}`}>{c.title}</h2>
              <p>{c.intro}</p>
            </header>
            <div className="cards">
              {c.exhibits.map((e) => <ExhibitCard key={e.slug} exhibit={e} preview={preview} showCategory={false} />)}
            </div>
          </section>
        ))
      )}
    </>
  );
}
