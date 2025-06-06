import 'package:flutter_test/flutter_test.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

class TrackYouCoreMock extends TrackYouCorePlatform {
  static const mockPlatformName = 'Mock';

  @override
  Future<String?> getPlatformName() async => mockPlatformName;

  @override
  Stream<Map<String, dynamic>> getLocationUpdates() {
    // TODO: implement getLocationUpdates
    throw UnimplementedError();
  }

  @override
  Future<bool> startLocationService() {
    // TODO: implement startLocationService
    throw UnimplementedError();
  }

  @override
  Future<bool> stopLocationService() {
    // TODO: implement stopLocationService
    throw UnimplementedError();
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  group('TrackYouCorePlatformInterface', () {
    late TrackYouCorePlatform trackYouCorePlatform;

    setUp(() {
      trackYouCorePlatform = TrackYouCoreMock();
      TrackYouCorePlatform.instance = trackYouCorePlatform;
    });

  });
}
