// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'greet.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

GreetRequest _$GreetRequestFromJson(Map<String, dynamic> json) {
  return _GreetRequest.fromJson(json);
}

/// @nodoc
mixin _$GreetRequest {
  @HasMin(1)
  String get name => throw _privateConstructorUsedError;

  /// Serializes this GreetRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of GreetRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $GreetRequestCopyWith<GreetRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GreetRequestCopyWith<$Res> {
  factory $GreetRequestCopyWith(
          GreetRequest value, $Res Function(GreetRequest) then) =
      _$GreetRequestCopyWithImpl<$Res, GreetRequest>;
  @useResult
  $Res call({@HasMin(1) String name});
}

/// @nodoc
class _$GreetRequestCopyWithImpl<$Res, $Val extends GreetRequest>
    implements $GreetRequestCopyWith<$Res> {
  _$GreetRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of GreetRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GreetRequestImplCopyWith<$Res>
    implements $GreetRequestCopyWith<$Res> {
  factory _$$GreetRequestImplCopyWith(
          _$GreetRequestImpl value, $Res Function(_$GreetRequestImpl) then) =
      __$$GreetRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({@HasMin(1) String name});
}

/// @nodoc
class __$$GreetRequestImplCopyWithImpl<$Res>
    extends _$GreetRequestCopyWithImpl<$Res, _$GreetRequestImpl>
    implements _$$GreetRequestImplCopyWith<$Res> {
  __$$GreetRequestImplCopyWithImpl(
      _$GreetRequestImpl _value, $Res Function(_$GreetRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of GreetRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
  }) {
    return _then(_$GreetRequestImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GreetRequestImpl implements _GreetRequest {
  const _$GreetRequestImpl({@HasMin(1) required this.name});

  factory _$GreetRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$GreetRequestImplFromJson(json);

  @override
  @HasMin(1)
  final String name;

  @override
  String toString() {
    return 'GreetRequest(name: $name)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GreetRequestImpl &&
            (identical(other.name, name) || other.name == name));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name);

  /// Create a copy of GreetRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$GreetRequestImplCopyWith<_$GreetRequestImpl> get copyWith =>
      __$$GreetRequestImplCopyWithImpl<_$GreetRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GreetRequestImplToJson(
      this,
    );
  }
}

abstract class _GreetRequest implements GreetRequest {
  const factory _GreetRequest({@HasMin(1) required final String name}) =
      _$GreetRequestImpl;

  factory _GreetRequest.fromJson(Map<String, dynamic> json) =
      _$GreetRequestImpl.fromJson;

  @override
  @HasMin(1)
  String get name;

  /// Create a copy of GreetRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$GreetRequestImplCopyWith<_$GreetRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

GreetResponse _$GreetResponseFromJson(Map<String, dynamic> json) {
  return _GreetResponse.fromJson(json);
}

/// @nodoc
mixin _$GreetResponse {
  String get message => throw _privateConstructorUsedError;

  /// Serializes this GreetResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of GreetResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $GreetResponseCopyWith<GreetResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GreetResponseCopyWith<$Res> {
  factory $GreetResponseCopyWith(
          GreetResponse value, $Res Function(GreetResponse) then) =
      _$GreetResponseCopyWithImpl<$Res, GreetResponse>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class _$GreetResponseCopyWithImpl<$Res, $Val extends GreetResponse>
    implements $GreetResponseCopyWith<$Res> {
  _$GreetResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of GreetResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_value.copyWith(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GreetResponseImplCopyWith<$Res>
    implements $GreetResponseCopyWith<$Res> {
  factory _$$GreetResponseImplCopyWith(
          _$GreetResponseImpl value, $Res Function(_$GreetResponseImpl) then) =
      __$$GreetResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$GreetResponseImplCopyWithImpl<$Res>
    extends _$GreetResponseCopyWithImpl<$Res, _$GreetResponseImpl>
    implements _$$GreetResponseImplCopyWith<$Res> {
  __$$GreetResponseImplCopyWithImpl(
      _$GreetResponseImpl _value, $Res Function(_$GreetResponseImpl) _then)
      : super(_value, _then);

  /// Create a copy of GreetResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$GreetResponseImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GreetResponseImpl implements _GreetResponse {
  const _$GreetResponseImpl({required this.message});

  factory _$GreetResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$GreetResponseImplFromJson(json);

  @override
  final String message;

  @override
  String toString() {
    return 'GreetResponse(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GreetResponseImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, message);

  /// Create a copy of GreetResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$GreetResponseImplCopyWith<_$GreetResponseImpl> get copyWith =>
      __$$GreetResponseImplCopyWithImpl<_$GreetResponseImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GreetResponseImplToJson(
      this,
    );
  }
}

abstract class _GreetResponse implements GreetResponse {
  const factory _GreetResponse({required final String message}) =
      _$GreetResponseImpl;

  factory _GreetResponse.fromJson(Map<String, dynamic> json) =
      _$GreetResponseImpl.fromJson;

  @override
  String get message;

  /// Create a copy of GreetResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$GreetResponseImplCopyWith<_$GreetResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
