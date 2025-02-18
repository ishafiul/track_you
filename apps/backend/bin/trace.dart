import 'package:arcade/arcade.dart';
import 'package:trace_backend/core/env.dart';
import 'package:trace_backend/core/init.dart';

Future<void> main(List<String> arguments) async {
  return runServer(
    port: 8080,
    init: init,
    closeServerAfterRoutesSetUp: arguments.contains('--export-routes'),
  );
}
