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

// Add this - it's required for mobile responsiveness
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
        {/* ADD THIS CSP META TAG - FIXES SPLINE IFRAME */}
        <meta 
          httpEquiv="Content-Security-Policy" 
          content="frame-src 'self' https://my.spline.design https://*.spline.design; script-src 'unsafe-inline' 'unsafe-eval' 'self' https://my.spline.design https://translate.google.com;" 
        />
        
        {/* Google Translate Widget - Hidden, controlled by navbar */}
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
          {/* Hidden Google Translate Element */}
          <div id="google_translate_element" style={{ display: 'none' }} />
        </AuthProvider>
      </body>
    </html>
  );
}