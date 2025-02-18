import 'package:plugin_platform_interface/plugin_platform_interface.dart';
import 'package:track_you_core_platform_interface/src/method_channel_track_you_core.dart';

/// The interface that implementations of track_you_core must implement.
///
/// Platform implementations should extend this class
/// rather than implement it as `TrackYouCore`.
/// Extending this class (using `extends`) ensures that the subclass will get
/// the default implementation, while platform implementations that `implements`
///  this interface will be broken by newly added [TrackYouCorePlatform] methods.
abstract class TrackYouCorePlatform extends PlatformInterface {
  /// Constructs a TrackYouCorePlatform.
  TrackYouCorePlatform() : super(token: _token);

  static final Object _token = Object();

  static TrackYouCorePlatform _instance = MethodChannelTrackYouCore();

  /// The default instance of [TrackYouCorePlatform] to use.
  ///
  /// Defaults to [MethodChannelTrackYouCore].
  static TrackYouCorePlatform get instance => _instance;

  /// Platform-specific plugins should set this with their own platform-specific
  /// class that extends [TrackYouCorePlatform] when they register themselves.
  static set instance(TrackYouCorePlatform instance) {
    PlatformInterface.verify(instance, _token);
    _instance = instance;
  }

  /// Return the current platform name.
  Future<String?> getPlatformName();
}
