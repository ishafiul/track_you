import 'package:drift/drift.dart';
import 'package:drift_hrana/drift_hrana.dart';
import 'package:injectable/injectable.dart';
import 'package:trace_backend/core/database/app_db.drift.dart';
import 'package:trace_backend/core/database/table/user_table.dart';
import 'package:trace_backend/core/env.dart';


@singleton
@DriftDatabase(tables: [
  Users,
],)
class AppDatabase extends $AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 7;

  static QueryExecutor _openConnection() {
    return LazyDatabase(() async {
      return HranaDatabase(
        Uri.parse(Env.dbUrl),
        jwtToken: Env.dbToken,
      );
    });
  }
}
