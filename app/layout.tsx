import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { SessionManager } from "@/components/auth/SessionManager";
import { Chatbot } from "@/components/ui/Chatbot";
import { I18nWrapper } from '@/components/I18nWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Animal System",
  description: "Pet health monitoring and management system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <I18nWrapper>
          <AuthProvider>
            <SessionManager/>
            <main>{children}</main>
            <Footer />
            <Chatbot />
          </AuthProvider>
        </I18nWrapper>
      </body>
    </html>
  );
}