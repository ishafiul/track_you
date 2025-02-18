import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:plugin_platform_interface/plugin_platform_interface.dart';
import 'package:track_you_core/track_you_core.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

class MockTrackYouCorePlatform extends Mock
    with MockPlatformInterfaceMixin
    implements TrackYouCorePlatform {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TrackYouCore', () {
    late TrackYouCorePlatform trackYouCorePlatform;

    setUp(() {
      trackYouCorePlatform = MockTrackYouCorePlatform();
      TrackYouCorePlatform.instance = trackYouCorePlatform;
    });

    group('getPlatformName', () {
      test('returns correct name when platform implementation exists',
          () async {
        const platformName = '__test_platform__';
        when(
          () => trackYouCorePlatform.getPlatformName(),
        ).thenAnswer((_) async => platformName);

        final actualPlatformName = await getPlatformName();
        expect(actualPlatformName, equals(platformName));
      });

      test('throws exception when platform implementation is missing',
          () async {
        when(
          () => trackYouCorePlatform.getPlatformName(),
        ).thenAnswer((_) async => null);

        expect(getPlatformName, throwsException);
      });
    });
  });
}
