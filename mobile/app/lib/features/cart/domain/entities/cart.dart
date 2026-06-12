import 'package:freezed_annotation/freezed_annotation.dart';

part 'cart.freezed.dart';
part 'cart.g.dart';

double _parsePrice(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@freezed
abstract class CartProduct with _$CartProduct {
  const factory CartProduct({
    required String name,
    String? imageUrl,
    @Default(true) bool isAvailable,
  }) = _CartProduct;

  factory CartProduct.fromJson(Map<String, dynamic> json) =>
      _$CartProductFromJson(json);
}

@freezed
abstract class CartVariant with _$CartVariant {
  const factory CartVariant({
    required String name,
    @Default(true) bool isAvailable,
  }) = _CartVariant;

  factory CartVariant.fromJson(Map<String, dynamic> json) =>
      _$CartVariantFromJson(json);
}

@freezed
abstract class CartItem with _$CartItem {
  const factory CartItem({
    required String id,
    required String cartId,
    required String productId,
    String? variantId,
    required int quantity,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double unitPrice,
    String? specialInstructions,
    required DateTime addedAt,
    CartProduct? product,
    CartVariant? variant,
  }) = _CartItem;

  factory CartItem.fromJson(Map<String, dynamic> json) =>
      _$CartItemFromJson(json);
}

@freezed
abstract class Cart with _$Cart {
  const factory Cart({
    required String id,
    required String userId,
    @Default([]) List<CartItem> cartItems,
  }) = _Cart;

  factory Cart.fromJson(Map<String, dynamic> json) => _$CartFromJson(json);
}
