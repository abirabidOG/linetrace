import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LineTrace: Free Line Art to Vector Converter (SVG, No Sign-Up)",
  description:
    "Turn line art into clean vectors. Free, in your browser, no sign-up. SVG, PNG and ZIP export, files never leave your device.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
