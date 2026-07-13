import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MerkurioThemeProvider, MerkurioThemeScript } from "@site-platform/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Platform Dashboard"
};

type RootLayoutProps = {
  readonly children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <head>
        <MerkurioThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Prata&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MerkurioThemeProvider>{children}</MerkurioThemeProvider>
      </body>
    </html>
  );
}
