import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:track_you_core_platform_interface/src/method_channel_track_you_core.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const kPlatformName = 'platformName';

  group('$MethodChannelTrackYouCore', () {
    late MethodChannelTrackYouCore methodChannelTrackYouCore;
    final log = <MethodCall>[];

    setUp(() async {
      methodChannelTrackYouCore = MethodChannelTrackYouCore();
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
        methodChannelTrackYouCore.methodChannel,
        (methodCall) async {
          log.add(methodCall);
          switch (methodCall.method) {
            case 'getPlatformName':
              return kPlatformName;
            default:
              return null;
          }
        },
      );
    });

    tearDown(log.clear);

    test('getPlatformName', () async {
      final platformName = await methodChannelTrackYouCore.getPlatformName();
      expect(
        log,
        <Matcher>[isMethodCall('getPlatformName', arguments: null)],
      );
      expect(platformName, equals(kPlatformName));
    });
  });
}
