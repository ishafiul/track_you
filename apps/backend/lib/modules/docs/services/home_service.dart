import 'package:drift/drift.dart';
import 'package:injectable/injectable.dart';
import 'package:trace_backend/core/database/app_db.dart';
import 'package:trace_backend/core/database/table/user_table.drift.dart';

@singleton
class AuthService {
  const AuthService(
    this._db,
  );

  final AppDatabase _db;

  Future<dynamic> signup(String email, String password) async {
    try {
      final insertedUser = await _db.users.insertOnConflictUpdate(
        UsersCompanion.insert(
          email: "email@gmail.com",
          password: "password13@A",
        ),
      );
      return insertedUser;
    } catch (e) {
      print(e);
    }
  }
}
