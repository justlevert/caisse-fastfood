import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/contexts/DataContext";

export const metadata: Metadata = {
  title: "Caisse Fast-Food",
  description: "Application de caisse professionnelle pour fast-food",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Caisse Fast-Food",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-gray-50">
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}

