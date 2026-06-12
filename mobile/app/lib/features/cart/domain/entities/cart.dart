import 'package:freezed_annotation/freezed_annotation.dart';

part 'cart.freezed.dart';
part 'cart.g.dart';

double _parsePrice(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@freezed
abstract class CartItem with _$CartItem {
  const factory CartItem({
    required String id,
    required String productId,
    String? variantId,
    @JsonKey(name: 'name') required String productName,
    String? variantName,
    String? imageUrl,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double unitPrice,
    required int quantity,
    @JsonKey(name: 'lineSubtotal', fromJson: _parsePrice)
    @Default(0.0)
    double lineTotal,
    String? specialInstructions,
    @Default(true) bool isAvailable,
  }) = _CartItem;

  factory CartItem.fromJson(Map<String, dynamic> json) =>
      _$CartItemFromJson(_preprocess(json));

  static Map<String, dynamic> _preprocess(Map<String, dynamic> json) {
    final Map<String, dynamic> processedJson = Map<String, dynamic>.from(json);
    
    // Support nested product shape
    if (processedJson['product'] != null && processedJson['product'] is Map) {
      processedJson['name'] ??= processedJson['product']['name'];
      processedJson['imageUrl'] ??= processedJson['product']['imageUrl'];
    }
    
    // Support nested variant shape
    if (processedJson['variant'] != null && processedJson['variant'] is Map) {
      processedJson['variantName'] ??= processedJson['variant']['name'];
    }

    return processedJson;
  }
}

@freezed
abstract class Cart with _$Cart {
  const factory Cart({
    String? id,
    @Default([]) List<CartItem> items,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double subtotal,
    @Default(0) int itemCount,
  }) = _Cart;

  factory Cart.fromJson(Map<String, dynamic> json) => _$CartFromJson(json);
}
