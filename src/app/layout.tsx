import type { Metadata } from "next";
import { TRPCProvider } from "@/presentation/components/shared/TRPCProvider";
import "./globals.css";

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
      <body className="font-sans antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
