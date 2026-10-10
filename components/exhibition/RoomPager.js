import Link from "next/link";
import { tour, hasMedia } from "@/lib/exhibition/content";

// Guided route: previous / next stop. Direct navigation always remains available from the nav.
export default function RoomPager({ href }) {
  const stops = tour.filter((s) => s.optional !== "media" || hasMedia());
  const i = stops.findIndex((s) => s.href === href);
  if (i < 0) return null;
  const prev = stops[i - 1], next = stops[i + 1];
  return (
    <nav className="pager" aria-label="Guided route">
      {prev ? <Link href={prev.href} className="pager-link"><small>Previous room</small><span>← {prev.label}</span></Link> : <span />}
      {next ? <Link href={next.href} className="pager-link next"><small>Next room</small><span>{next.label} →</span></Link> : <span />}
    </nav>
  );
}
