import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIP — Aesthetics Intelligence Platform",
  description:
    "Your appearance. Your perspective. Explore, compare, and prepare for a considered aesthetic consultation with AIP.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
