import 'package:envied/envied.dart';

part 'env.g.dart';

@Envied()
class Env {
  @EnviedField(varName: 'PORT')
  static const int port = _Env.port;

  @EnviedField(varName: 'JWT_SECRET')
  static const String jwtSecret = _Env.jwtSecret;

  @EnviedField(varName: 'TURSO_DATABASE_URL')
  static const String dbUrl = _Env.dbUrl;

  @EnviedField(varName: 'TURSO_AUTH_TOKEN')
  static const String dbToken = _Env.dbToken;
}
