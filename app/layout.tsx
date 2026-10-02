import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luxure Nest | WhatsApp AI Sales Agent Concierge",
  description: "Production-ready WhatsApp AI Sales Agent & Business Concierge Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f17] text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
