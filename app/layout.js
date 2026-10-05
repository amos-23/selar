import "./globals.css";

export const metadata = { title: "Ticket Invite" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
