import 'package:flutter_test/flutter_test.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

class TrackYouCoreMock extends TrackYouCorePlatform {
  static const mockPlatformName = 'Mock';

  @override
  Future<String?> getPlatformName() async => mockPlatformName;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  group('TrackYouCorePlatformInterface', () {
    late TrackYouCorePlatform trackYouCorePlatform;

    setUp(() {
      trackYouCorePlatform = TrackYouCoreMock();
      TrackYouCorePlatform.instance = trackYouCorePlatform;
    });

    group('getPlatformName', () {
      test('returns correct name', () async {
        expect(
          await TrackYouCorePlatform.instance.getPlatformName(),
          equals(TrackYouCoreMock.mockPlatformName),
        );
      });
    });
  });
}
