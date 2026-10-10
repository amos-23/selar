import Link from "next/link";
import Room from "@/components/exhibition/Room";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Room theme="deep">
      <header className="room-head">
        <p className="ex-eyebrow">Not found</p>
        <h1>This room isn’t part of the exhibition</h1>
        <p className="ex-lede">The link may be out of date, or the exhibit may not be published yet.</p>
        <div className="ex-actions">
          <Link href="/exhibition/gallery" className="btn primary">Return to the main gallery</Link>
          <Link href="/exhibition/hall-of-fame" className="btn ghost">Browse the Hall of Fame</Link>
        </div>
      </header>
    </Room>
  );
}
