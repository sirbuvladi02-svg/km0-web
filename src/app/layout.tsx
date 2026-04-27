import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/ui/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KM0 · farm2you — Mercato a chilometro zero",
  description:
    "Trova produttori locali, scopri prodotti di stagione e sostieni la filiera corta. KM0 mette in contatto contadini, ristoranti e botteghe del tuo territorio.",
  metadataBase: new URL("https://farm2you.vercel.app"),
  openGraph: {
    title: "KM0 · farm2you",
    description:
      "Mercato digitale a km zero: contadini, ristoranti e botteghe collegati senza intermediari.",
    type: "website",
    locale: "it_IT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-app text-ink-900 font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
