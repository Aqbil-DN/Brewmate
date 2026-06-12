import 'package:freezed_annotation/freezed_annotation.dart';

part 'order.freezed.dart';
part 'order.g.dart';

double _parsePrice(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@freezed
abstract class Order with _$Order {
  const factory Order({
    required String id,
    required String orderNumber,
    required String status,
    required String paymentStatus,
    required String paymentMethod,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double subtotalAmount,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double discountAmount,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double taxAmount,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double totalAmount,
    String? promoCode,
    String? paymentUrl,
    String? paymentReference,
    required DateTime placedAt,
  }) = _Order;

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}
