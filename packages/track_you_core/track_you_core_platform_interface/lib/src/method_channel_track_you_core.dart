import 'package:flutter/foundation.dart' show visibleForTesting;
import 'package:flutter/services.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

/// An implementation of [TrackYouCorePlatform] that uses method channels.
class MethodChannelTrackYouCore extends TrackYouCorePlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('track_you_core');

  @override
  Future<String?> getPlatformName() {
    return methodChannel.invokeMethod<String>('getPlatformName');
  }
}
