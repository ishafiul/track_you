import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

TrackYouCorePlatform get _platform => TrackYouCorePlatform.instance;


/// Start location service and return a stream of location updates.
/// 
/// The location data contains:
/// - latitude: double
/// - longitude: double
/// - altitude: double (if available)
/// - speed: double (if available)
/// - accuracy: double (if available)
/// - bearing: double (if available)
/// - timestamp: int (milliseconds since epoch)
Stream<Map<String, dynamic>> getLocationUpdates() {
  return _platform.getLocationUpdates();
}

/// Start the background location service.
/// 
/// Returns true if the service was started successfully.
Future<bool> startLocationService() {
  return _platform.startLocationService();
}

/// Stop the background location service.
/// 
/// Returns true if the service was stopped successfully.
Future<bool> stopLocationService() {
  return _platform.stopLocationService();
}