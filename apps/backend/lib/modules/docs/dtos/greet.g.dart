// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'greet.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$GreetRequestImpl _$$GreetRequestImplFromJson(Map<String, dynamic> json) =>
    _$GreetRequestImpl(
      name: json['name'] as String,
    );

Map<String, dynamic> _$$GreetRequestImplToJson(_$GreetRequestImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
    };

_$GreetResponseImpl _$$GreetResponseImplFromJson(Map<String, dynamic> json) =>
    _$GreetResponseImpl(
      message: json['message'] as String,
    );

Map<String, dynamic> _$$GreetResponseImplToJson(_$GreetResponseImpl instance) =>
    <String, dynamic>{
      'message': instance.message,
    };

// **************************************************************************
// LuthorGenerator
// **************************************************************************

Validator $GreetRequestSchema = l.withName('GreetRequest').schema({
  'name': l.string().min(1).required(),
});

SchemaValidationResult<GreetRequest> $GreetRequestValidate(
        Map<String, dynamic> json) =>
    $GreetRequestSchema.validateSchema(json, fromJson: GreetRequest.fromJson);

extension GreetRequestValidationExtension on GreetRequest {
  SchemaValidationResult<GreetRequest> validateSelf() =>
      $GreetRequestValidate(toJson());
}
