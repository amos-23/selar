import "./exhibition.css";
import { statement } from "@/content/exhibition/statement";

const base = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
const description = "Explore The Gears of Creativity, Selar’s celebration of the creators, products and milestones that have helped shape the African creator economy.";

export const metadata = {
  metadataBase: new URL(base),
  title: { default: "Selar at 10 | The Gears of Creativity", template: "%s | Selar at 10" },
  description,
  robots: { index: true, follow: true },
  alternates: { canonical: "/exhibition" },
  openGraph: { type: "website", siteName: "Selar at 10", title: "Selar at 10 | The Gears of Creativity", description, url: "/exhibition", images: [{ url: "/brand/selar10-og.png", width: 1200, height: 630, alt: "Selar at 10" }] },
  twitter: { card: "summary_large_image", title: "Selar at 10 | The Gears of Creativity", description, images: ["/brand/selar10-og.png"] },
  other: { "x-exhibition": statement.title },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#2d0025" };

export default function ExhibitionLayout({ children }) {
  return (
    <div className="ex">
      {children}
    </div>
  );
}
