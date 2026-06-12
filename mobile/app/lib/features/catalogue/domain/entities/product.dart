import 'package:freezed_annotation/freezed_annotation.dart';
import 'category.dart';
import 'product_variant.dart';

part 'product.freezed.dart';
part 'product.g.dart';

double _parsePrice(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@freezed
abstract class Tag with _$Tag {
  const factory Tag({
    required String id,
    required String name,
    required String tagType,
    String? colorHex,
  }) = _Tag;

  factory Tag.fromJson(Map<String, dynamic> json) => _$TagFromJson(json);
}

@freezed
abstract class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    String? description,
    String? imageUrl,
    @JsonKey(fromJson: _parsePrice) @Default(0.0) double basePrice,
    @Default(true) bool isAvailable,
    @Default(false) bool isFeatured,
    Category? category,
    @Default([]) List<ProductVariant> variants,
    @Default([]) List<Tag> tags,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}
