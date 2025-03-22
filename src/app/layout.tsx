import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ConcentrAPPte - Aumenta tu Productividad",
  description: "Aplicación colaborativa para el control y manejo de tu productividad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0f0f1a]`}>
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}