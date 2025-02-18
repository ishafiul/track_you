import 'package:arcade_swagger/arcade_swagger.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';
import 'package:trace_backend/core/database/app_db.dart';
import 'package:trace_backend/core/init.config.dart';

final getIt = GetIt.instance;

@injectableInit
Future<void> init() async {
  await getIt.reset();
  getIt.init();
  AppDatabase().users.createAlias('users');
  setupSwagger(
    autoGlobalComponents: false,
    title: 'Todo API',
    description: 'Todo API',
    version: '1.0.0',
    securitySchemes: const {
      'JWT': SecurityScheme.apiKey(
        name: 'Authorization',
        location: ApiKeyLocation.header,
      ),
    },
    servers: const [
      Server(
        url: 'http://localhost:8080',
        description: 'Localhost',
      ),
    ],
  );
}
