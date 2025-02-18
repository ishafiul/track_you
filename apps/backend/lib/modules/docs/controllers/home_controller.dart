import 'package:arcade/arcade.dart';
import 'package:arcade_swagger/arcade_swagger.dart';
import 'package:injectable/injectable.dart';
import 'package:trace_backend/modules/docs/services/home_service.dart';

@singleton
class DocController {
  final AuthService _docService;

  DocController(this._docService) {
    route.group<RequestContext>(
      '/auth',
      defineRoutes: (route) {
        route()
            .swagger(
              summary: 'Signup',
              tags: ['Auth'],
            )
            .post('/signup')
            .handle(sayHello);
      },
    );
  }

  Future<dynamic> sayHello(RequestContext context) async {
    return _docService.signup("email", "password");
  }
}

class GreetResponse {
  final String message;
  final int statusCode;

  GreetResponse({required this.message, required this.statusCode});
}
