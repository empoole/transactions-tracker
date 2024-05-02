import type { Metadata } from "next";
import { QuickstartProvider } from "@/context/context";

import "./globals.css";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="w-full px-8 py-4 overflow-x-hidden border-t flex flex-col">
          <QuickstartProvider>{children}</QuickstartProvider>
        </div>
      </body>
    </html>
  );
}
