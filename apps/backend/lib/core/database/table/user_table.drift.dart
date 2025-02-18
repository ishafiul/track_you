// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;
import 'package:trace_backend/core/database/table/user_table.drift.dart' as i1;
import 'package:trace_backend/core/database/table/user_table.dart' as i2;

typedef $$UsersTableCreateCompanionBuilder = i1.UsersCompanion Function({
  i0.Value<int> id,
  required String email,
  required String password,
});
typedef $$UsersTableUpdateCompanionBuilder = i1.UsersCompanion Function({
  i0.Value<int> id,
  i0.Value<String> email,
  i0.Value<String> password,
});

class $$UsersTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UsersTable> {
  $$UsersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get password => $composableBuilder(
      column: $table.password, builder: (column) => i0.ColumnFilters(column));
}

class $$UsersTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UsersTable> {
  $$UsersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get email => $composableBuilder(
      column: $table.email, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get password => $composableBuilder(
      column: $table.password, builder: (column) => i0.ColumnOrderings(column));
}

class $$UsersTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$UsersTable> {
  $$UsersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  i0.GeneratedColumn<String> get password =>
      $composableBuilder(column: $table.password, builder: (column) => column);
}

class $$UsersTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$UsersTable,
    i1.User,
    i1.$$UsersTableFilterComposer,
    i1.$$UsersTableOrderingComposer,
    i1.$$UsersTableAnnotationComposer,
    $$UsersTableCreateCompanionBuilder,
    $$UsersTableUpdateCompanionBuilder,
    (i1.User, i0.BaseReferences<i0.GeneratedDatabase, i1.$UsersTable, i1.User>),
    i1.User,
    i0.PrefetchHooks Function()> {
  $$UsersTableTableManager(i0.GeneratedDatabase db, i1.$UsersTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$UsersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$UsersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$UsersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            i0.Value<String> email = const i0.Value.absent(),
            i0.Value<String> password = const i0.Value.absent(),
          }) =>
              i1.UsersCompanion(
            id: id,
            email: email,
            password: password,
          ),
          createCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            required String email,
            required String password,
          }) =>
              i1.UsersCompanion.insert(
            id: id,
            email: email,
            password: password,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$UsersTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$UsersTable,
    i1.User,
    i1.$$UsersTableFilterComposer,
    i1.$$UsersTableOrderingComposer,
    i1.$$UsersTableAnnotationComposer,
    $$UsersTableCreateCompanionBuilder,
    $$UsersTableUpdateCompanionBuilder,
    (i1.User, i0.BaseReferences<i0.GeneratedDatabase, i1.$UsersTable, i1.User>),
    i1.User,
    i0.PrefetchHooks Function()>;
typedef $$TaskTableTableCreateCompanionBuilder = i1.TaskTableCompanion
    Function({
  i0.Value<int> id,
  required String title,
  required String description,
  required bool completed,
});
typedef $$TaskTableTableUpdateCompanionBuilder = i1.TaskTableCompanion
    Function({
  i0.Value<int> id,
  i0.Value<String> title,
  i0.Value<String> description,
  i0.Value<bool> completed,
});

class $$TaskTableTableFilterComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TaskTableTable> {
  $$TaskTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnFilters(column));

  i0.ColumnFilters<bool> get completed => $composableBuilder(
      column: $table.completed, builder: (column) => i0.ColumnFilters(column));
}

class $$TaskTableTableOrderingComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TaskTableTable> {
  $$TaskTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get title => $composableBuilder(
      column: $table.title, builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<String> get description => $composableBuilder(
      column: $table.description,
      builder: (column) => i0.ColumnOrderings(column));

  i0.ColumnOrderings<bool> get completed => $composableBuilder(
      column: $table.completed,
      builder: (column) => i0.ColumnOrderings(column));
}

class $$TaskTableTableAnnotationComposer
    extends i0.Composer<i0.GeneratedDatabase, i1.$TaskTableTable> {
  $$TaskTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  i0.GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  i0.GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  i0.GeneratedColumn<String> get description => $composableBuilder(
      column: $table.description, builder: (column) => column);

  i0.GeneratedColumn<bool> get completed =>
      $composableBuilder(column: $table.completed, builder: (column) => column);
}

class $$TaskTableTableTableManager extends i0.RootTableManager<
    i0.GeneratedDatabase,
    i1.$TaskTableTable,
    i1.TaskTableData,
    i1.$$TaskTableTableFilterComposer,
    i1.$$TaskTableTableOrderingComposer,
    i1.$$TaskTableTableAnnotationComposer,
    $$TaskTableTableCreateCompanionBuilder,
    $$TaskTableTableUpdateCompanionBuilder,
    (
      i1.TaskTableData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$TaskTableTable,
          i1.TaskTableData>
    ),
    i1.TaskTableData,
    i0.PrefetchHooks Function()> {
  $$TaskTableTableTableManager(
      i0.GeneratedDatabase db, i1.$TaskTableTable table)
      : super(i0.TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              i1.$$TaskTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              i1.$$TaskTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              i1.$$TaskTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            i0.Value<String> title = const i0.Value.absent(),
            i0.Value<String> description = const i0.Value.absent(),
            i0.Value<bool> completed = const i0.Value.absent(),
          }) =>
              i1.TaskTableCompanion(
            id: id,
            title: title,
            description: description,
            completed: completed,
          ),
          createCompanionCallback: ({
            i0.Value<int> id = const i0.Value.absent(),
            required String title,
            required String description,
            required bool completed,
          }) =>
              i1.TaskTableCompanion.insert(
            id: id,
            title: title,
            description: description,
            completed: completed,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), i0.BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$TaskTableTableProcessedTableManager = i0.ProcessedTableManager<
    i0.GeneratedDatabase,
    i1.$TaskTableTable,
    i1.TaskTableData,
    i1.$$TaskTableTableFilterComposer,
    i1.$$TaskTableTableOrderingComposer,
    i1.$$TaskTableTableAnnotationComposer,
    $$TaskTableTableCreateCompanionBuilder,
    $$TaskTableTableUpdateCompanionBuilder,
    (
      i1.TaskTableData,
      i0.BaseReferences<i0.GeneratedDatabase, i1.$TaskTableTable,
          i1.TaskTableData>
    ),
    i1.TaskTableData,
    i0.PrefetchHooks Function()>;

class $UsersTable extends i2.Users with i0.TableInfo<$UsersTable, i1.User> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UsersTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: i0.DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          i0.GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const i0.VerificationMeta _emailMeta =
      const i0.VerificationMeta('email');
  @override
  late final i0.GeneratedColumn<String> email = i0.GeneratedColumn<String>(
      'email', aliasedName, false,
      type: i0.DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const i0.VerificationMeta _passwordMeta =
      const i0.VerificationMeta('password');
  @override
  late final i0.GeneratedColumn<String> password = i0.GeneratedColumn<String>(
      'password', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  @override
  List<i0.GeneratedColumn> get $columns => [id, email, password];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'users';
  @override
  i0.VerificationContext validateIntegrity(i0.Insertable<i1.User> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('password')) {
      context.handle(_passwordMeta,
          password.isAcceptableOrUnknown(data['password']!, _passwordMeta));
    } else if (isInserting) {
      context.missing(_passwordMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.User map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.User(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}id'])!,
      email: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}email'])!,
      password: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}password'])!,
    );
  }

  @override
  $UsersTable createAlias(String alias) {
    return $UsersTable(attachedDatabase, alias);
  }
}

class User extends i0.DataClass implements i0.Insertable<i1.User> {
  final int id;
  final String email;
  final String password;
  const User({required this.id, required this.email, required this.password});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<int>(id);
    map['email'] = i0.Variable<String>(email);
    map['password'] = i0.Variable<String>(password);
    return map;
  }

  i1.UsersCompanion toCompanion(bool nullToAbsent) {
    return i1.UsersCompanion(
      id: i0.Value(id),
      email: i0.Value(email),
      password: i0.Value(password),
    );
  }

  factory User.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return User(
      id: serializer.fromJson<int>(json['id']),
      email: serializer.fromJson<String>(json['email']),
      password: serializer.fromJson<String>(json['password']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'email': serializer.toJson<String>(email),
      'password': serializer.toJson<String>(password),
    };
  }

  i1.User copyWith({int? id, String? email, String? password}) => i1.User(
        id: id ?? this.id,
        email: email ?? this.email,
        password: password ?? this.password,
      );
  User copyWithCompanion(i1.UsersCompanion data) {
    return User(
      id: data.id.present ? data.id.value : this.id,
      email: data.email.present ? data.email.value : this.email,
      password: data.password.present ? data.password.value : this.password,
    );
  }

  @override
  String toString() {
    return (StringBuffer('User(')
          ..write('id: $id, ')
          ..write('email: $email, ')
          ..write('password: $password')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, email, password);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.User &&
          other.id == this.id &&
          other.email == this.email &&
          other.password == this.password);
}

class UsersCompanion extends i0.UpdateCompanion<i1.User> {
  final i0.Value<int> id;
  final i0.Value<String> email;
  final i0.Value<String> password;
  const UsersCompanion({
    this.id = const i0.Value.absent(),
    this.email = const i0.Value.absent(),
    this.password = const i0.Value.absent(),
  });
  UsersCompanion.insert({
    this.id = const i0.Value.absent(),
    required String email,
    required String password,
  })  : email = i0.Value(email),
        password = i0.Value(password);
  static i0.Insertable<i1.User> custom({
    i0.Expression<int>? id,
    i0.Expression<String>? email,
    i0.Expression<String>? password,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (email != null) 'email': email,
      if (password != null) 'password': password,
    });
  }

  i1.UsersCompanion copyWith(
      {i0.Value<int>? id,
      i0.Value<String>? email,
      i0.Value<String>? password}) {
    return i1.UsersCompanion(
      id: id ?? this.id,
      email: email ?? this.email,
      password: password ?? this.password,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<int>(id.value);
    }
    if (email.present) {
      map['email'] = i0.Variable<String>(email.value);
    }
    if (password.present) {
      map['password'] = i0.Variable<String>(password.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UsersCompanion(')
          ..write('id: $id, ')
          ..write('email: $email, ')
          ..write('password: $password')
          ..write(')'))
        .toString();
  }
}

class $TaskTableTable extends i2.TaskTable
    with i0.TableInfo<$TaskTableTable, i1.TaskTableData> {
  @override
  final i0.GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TaskTableTable(this.attachedDatabase, [this._alias]);
  static const i0.VerificationMeta _idMeta = const i0.VerificationMeta('id');
  @override
  late final i0.GeneratedColumn<int> id = i0.GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: i0.DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          i0.GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const i0.VerificationMeta _titleMeta =
      const i0.VerificationMeta('title');
  @override
  late final i0.GeneratedColumn<String> title = i0.GeneratedColumn<String>(
      'title', aliasedName, false,
      type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _descriptionMeta =
      const i0.VerificationMeta('description');
  @override
  late final i0.GeneratedColumn<String> description =
      i0.GeneratedColumn<String>('description', aliasedName, false,
          type: i0.DriftSqlType.string, requiredDuringInsert: true);
  static const i0.VerificationMeta _completedMeta =
      const i0.VerificationMeta('completed');
  @override
  late final i0.GeneratedColumn<bool> completed = i0.GeneratedColumn<bool>(
      'completed', aliasedName, false,
      type: i0.DriftSqlType.bool,
      requiredDuringInsert: true,
      defaultConstraints: i0.GeneratedColumn.constraintIsAlways(
          'CHECK ("completed" IN (0, 1))'));
  @override
  List<i0.GeneratedColumn> get $columns => [id, title, description, completed];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'task_table';
  @override
  i0.VerificationContext validateIntegrity(
      i0.Insertable<i1.TaskTableData> instance,
      {bool isInserting = false}) {
    final context = i0.VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    } else if (isInserting) {
      context.missing(_descriptionMeta);
    }
    if (data.containsKey('completed')) {
      context.handle(_completedMeta,
          completed.isAcceptableOrUnknown(data['completed']!, _completedMeta));
    } else if (isInserting) {
      context.missing(_completedMeta);
    }
    return context;
  }

  @override
  Set<i0.GeneratedColumn> get $primaryKey => {id};
  @override
  i1.TaskTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return i1.TaskTableData(
      id: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.int, data['${effectivePrefix}id'])!,
      title: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}title'])!,
      description: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.string, data['${effectivePrefix}description'])!,
      completed: attachedDatabase.typeMapping
          .read(i0.DriftSqlType.bool, data['${effectivePrefix}completed'])!,
    );
  }

  @override
  $TaskTableTable createAlias(String alias) {
    return $TaskTableTable(attachedDatabase, alias);
  }
}

class TaskTableData extends i0.DataClass
    implements i0.Insertable<i1.TaskTableData> {
  final int id;
  final String title;
  final String description;
  final bool completed;
  const TaskTableData(
      {required this.id,
      required this.title,
      required this.description,
      required this.completed});
  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    map['id'] = i0.Variable<int>(id);
    map['title'] = i0.Variable<String>(title);
    map['description'] = i0.Variable<String>(description);
    map['completed'] = i0.Variable<bool>(completed);
    return map;
  }

  i1.TaskTableCompanion toCompanion(bool nullToAbsent) {
    return i1.TaskTableCompanion(
      id: i0.Value(id),
      title: i0.Value(title),
      description: i0.Value(description),
      completed: i0.Value(completed),
    );
  }

  factory TaskTableData.fromJson(Map<String, dynamic> json,
      {i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return TaskTableData(
      id: serializer.fromJson<int>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String>(json['description']),
      completed: serializer.fromJson<bool>(json['completed']),
    );
  }
  @override
  Map<String, dynamic> toJson({i0.ValueSerializer? serializer}) {
    serializer ??= i0.driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String>(description),
      'completed': serializer.toJson<bool>(completed),
    };
  }

  i1.TaskTableData copyWith(
          {int? id, String? title, String? description, bool? completed}) =>
      i1.TaskTableData(
        id: id ?? this.id,
        title: title ?? this.title,
        description: description ?? this.description,
        completed: completed ?? this.completed,
      );
  TaskTableData copyWithCompanion(i1.TaskTableCompanion data) {
    return TaskTableData(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      description:
          data.description.present ? data.description.value : this.description,
      completed: data.completed.present ? data.completed.value : this.completed,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TaskTableData(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('completed: $completed')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, title, description, completed);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is i1.TaskTableData &&
          other.id == this.id &&
          other.title == this.title &&
          other.description == this.description &&
          other.completed == this.completed);
}

class TaskTableCompanion extends i0.UpdateCompanion<i1.TaskTableData> {
  final i0.Value<int> id;
  final i0.Value<String> title;
  final i0.Value<String> description;
  final i0.Value<bool> completed;
  const TaskTableCompanion({
    this.id = const i0.Value.absent(),
    this.title = const i0.Value.absent(),
    this.description = const i0.Value.absent(),
    this.completed = const i0.Value.absent(),
  });
  TaskTableCompanion.insert({
    this.id = const i0.Value.absent(),
    required String title,
    required String description,
    required bool completed,
  })  : title = i0.Value(title),
        description = i0.Value(description),
        completed = i0.Value(completed);
  static i0.Insertable<i1.TaskTableData> custom({
    i0.Expression<int>? id,
    i0.Expression<String>? title,
    i0.Expression<String>? description,
    i0.Expression<bool>? completed,
  }) {
    return i0.RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (completed != null) 'completed': completed,
    });
  }

  i1.TaskTableCompanion copyWith(
      {i0.Value<int>? id,
      i0.Value<String>? title,
      i0.Value<String>? description,
      i0.Value<bool>? completed}) {
    return i1.TaskTableCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      completed: completed ?? this.completed,
    );
  }

  @override
  Map<String, i0.Expression> toColumns(bool nullToAbsent) {
    final map = <String, i0.Expression>{};
    if (id.present) {
      map['id'] = i0.Variable<int>(id.value);
    }
    if (title.present) {
      map['title'] = i0.Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = i0.Variable<String>(description.value);
    }
    if (completed.present) {
      map['completed'] = i0.Variable<bool>(completed.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TaskTableCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('completed: $completed')
          ..write(')'))
        .toString();
  }
}
