import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { localStorageService } from 'http-client-local';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const accessToken = localStorageService.getAccessToken();
      const customTokens = localStorage.getItem('authTokens');
      setIsAuthenticated(!!(accessToken || customTokens));
    };

    checkAuth();

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="font-bold text-xl">TrackYou</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-foreground/70 hover:text-foreground transition-colors">How It Works</a>
          <a href="#pricing" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
          <a href="#testimonials" className="text-foreground/70 hover:text-foreground transition-colors">Testimonials</a>
          <a href="/docs" className="text-foreground/70 hover:text-foreground transition-colors">Documentation</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <a href="/dashboard">
              <Button>Go to Dashboard</Button>
            </a>
          ) : (
            <>
              <a href="/login">
                <Button variant="ghost">Log in</Button>
              </a>
              <a href="/login">
                <Button>Get Started</Button>
              </a>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="container mx-auto max-w-7xl py-4 flex flex-col gap-4">
            <a href="#features" className="py-2 text-foreground/70 hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="py-2 text-foreground/70 hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="py-2 text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="py-2 text-foreground/70 hover:text-foreground transition-colors">Testimonials</a>
            <a href="/docs" className="py-2 text-foreground/70 hover:text-foreground transition-colors">Documentation</a>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              {isAuthenticated ? (
                <a href="/dashboard">
                  <Button className="w-full justify-start">Go to Dashboard</Button>
                </a>
              ) : (
                <>
                  <a href="/login">
                    <Button variant="ghost" className="w-full justify-start">Log in</Button>
                  </a>
                  <a href="/login">
                    <Button className="w-full justify-start">Get Started</Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 