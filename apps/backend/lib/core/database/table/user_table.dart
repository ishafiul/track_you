import 'package:drift/drift.dart';

class Users extends Table {
  IntColumn get id => integer().autoIncrement()();

  TextColumn get email => text().unique()();

  TextColumn get password => text()();
}

class TaskTable extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text()();
  TextColumn get description => text()();
  BoolColumn get completed => boolean()();
}
