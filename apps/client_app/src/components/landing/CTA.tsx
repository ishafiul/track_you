import React from 'react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Ready to get started?
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Start building with TrackYou today
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Join thousands of developers who trust our SDK for their location tracking needs. Get started with a free trial today.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <a href="/signup">
                <Button size="lg" className="font-medium">
                  Start Free Trial
                </Button>
              </a>
              <a href="/contact">
                <Button size="lg" variant="outline" className="font-medium">
                  Contact Sales
                </Button>
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[400px] aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 rounded-full blur-3xl"></div>
              <div className="relative h-full w-full flex items-center justify-center">
                <div className="rounded-xl overflow-hidden border border-border bg-background/80 backdrop-blur-sm shadow-xl p-6 w-full max-w-[350px]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className="font-medium">TrackYou SDK</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Features included:</div>
                      <ul className="space-y-1">
                        <li className="flex items-center text-sm">
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
                            className="mr-2 h-4 w-4 text-primary"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Battery Efficiency
                        </li>
                        <li className="flex items-center text-sm">
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
                            className="mr-2 h-4 w-4 text-primary"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Infinite Geofencing
                        </li>
                        <li className="flex items-center text-sm">
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
                            className="mr-2 h-4 w-4 text-primary"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Native HTTP Layer
                        </li>
                        <li className="flex items-center text-sm">
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
                            className="mr-2 h-4 w-4 text-primary"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Cross-Platform Support
                        </li>
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Starting at</span>
                        <span className="font-medium">$389</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 