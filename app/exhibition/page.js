import Link from "next/link";
import Gears from "@/components/exhibition/Gears";
import { statement } from "@/content/exhibition/statement";

export default function Entrance() {
  return (
    <section className="entrance" aria-labelledby="entrance-title">
      <Gears className="entrance-gears" />
      <div className="entrance-inner rise">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="entrance-logo" src="/selar-logo-white.png" alt="Selar" width="200" height="103" />
        <p className="ex-eyebrow">Selar at 10 · Virtual exhibition</p>
        <h1 id="entrance-title">The Gears of Creativity</h1>
        <p className="entrance-lede">{statement.intro}</p>
        <div className="ex-actions">
          <Link href="/exhibition/gallery" className="btn primary">Enter Exhibition</Link>
          <Link href="/exhibition/about" className="btn ghost">Read the exhibition statement</Link>
        </div>
      </div>
    </section>
  );
}
