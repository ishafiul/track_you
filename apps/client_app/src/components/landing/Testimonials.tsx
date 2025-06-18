import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function Testimonials() {
  const testimonials = [
    {
      quote: "I was just reading over the readme in the github project and I must say that you did one of the best jobs I've seen documenting the actual logic and edge-cases that we need to know to use your library.",
      author: "David Pennington",
      role: "Software Developer"
    },
    {
      quote: "Thanks Chris! I can't wait to put this plugin to good use and thanks for making this a possibility. It's people like you that make developing hybrid apps possible and more practical and for that I thank you.",
      author: "popcorn245",
      role: "App Developer"
    },
    {
      quote: "You did great job with this. It's a pleasure to see a well written gem like this over the abundance of junk that's out there.",
      author: "SwiftReach Networks",
      role: "Enterprise Client"
    },
    {
      quote: "First I want to congratulate because your plugin and it is just awesome. I have tried on IOS and it is really amazing the way it works. It is just perfect and smooth.",
      author: "AugustoAleGonZhipCode",
      role: "iOS Developer"
    },
    {
      quote: "Let me start by saying that your plugin is really awesome and thank you so much for all your hard work.",
      author: "MaliciousMustard",
      role: "Mobile Developer"
    },
    {
      quote: "Thank you for this library. I was about to write one myself but then I found this library.",
      author: "bardiakhosravi",
      role: "Software Engineer"
    }
  ];

  return (
    <section id="testimonials" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              What Our Users Are Saying
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Don't just take our word for it. See what developers around the world are saying about our SDK.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-background border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4">
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
                    className="h-10 w-10 text-primary/20"
                  >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                  </svg>
                </div>
                <blockquote className="mb-4 text-lg italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a href="/case-studies" className="text-primary hover:underline">
            View more case studies →
          </a>
        </div>
      </div>
    </section>
  );
} 