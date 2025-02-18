// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:trace_backend/core/database/table/user_table.drift.dart' as i1;

abstract class $AppDatabase extends i0.GeneratedDatabase {
  $AppDatabase(i0.QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final i1.$UsersTable users = i1.$UsersTable(this);
  @override
  Iterable<i0.TableInfo<i0.Table, Object?>> get allTables =>
      allSchemaEntities.whereType<i0.TableInfo<i0.Table, Object?>>();
  @override
  List<i0.DatabaseSchemaEntity> get allSchemaEntities => [users];
  @override
  i0.DriftDatabaseOptions get options =>
      const i0.DriftDatabaseOptions(storeDateTimeAsText: true);
}

class $AppDatabaseManager {
  final $AppDatabase _db;
  $AppDatabaseManager(this._db);
  i1.$$UsersTableTableManager get users =>
      i1.$$UsersTableTableManager(_db, _db.users);
}
