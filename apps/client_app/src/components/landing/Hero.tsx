import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  return (
    <section className="py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit border-primary/20 bg-primary/10 text-primary">
                Battery-efficient location tracking
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                The most sophisticated background location tracking SDK
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                A highly configurable, cross-platform background location-tracking plugin implementing the latest native APIs for iOS and Android.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <a href="/login">
                <Button size="lg" className="font-medium">
                  Get Started
                </Button>
              </a>
              <a href="/docs">
                <Button size="lg" variant="outline" className="font-medium">
                  View Documentation
                </Button>
              </a>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 h-4 w-4 text-primary"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Battery Efficient</span>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 h-4 w-4 text-primary"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Cross Platform</span>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 h-4 w-4 text-primary"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Highly Configurable</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-xl border border-border bg-muted/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-3/4 aspect-[4/3]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full text-primary/30">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-primary animate-ping"></div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-background/80 backdrop-blur p-4 shadow-lg">
                <div className="text-xs font-medium">Live tracking demo</div>
                <div className="mt-1 text-xs text-muted-foreground">Tracking a device with minimal battery impact</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 