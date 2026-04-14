"use client";

import Link from 'next/link';
import { PawPrint, Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-t border-primary/10 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PawHealth
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered pet care platform helping you monitor your furry friend&apos;s health with smart insights and real-time data.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <button className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info - Updated with your details */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Get in Touch</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-accent" />
                pawhealthassociation@gmail.com
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-accent" />
                +94 77 123 4567
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                Colombo, Sri Lanka
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} PawHealth Association. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Terms
            </Link>
            <Link href="/sitemap" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}