import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melia EDU",
  description: "Plataforma pedagógica inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}