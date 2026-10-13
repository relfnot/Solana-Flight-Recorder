import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Flight Recorder | Transaction diagnostics",
  description: "Turn Solana transaction evidence into a clear, portable incident report. Read-only diagnostics, explicit uncertainty, no wallet required.",
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
