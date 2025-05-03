import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

/// The iOS implementation of [TrackYouCorePlatform].
class TrackYouCoreIOS extends TrackYouCorePlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('track_you_core_ios');
  @visibleForTesting
  final eventChannel = const EventChannel('track_you_core/location_updates');
  /// Registers this class as the default instance of [TrackYouCorePlatform]
  static void registerWith() {
    TrackYouCorePlatform.instance = TrackYouCoreIOS();
  }

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
