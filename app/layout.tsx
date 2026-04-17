import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { SessionManager } from "@/components/auth/SessionManager";
import { Chatbot } from "@/components/ui/Chatbot";
import Script from "next/script";

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
      <head>
        <meta 
          httpEquiv="Content-Security-Policy" 
          content="frame-src 'self' https://my.spline.design https://*.spline.design; script-src 'unsafe-inline' 'unsafe-eval' 'self' https://my.spline.design https://translate.google.com;" 
        />
        
        {/* Google Translate Widget - Hidden but functional */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,si,ta,hi,es,fr,de,it,pt,ru,zh-CN,zh-TW,ja,ko,ar,bn,ur,th,vi,id,ms,fil,sw,tr,nl,pl,sv,no,fi,da,el,he,fa',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false,
                  multilanguagePage: true
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <AuthProvider>
          <SessionManager/>
          <main>{children}</main>
          <Footer />
          <Chatbot />
          {/* Google Translate Element - MUST be visible for translation to work */}
          <div id="google_translate_element" style={{ position: 'fixed', bottom: '0', left: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' }} />
        </AuthProvider>
      </body>
    </html>
  );
}