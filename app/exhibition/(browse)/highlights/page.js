import { notFound } from "next/navigation";
import Room from "@/components/exhibition/Room";
import RoomPager from "@/components/exhibition/RoomPager";
import MediaGallery from "@/components/exhibition/MediaGallery";
import { hasMedia, visibleMedia, isPreview } from "@/lib/exhibition/content";

export const metadata = {
  title: "Inside the Exhibition",
  description: "Photographs and films from the physical exhibition.",
  alternates: { canonical: "/exhibition/highlights" },
};

export default function Highlights() {
  if (!hasMedia()) notFound(); // unpublished sections are not exposed publicly
  return (
    <Room theme="grey">
      <header className="room-head">
        <p className="ex-eyebrow">Room 10</p>
        <h1>Inside the Exhibition</h1>
        <p className="ex-lede">Photographs and films from the physical exhibition.</p>
      </header>
      <MediaGallery items={visibleMedia()} preview={isPreview()} />
      <RoomPager href="/exhibition/highlights" />
    </Room>
  );
}
