import Room from "@/components/exhibition/Room";
import RoomPager from "@/components/exhibition/RoomPager";
import HallOfFame from "@/components/exhibition/HallOfFame";
import { categoriesWithExhibits, isPreview } from "@/lib/exhibition/content";

export const metadata = {
  title: "The Hall of Fame",
  description: "The creators, affiliates, products and records celebrated in Selar’s first decade.",
  alternates: { canonical: "/exhibition/hall-of-fame" },
};

export default function HallOfFamePage() {
  return (
    <Room theme="deep">
      <header className="room-head" id="search">
        <p className="ex-eyebrow">Room 4</p>
        <h1>The Hall of Fame</h1>
        <p className="ex-lede">Every category of achievement. Browse them all, filter by category, or search for a name.</p>
      </header>
      <HallOfFame categories={categoriesWithExhibits()} preview={isPreview()} />
      <RoomPager href="/exhibition/hall-of-fame" />
    </Room>
  );
}
