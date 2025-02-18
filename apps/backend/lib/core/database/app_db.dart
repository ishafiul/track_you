import 'package:drift/drift.dart';
import 'package:drift_hrana/drift_hrana.dart';
import 'package:injectable/injectable.dart';
import 'package:trace_backend/core/database/app_db.drift.dart';
import 'package:trace_backend/core/database/table/user_table.dart';

const url = 'libsql://trace-ishafiul.turso.io';
const token =
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzU2MzMwNjUsImlkIjoiNWIwN2Q0ZmQtYmVhOS00NTFjLThjZDktOTU3OGMzYjNjMGYyIn0.leCC8-czBVLiAxHLfj5T3jAi1NbkXSeAuI1dcimm8WmFNfVGBfffX2ohR37yzYFP8-VkE9jIUadt9PMyBqyFDw';

@singleton
@DriftDatabase(tables: [
  Users,
])
class AppDatabase extends $AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 7;

  static QueryExecutor _openConnection() {
    return LazyDatabase(() async {
      return HranaDatabase(
        Uri.parse(url),
        jwtToken: token,
      );
    });
  }
}
