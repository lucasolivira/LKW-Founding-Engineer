import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LKW - Verdebrasil",
  description: "Sistema de cotação de fretes com extração via LLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
