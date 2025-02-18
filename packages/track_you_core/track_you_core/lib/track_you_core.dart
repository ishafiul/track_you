import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

TrackYouCorePlatform get _platform => TrackYouCorePlatform.instance;

/// Returns the name of the current platform.
Future<String> getPlatformName() async {
  final platformName = await _platform.getPlatformName();
  if (platformName == null) throw Exception('Unable to get platform name.');
  return platformName;
}
