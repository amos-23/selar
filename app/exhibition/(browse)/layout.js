import Nav from "@/components/exhibition/Nav";
import PreviewBar from "@/components/exhibition/PreviewBar";
import { hasMedia } from "@/lib/exhibition/content";

// The text version of the exhibition: ordinary pages, kept as the accessible, no-WebGL route to all content.
export default function BrowseLayout({ children }) {
  return (
    <>
      <PreviewBar />
      <Nav showHighlights={hasMedia()} />
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="foot">
        <p>Selar at 10 · The Gears of Creativity · Text version</p>
        <p className="foot-line">Welcome to the celebration of African Creators. We are all Creators.</p>
      </footer>
    </>
  );
}
