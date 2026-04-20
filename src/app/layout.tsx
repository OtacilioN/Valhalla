import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { TRPCProvider } from "@/presentation/components/shared/TRPCProvider";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Valhalla — OBR Tournament Manager",
  description: "Gerenciador de torneios offline para a Olimpíada Brasileira de Robótica",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
