import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "For building 1 app",
      price: "$389",
      features: [
        "1 application key",
        "Perpetual license",
        "Support via Github issues",
        "1 year access to latest updates"
      ],
      popular: false,
      buttonText: "Buy Now"
    },
    {
      name: "Venture",
      description: "For building 5 apps",
      price: "$499",
      originalPrice: "$639",
      features: [
        "5 application keys",
        "Perpetual license",
        "Support via Github issues",
        "1 year access to latest updates"
      ],
      popular: true,
      buttonText: "Buy Now"
    },
    {
      name: "Pro",
      description: "For building 25 apps",
      price: "$649",
      originalPrice: "$749",
      features: [
        "25 application keys",
        "Perpetual license",
        "Premium Support via Github issues and Slack",
        "1 year access to latest updates"
      ],
      popular: false,
      buttonText: "Buy Now"
    },
    {
      name: "Studio",
      description: "For building 100 apps",
      price: "$749",
      originalPrice: "$949",
      features: [
        "100 application keys",
        "Perpetual license",
        "Premium Support via Github issues and Slack",
        "1 year access to latest updates"
      ],
      popular: false,
      buttonText: "Buy Now"
    }
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Pricing Plans
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose the right plan for your needs. Each key is bound to a single application identifier and valid for unlimited devices.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <Card key={index} className={`flex flex-col ${plan.popular ? 'border-primary shadow-md' : 'border-border/50'}`}>
              <CardHeader>
                {plan.popular && (
                  <Badge variant="outline" className="w-fit mb-2 border-primary/20 bg-primary/10 text-primary">
                    Popular
                  </Badge>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="ml-2 text-muted-foreground line-through text-sm">
                      {plan.originalPrice}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
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
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className={`w-full ${plan.popular ? '' : 'variant-outline'}`}>
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Plans are easily upgradable after purchase. Need a custom plan?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
} 