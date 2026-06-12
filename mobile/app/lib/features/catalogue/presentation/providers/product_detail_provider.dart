import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/product.dart';
import 'catalogue_providers.dart';

part 'product_detail_provider.g.dart';

@riverpod
Future<Product> productDetail(Ref ref, String id) {
  final repository = ref.watch(catalogueRepositoryProvider);
  return repository.getProductDetail(id);
}
