import '../../domain/entities/category.dart';
import '../../domain/entities/product.dart';
import '../../domain/entities/product_list_result.dart';
import '../../domain/repositories/catalogue_repository.dart';
import '../datasources/catalogue_remote_datasource.dart';

class CatalogueRepositoryImpl implements CatalogueRepository {
  final CatalogueRemoteDataSource _remoteDataSource;

  CatalogueRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<Category>> getCategories() async {
    final data = await _remoteDataSource.getCategories();
    return data.map((json) => Category.fromJson(json)).toList();
  }

  @override
  Future<ProductListResult> getProducts({
    String? categorySlug,
    String? search,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    final data = await _remoteDataSource.getProducts(
      categorySlug: categorySlug,
      search: search,
      sort: sort,
      page: page,
      limit: limit,
    );
    return ProductListResult.fromJson(data);
  }

  @override
  Future<Product> getProductDetail(String id) async {
    final data = await _remoteDataSource.getProductDetail(id);
    return Product.fromJson(data);
  }
}
