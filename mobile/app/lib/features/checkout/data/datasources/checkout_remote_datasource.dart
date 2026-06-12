import 'package:dio/dio.dart';
import '../../../../core/api/api_exception.dart';
import '../models/create_order_request.dart';

class CheckoutRemoteDataSource {
  final Dio _dio;

  CheckoutRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> validatePromo(String code, double cartSubtotal) async {
    try {
      final response = await _dio.post(
        '/promotions/validate',
        data: {
          'code': code,
          'cartSubtotal': cartSubtotal,
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

  Future<Map<String, dynamic>> createOrder(CreateOrderRequest request) async {
    try {
      final response = await _dio.post(
        '/orders',
        data: request.toJson(),
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

  Future<Map<String, dynamic>> getOrder(String orderId) async {
    try {
      final response = await _dio.get('/orders/$orderId');
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
