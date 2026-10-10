import Link from "next/link";
import Room from "@/components/exhibition/Room";
import RoomPager from "@/components/exhibition/RoomPager";
import Gears from "@/components/exhibition/Gears";
import ShareControls from "@/components/exhibition/ShareControls";
import { statement } from "@/content/exhibition/statement";

export const metadata = {
  title: "The Closing Reflection",
  description: statement.closingLine,
  alternates: { canonical: "/exhibition/closing" },
};

export default function Closing() {
  return (
    <Room theme="purple" className="closing">
      <Gears className="closing-gears" />
      <div className="closing-inner">
        <p className="ex-eyebrow">Room 11</p>
        <h1>{statement.closingLine}</h1>
        <p className="ex-lede">Thank you for visiting Selar at 10.</p>
        <div className="ex-actions">
          <Link href="/exhibition/gallery" className="btn primary">Return to the main gallery</Link>
          <a href="https://selar.com" className="btn ghost" rel="noopener">Visit Selar</a>
          <ShareControls title="Selar at 10 | The Gears of Creativity" text={statement.closingLine} path="/exhibition" />
        </div>
      </div>
      <RoomPager href="/exhibition/closing" />
    </Room>
  );
}
