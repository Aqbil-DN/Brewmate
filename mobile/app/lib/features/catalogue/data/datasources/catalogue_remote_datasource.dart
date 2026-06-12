import 'package:dio/dio.dart';
import '../../../../core/api/api_exception.dart';

class CatalogueRemoteDataSource {
  final Dio _dio;

  CatalogueRemoteDataSource(this._dio);

  Future<List<dynamic>> getCategories() async {
    try {
      final response = await _dio.get('/categories');
      return response.data['data'] as List<dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        message: e.response?.data?['message'] ?? e.message ?? 'Unknown error',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> getProducts({
    String? categorySlug,
    String? search,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit};

      if (categorySlug != null && categorySlug.isNotEmpty) {
        queryParams['categorySlug'] = categorySlug;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (sort != null && sort.isNotEmpty) {
        queryParams['sort'] = sort;
      }

      final response = await _dio.get(
        '/products',
        queryParameters: queryParams,
      );
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        message: e.response?.data?['message'] ?? e.message ?? 'Unknown error',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> getProductDetail(String id) async {
    try {
      final response = await _dio.get('/products/$id');
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        message: e.response?.data?['message'] ?? e.message ?? 'Unknown error',
        statusCode: e.response?.statusCode,
      );
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }
}
