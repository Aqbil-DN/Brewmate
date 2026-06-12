import '../entities/category.dart';
import '../entities/product.dart';
import '../entities/product_list_result.dart';

abstract class CatalogueRepository {
  Future<List<Category>> getCategories();

  Future<ProductListResult> getProducts({
    String? categorySlug,
    String? search,
    String? sort,
    int page = 1,
    int limit = 20,
  });

  Future<Product> getProductDetail(String id);
}
