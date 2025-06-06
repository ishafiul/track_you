import 'dart:io';
import 'package:flutter/foundation.dart' show visibleForTesting;
import 'package:flutter/services.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

/// An implementation of [TrackYouCorePlatform] that uses method channels.
class MethodChannelTrackYouCore extends TrackYouCorePlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = MethodChannel(
    Platform.isAndroid 
        ? 'track_you_core_android' 
        : 'track_you_core_ios',
  );

  /// The event channel used to receive location updates.
  @visibleForTesting
  final eventChannel = const EventChannel('track_you_core/location_updates');



  @override
  Stream<Map<String, dynamic>> getLocationUpdates() {
    return eventChannel.receiveBroadcastStream().map((dynamic event) {
      if (event is Map) {
        return Map<String, dynamic>.from(event);
      }
      return <String, dynamic>{};
    });
  }

  @override
  Future<bool> startLocationService() async {
    final result = await methodChannel.invokeMethod<bool>('startLocationService');
    return result ?? false;
  }

  @override
  Future<bool> stopLocationService() async {
    final result = await methodChannel.invokeMethod<bool>('stopLocationService');
    return result ?? false;
  }
}
