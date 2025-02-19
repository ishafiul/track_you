// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;
import 'package:trace_backend/core/database/app_db.dart' as _i668;
import 'package:trace_backend/modules/docs/controllers/home_controller.dart'
    as _i294;
import 'package:trace_backend/modules/docs/services/home_service.dart'
    as _i1028;
import 'package:trace_backend/modules/home/controllers/home_controller.dart'
    as _i383;
import 'package:trace_backend/modules/home/services/home_service.dart' as _i845;

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
    gh.singleton<_i668.AppDatabase>(() => _i668.AppDatabase());
    gh.singleton<_i845.HomeService>(() => _i845.HomeService());
    gh.singleton<_i1028.AuthService>(
        () => _i1028.AuthService(gh<_i668.AppDatabase>()));
    gh.singleton<_i383.HomeController>(
        () => _i383.HomeController(gh<_i845.HomeService>()));
    gh.singleton<_i294.DocController>(
        () => _i294.DocController(gh<_i1028.AuthService>()));
    return this;
  }
}
