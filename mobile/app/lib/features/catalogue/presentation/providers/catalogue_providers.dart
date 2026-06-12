import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/api/dio_provider.dart';
import '../../data/datasources/catalogue_remote_datasource.dart';
import '../../data/repositories/catalogue_repository_impl.dart';
import '../../domain/entities/category.dart';
import '../../domain/entities/product_list_result.dart';
import '../../domain/repositories/catalogue_repository.dart';

part 'catalogue_providers.freezed.dart';
part 'catalogue_providers.g.dart';

@riverpod
CatalogueRemoteDataSource catalogueRemoteDataSource(Ref ref) {
  final dio = ref.watch(dioProvider);
  return CatalogueRemoteDataSource(dio);
}

@riverpod
CatalogueRepository catalogueRepository(Ref ref) {
  final remoteDataSource = ref.watch(catalogueRemoteDataSourceProvider);
  return CatalogueRepositoryImpl(remoteDataSource);
}

@riverpod
Future<List<Category>> categories(Ref ref) {
  final repository = ref.watch(catalogueRepositoryProvider);
  return repository.getCategories();
}

@freezed
abstract class ProductQueryState with _$ProductQueryState {
  const factory ProductQueryState({
    String? categorySlug,
    @Default('') String search,
    @Default('relevance') String sort,
    @Default(1) int page,
    @Default(20) int limit,
  }) = _ProductQueryState;
}

@riverpod
class CatalogueQuery extends _$CatalogueQuery {
  @override
  ProductQueryState build() {
    return const ProductQueryState();
  }

  void setCategory(String? slug) {
    state = state.copyWith(categorySlug: slug, page: 1);
  }

  void setSearch(String term) {
    state = state.copyWith(search: term, page: 1);
  }

  void setSort(String sort) {
    state = state.copyWith(sort: sort, page: 1);
  }

  void setPage(int page) {
    state = state.copyWith(page: page);
  }
}

@riverpod
Future<ProductListResult> products(Ref ref) {
  final repository = ref.watch(catalogueRepositoryProvider);
  final query = ref.watch(catalogueQueryProvider);

  return repository.getProducts(
    categorySlug: query.categorySlug,
    search: query.search.isNotEmpty ? query.search : null,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  );
}
