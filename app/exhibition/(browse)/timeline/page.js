import Room from "@/components/exhibition/Room";
import RoomPager from "@/components/exhibition/RoomPager";
import Timeline from "@/components/exhibition/Timeline";
import { timelineEntries, getCategory, formatExhibitDate, isPreview } from "@/lib/exhibition/content";

export const metadata = {
  title: "The Timeline",
  description: "Recorded milestones from Selar’s first decade, in chronological order.",
  alternates: { canonical: "/exhibition/timeline" },
};

export default function TimelinePage() {
  const entries = timelineEntries().map((e) => ({
    slug: e.slug, title: e.title, creator: e.creator, achievement: e.achievement, figure: e.figure ?? null,
    when: formatExhibitDate(e.date, e.datePrecision), year: e.date.slice(0, 4), categoryTitle: getCategory(e.category)?.title ?? "", status: e.publicationStatus,
  }));
  return (
    <Room theme="grey">
      <header className="room-head">
        <p className="ex-eyebrow">The Timeline</p>
        <h1>A decade, in order</h1>
        <p className="ex-lede">Select a milestone to open it. This timeline uses only dates recorded in the exhibition’s source material, so it is a selection of moments rather than a complete history.</p>
      </header>
      <Timeline entries={entries} preview={isPreview()} />
      <RoomPager href="/exhibition/timeline" />
    </Room>
  );
}
