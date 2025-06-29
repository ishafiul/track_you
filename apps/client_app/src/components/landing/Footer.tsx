import React from 'react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border/40">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span className="font-bold text-xl">TrackYou</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The most sophisticated, battery-conscious background location-tracking & geofencing SDK for iOS and Android.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com/trackyou" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://github.com/trackyou" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
              </a>
              <a href="https://discord.gg/trackyou" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M9 12h.01M15 12h.01M8.5 17.5l-1.5.5s1.5 2 4 2c2.5 0 4-2 4-2l-1.5-.5"></path>
                  <path d="M15.5 17.5 14 18l1 2c2.5 0 4-2 4-2l-1.5-.5"></path>
                  <path d="M8.5 17.5 10 18l-1 2c-2.5 0-4-2-4-2l1.5-.5"></path>
                  <path d="M20.5 9c0 3-2.5 5.5-5.5 5.5S9.5 12 9.5 9 12 3.5 15 3.5s5.5 2.5 5.5 5.5Z"></path>
                  <path d="M3.5 9c0 3 2.5 5.5 5.5 5.5"></path>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              </li>
              <li>
                <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              </li>
              <li>
                <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              </li>
              <li>
                <a href="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</a>
              </li>
              <li>
                <a href="/changelog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Changelog</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a>
              </li>
              <li>
                <a href="/case-studies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Case Studies</a>
              </li>
              <li>
                <a href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
              </li>
              <li>
                <a href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              </li>
              <li>
                <a href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Community</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</a>
              </li>
              <li>
                <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </li>
              <li>
                <a href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a>
              </li>
              <li>
                <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TrackYou. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </a>
            <a href="/sitemap" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 