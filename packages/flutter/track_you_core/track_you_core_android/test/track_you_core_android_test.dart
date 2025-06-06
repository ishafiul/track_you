import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:track_you_core_android/track_you_core_android.dart';
import 'package:track_you_core_platform_interface/track_you_core_platform_interface.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TrackYouCoreAndroid', () {
    const kPlatformName = 'Android';
    late TrackYouCoreAndroid trackYouCore;
    late List<MethodCall> log;

    setUp(() async {
      trackYouCore = TrackYouCoreAndroid();

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
      TrackYouCoreAndroid.registerWith();
      expect(TrackYouCorePlatform.instance, isA<TrackYouCoreAndroid>());
    });

  });
}
