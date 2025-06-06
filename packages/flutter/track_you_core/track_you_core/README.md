# Track You Core

[![style: very good analysis][very_good_analysis_badge]][very_good_analysis_link]
[![Powered by Mason](https://img.shields.io/endpoint?url=https%3A%2F%2Ftinyurl.com%2Fmason-badge)](https://github.com/felangel/mason)
[![License: MIT][license_badge]][license_link]

A Flutter plugin for location tracking with both foreground and background capability.

## Features

- Real-time location tracking in foreground
- Continuous background location updates
- Automatic permission handling for both iOS and Android
- Battery-efficient location tracking
- Reliable location updates even when app is in background or killed

## Installation

```yaml
dependencies:
  track_you_core: ^1.0.0
```

## Setup

### Android

Add the following permissions to your Android `AndroidManifest.xml` file:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

For Android 10+ (API level 29+), you need to request background location permission separately in your app after getting foreground permission:

```dart
// Example permission request logic (not included in the plugin):
if (/* check if API level >= 29 */) {
  // First request ACCESS_FINE_LOCATION
  // Then show dialog explaining why you need background location
  // Then request ACCESS_BACKGROUND_LOCATION
}
```

### iOS

Add the following keys to your iOS `Info.plist` file:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location when open.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location when in the background.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This app needs access to location when in the background.</string>
<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

## Usage

### Basic Usage

```dart
import 'package:track_you_core/track_you_core.dart';

// Start listening to location updates
Stream<Map<String, dynamic>> locationStream = getLocationUpdates();
locationStream.listen((locationData) {
  print('Location update: ${locationData['latitude']}, ${locationData['longitude']}');
  
  // Access all available location data:
  // locationData['latitude'] - double
  // locationData['longitude'] - double
  // locationData['altitude'] - double
  // locationData['accuracy'] - double
  // locationData['speed'] - double
  // locationData['bearing'] - double
  // locationData['timestamp'] - int (milliseconds since epoch)
});
```

### Start Background Location Service

Start the service when you want to track location in background:

```dart
bool serviceStarted = await startLocationService();
if (serviceStarted) {
  print('Location service started successfully');
} else {
  print('Failed to start location service');
}
```

### Stop Background Location Service

Stop the service when you no longer need background updates:

```dart
bool serviceStopped = await stopLocationService();
if (serviceStopped) {
  print('Location service stopped successfully');
} else {
  print('Failed to stop location service');
}
```

## How it works

### Android

On Android, this plugin uses a Foreground Service with a persistent notification to ensure reliable background location tracking. This approach:

- Keeps the location service running even when the app is in the background
- Prevents the system from killing the service during memory pressure
- Shows a notification to the user (required by Android) when tracking location
- Uses broadcast receivers to communicate between service and Flutter

### iOS

On iOS, the plugin uses:

- Background location mode in Info.plist
- `allowsBackgroundLocationUpdates` flag enabled
- Significant location changes monitoring
- Background tasks to extend runtime

## License

Copyright (c) 2023 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[license_badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license_link]: https://opensource.org/licenses/MIT
[very_good_analysis_badge]: https://img.shields.io/badge/style-very_good_analysis-B22C89.svg
[very_good_analysis_link]: https://pub.dev/packages/very_good_analysis
