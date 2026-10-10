import Room from "@/components/exhibition/Room";
import RoomPager from "@/components/exhibition/RoomPager";
import StatusBadge from "@/components/exhibition/StatusBadge";
import SafeImage from "@/components/exhibition/SafeImage";
import { statement } from "@/content/exhibition/statement";
import { openingStatement, openingStatementVisible, isPreview } from "@/lib/exhibition/content";

export const metadata = {
  title: "About the Exhibition",
  description: "The Gears of Creativity: why Selar is celebrating a decade of the African creator economy.",
  alternates: { canonical: "/exhibition/about" },
};

export default function About() {
  const preview = isPreview();
  const s = openingStatement;
  const hasText = Array.isArray(s.text) && s.text.length > 0;
  return (
    <Room theme="blush">
      <header className="room-head">
        <p className="ex-eyebrow">Room 2 · The exhibition statement</p>
        <h1>{statement.title}</h1>
      </header>
      {openingStatementVisible() ? (
        <section className="opening" aria-labelledby="opening-h">
          <h2 id="opening-h">{s.title || "Opening statement"}</h2>
          <p className="opening-by">{s.speaker}{s.role ? `, ${s.role}` : ""}</p>
          {s.portrait?.src ? <SafeImage className="opening-portrait" src={s.portrait.src} alt={s.portrait.alt ?? s.speaker} /> : null}
          {hasText ? s.text.map((p, i) => <p key={i}>{p}</p>) : <p className="empty">The approved text of this statement has not been supplied yet.</p>}
          {s.recording?.src ? (
            s.recording.type === "audio"
              ? <audio controls preload="none" src={s.recording.src} />
              : <video controls preload="none" src={s.recording.src}>{s.recording.captions ? <track kind="captions" src={s.recording.captions} srcLang="en" label="English" /> : null}</video>
          ) : null}
          <StatusBadge status={s.publicationStatus} preview={preview} />
        </section>
      ) : null}
      <div className="statement">
        {statement.paragraphs.map((p, i) => <p key={i} className={i === 0 ? "statement-lead" : undefined}>{p}</p>)}
        <p className="statement-close">{statement.closingLine}</p>
      </div>

      <RoomPager href="/exhibition/about" />
    </Room>
  );
}
