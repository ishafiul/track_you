import React from 'react';
import { Separator } from '@/components/ui/separator';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Simple to integrate, powerful to use. Our SDK makes implementing background location tracking straightforward.
            </p>
          </div>
        </div>
        
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <h3 className="text-2xl font-bold">Easy Integration</h3>
            <p className="text-muted-foreground">
              With just a few lines of code, you can add sophisticated background location tracking to your Flutter application.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">1</div>
                <h4 className="font-medium">Install the package</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Add our package to your pubspec.yaml file and run flutter pub get.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">2</div>
                <h4 className="font-medium">Configure the plugin</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Set up your desired tracking parameters such as distance filter, desired accuracy, and more.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">3</div>
                <h4 className="font-medium">Start tracking</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Call the start method to begin tracking location in the background.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">4</div>
                <h4 className="font-medium">Handle location updates</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Listen to location updates and process them according to your app's needs.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
            <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 bg-muted/80 px-4 py-2 border-b border-border/50">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="ml-2 text-sm font-medium">main.dart</div>
              </div>
              <pre className="p-4 overflow-x-auto text-sm">
                <code className="language-dart">
{`import 'package:flutter/material.dart';
import 'package:track_you/track_you.dart';

void main() async {
  // Initialize the plugin
  await TrackYou.initialize(config: {
    'distanceFilter': 10.0,
    'desiredAccuracy': LocationAccuracy.HIGH,
    'startOnBoot': true,
    'stopOnTerminate': false,
    'debug': true,
    'logLevel': LogLevel.VERBOSE
  });

  // Listen for location updates
  TrackYou.onLocation((Location location) {
    print('[LOCATION] \${location.latitude}, \${location.longitude}');
    
    // Send to your server
    uploadLocation(location);
  });

  // Start tracking
  await TrackYou.start();

  runApp(MyApp());
}

Future<void> uploadLocation(Location location) async {
  // Your server integration code here
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
        
        <Separator className="my-16" />
        
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
            <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 bg-muted/80 px-4 py-2 border-b border-border/50">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="ml-2 text-sm font-medium">geofence_example.dart</div>
              </div>
              <pre className="p-4 overflow-x-auto text-sm">
                <code className="language-dart">
{`// Create a geofence
await TrackYou.addGeofence({
  'identifier': 'office',
  'radius': 100,
  'latitude': 37.33182,
  'longitude': -122.03118,
  'notifyOnEntry': true,
  'notifyOnExit': true,
  'notifyOnDwell': true,
  'loiteringDelay': 30000  // 30 seconds
});

// Create a polygon geofence
await TrackYou.addGeofence({
  'identifier': 'campus',
  'polygon': [
    [37.33241, -122.03284],
    [37.33293, -122.03036],
    [37.33118, -122.02955],
    [37.33075, -122.03204]
  ],
  'notifyOnEntry': true,
  'notifyOnExit': true
});

// Listen for geofence transitions
TrackYou.onGeofence((GeofenceEvent event) {
  print('[GEOFENCE] \${event.identifier}: \${event.action}');
  
  if (event.action == 'ENTER') {
    // Handle entry event
  } else if (event.action == 'EXIT') {
    // Handle exit event
  } else if (event.action == 'DWELL') {
    // Handle dwell event
  }
});`}
                </code>
              </pre>
            </div>
          </div>
          
          <div className="flex flex-col justify-center space-y-4 order-1 lg:order-2">
            <h3 className="text-2xl font-bold">Advanced Geofencing</h3>
            <p className="text-muted-foreground">
              Our SDK provides powerful geofencing capabilities, allowing you to monitor unlimited geofences with various transition types.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Circular Geofences</h4>
                <p className="text-sm text-muted-foreground">
                  Create traditional circular geofences with customizable radius and transition types.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Polygon Geofences</h4>
                <p className="text-sm text-muted-foreground">
                  Define complex areas using polygon geofences of any shape and size.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Persistent Geofences</h4>
                <p className="text-sm text-muted-foreground">
                  Geofences persist across app termination and device reboots, ensuring continuous monitoring.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Multiple Transition Types</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor ENTER, EXIT, and DWELL events to create sophisticated location-based triggers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 