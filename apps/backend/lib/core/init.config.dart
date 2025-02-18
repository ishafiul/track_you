// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;
import 'package:trace_backend/core/database/app_db.dart' as _i1063;
import 'package:trace_backend/modules/docs/controllers/home_controller.dart' as _i397;
import 'package:trace_backend/modules/docs/services/home_service.dart' as _i885;
import 'package:trace_backend/modules/home/controllers/home_controller.dart' as _i85;
import 'package:trace_backend/modules/home/services/home_service.dart' as _i439;

extension GetItInjectableX on _i174.GetIt {
// initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(
      this,
      environment,
      environmentFilter,
    );
    gh.singleton<_i1063.AppDatabase>(() => _i1063.AppDatabase());
    gh.singleton<_i439.HomeService>(() => _i439.HomeService());
    gh.singleton<_i85.HomeController>(
        () => _i85.HomeController(gh<_i439.HomeService>()));
    gh.singleton<_i885.AuthService>(
        () => _i885.AuthService(gh<_i1063.AppDatabase>()));
    gh.singleton<_i397.DocController>(
        () => _i397.DocController(gh<_i885.AuthService>()));
    return this;
  }
}
