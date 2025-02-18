import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

/// The iOS implementation of [TrackYouCorePlatform].
class TrackYouCoreIOS extends TrackYouCorePlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('track_you_core_ios');

  /// Registers this class as the default instance of [TrackYouCorePlatform]
  static void registerWith() {
    TrackYouCorePlatform.instance = TrackYouCoreIOS();
  }

  @override
  Future<String?> getPlatformName() {
    return methodChannel.invokeMethod<String>('getPlatformName');
  }
}
