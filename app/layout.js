import "./globals.css";

export const metadata = {
  title: "Selar Anniversary Exhibition",
  description: "A celebration of the journey, the people and the ideas that have shaped Selar.",
  icons: { icon: "/selar-logo.png" },
  robots: { index: false, follow: false },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#5a0b4d" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
