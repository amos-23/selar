import "./globals.css";

export const metadata = {
  title: "Selar Anniversary Exhibition",
  description: "A celebration of the journey, the people and the ideas that have shaped Selar.",
  icons: { icon: [{ url: "/brand/selar10-icon-48.png", sizes: "48x48" }, { url: "/brand/selar10-icon-512.png", sizes: "512x512" }], apple: "/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#5a0b4d" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Brand typefaces (Parkinsans headlines, Google Sans Flex text); Inter/system fonts are the fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Parkinsans:wght@400;600;700&family=Google+Sans+Flex:wght@400;500;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
