import 'package:dio/dio.dart';
import '../../../../core/api/api_exception.dart';

class CartRemoteDataSource {
  final Dio _dio;

  CartRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> getCart() async {
    try {
      final response = await _dio.get('/cart');
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

  Future<Map<String, dynamic>> addItem({
    required String productId,
    String? variantId,
    required int quantity,
    String? specialInstructions,
  }) async {
    try {
      final response = await _dio.post(
        '/cart/items',
        data: {
          'productId': productId,
          if (variantId != null) 'variantId': variantId,
          'quantity': quantity,
          if (specialInstructions != null)
            'specialInstructions': specialInstructions,
        },
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

  Future<Map<String, dynamic>> updateItem({
    required String itemId,
    int? quantity,
    String? specialInstructions,
  }) async {
    try {
      final response = await _dio.patch(
        '/cart/items/$itemId',
        data: {
          if (quantity != null) 'quantity': quantity,
          if (specialInstructions != null)
            'specialInstructions': specialInstructions,
        },
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

  Future<Map<String, dynamic>> removeItem(String itemId) async {
    try {
      final response = await _dio.delete('/cart/items/$itemId');
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

  Future<Map<String, dynamic>> clearCart() async {
    try {
      final response = await _dio.delete('/cart/clear');
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
