import 'package:freezed_annotation/freezed_annotation.dart';

part 'promotion_validation.freezed.dart';
part 'promotion_validation.g.dart';

double _parsePrice(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@freezed
abstract class PromotionValidation with _$PromotionValidation {
  const factory PromotionValidation({
    required String code,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double discountAmount,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double finalAmount,
    String? promoType,
    String? message,
  }) = _PromotionValidation;

  factory PromotionValidation.fromJson(Map<String, dynamic> json) =>
      _$PromotionValidationFromJson(_preprocess(json));

  static Map<String, dynamic> _preprocess(Map<String, dynamic> json) {
    final Map<String, dynamic> processedJson = Map<String, dynamic>.from(json);
    
    // Support backend returning finalSubtotal instead of finalAmount
    if (processedJson['finalSubtotal'] != null && processedJson['finalAmount'] == null) {
      processedJson['finalAmount'] = processedJson['finalSubtotal'];
    }
    
    // Support backend returning discountType instead of promoType
    if (processedJson['discountType'] != null && processedJson['promoType'] == null) {
      processedJson['promoType'] = processedJson['discountType'];
    }

    return processedJson;
  }
}
