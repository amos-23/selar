"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { href: "/exhibition", label: "Walk the exhibition", exact: true },
  { href: "/exhibition/gallery", label: "Explore" },
  { href: "/exhibition/hall-of-fame", label: "Hall of Fame" },
  { href: "/exhibition/timeline", label: "Timeline" },
  { href: "/exhibition/highlights", label: "Highlights", optional: true },
  { href: "/exhibition/about", label: "About" },
];

export default function Nav({ showHighlights }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const first = useRef(true);

  // Count in-app navigations so BackButton knows whether history.back() stays inside the exhibition.
  useEffect(() => {
    setOpen(false);
    if (first.current) { first.current = false; return; }
    window.__exNav = (window.__exNav || 0) + 1; // in memory: resets on a full page load, so external arrivals fall back
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items = ITEMS.filter((i) => !i.optional || showHighlights);
  const active = (i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));

  return (
    <header className="topbar">
      <a className="skip" href="#main">Skip to content</a>
      <Link href="/exhibition/gallery" className="brand" aria-label="Selar at 10: return to the main gallery">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/selar-logo-white.png" alt="Selar" width="96" height="49" />
        <span className="brand-ten">at 10</span>
      </Link>
      <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="ex-menu" onClick={() => setOpen(!open)}>
        <span className="sr-only">Menu</span>
        <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
      </button>
      <nav id="ex-menu" className={`menu ${open ? "open" : ""}`} aria-label="Exhibition">
        <ul>
          {items.map((i) => (
            <li key={i.href}>
              <Link href={i.href} aria-current={active(i) ? "page" : undefined} className={active(i) ? "on" : ""}>{i.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
