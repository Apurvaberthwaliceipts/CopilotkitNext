import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CopilotKit Todos",
  description: "A simple todo app using CopilotKit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: 'transparent' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors 'self' http://localhost:4200" />
      </head>
      <body className={`${inter.className} iframe-body`} style={{ backgroundColor: 'transparent' }}>
        <div style={{ backgroundColor: 'transparent' }}>
          <Suspense>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
