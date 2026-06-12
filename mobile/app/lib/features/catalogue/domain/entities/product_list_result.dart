import 'package:freezed_annotation/freezed_annotation.dart';
import 'product.dart';

part 'product_list_result.freezed.dart';
part 'product_list_result.g.dart';

@freezed
abstract class PaginationMeta with _$PaginationMeta {
  const factory PaginationMeta({
    required int page,
    required int limit,
    required int total,
    required int totalPages,
  }) = _PaginationMeta;

  factory PaginationMeta.fromJson(Map<String, dynamic> json) =>
      _$PaginationMetaFromJson(json);
}

@freezed
abstract class ProductListResult with _$ProductListResult {
  const factory ProductListResult({
    @Default([]) List<Product> items,
    required PaginationMeta meta,
  }) = _ProductListResult;

  factory ProductListResult.fromJson(Map<String, dynamic> json) =>
      _$ProductListResultFromJson(json);
}
