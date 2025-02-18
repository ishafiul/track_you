import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:track_you_core_ios/track_you_core_ios.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TrackYouCoreIOS', () {
    const kPlatformName = 'iOS';
    late TrackYouCoreIOS trackYouCore;
    late List<MethodCall> log;

    setUp(() async {
      trackYouCore = TrackYouCoreIOS();

      log = <MethodCall>[];
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(trackYouCore.methodChannel, (methodCall) async {
        log.add(methodCall);
        switch (methodCall.method) {
          case 'getPlatformName':
            return kPlatformName;
          default:
            return null;
        }
      });
    });

    test('can be registered', () {
      TrackYouCoreIOS.registerWith();
      expect(TrackYouCorePlatform.instance, isA<TrackYouCoreIOS>());
    });

    test('getPlatformName returns correct name', () async {
      final name = await trackYouCore.getPlatformName();
      expect(
        log,
        <Matcher>[isMethodCall('getPlatformName', arguments: null)],
      );
      expect(name, equals(kPlatformName));
    });
  });
}
