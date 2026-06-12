import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'api_exception.dart';
import 'dio_provider.dart';

part 'api_client.g.dart';

@Riverpod(keepAlive: true)
ApiClient apiClient(Ref ref) {
  return ApiClient(ref.watch(dioProvider));
}

class ApiClient {
  final Dio _dio;

  ApiClient(this._dio);

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
      );
      return _handleResponse(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  dynamic _handleResponse(Response response) {
    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == false) {
      throw ApiException(
        code: data['error']?['code']?.toString(),
        message:
            data['error']?['message']?.toString() ?? 'Unknown backend error',
        statusCode: response.statusCode,
        raw: data,
      );
    }
    return data;
  }

  ApiException _handleError(DioException e) {
    String message = e.message ?? 'Unknown Dio error';
    String? code;

    if (e.response?.data is Map<String, dynamic>) {
      final errorData = e.response?.data['error'];
      if (errorData != null) {
        message = errorData['message'] ?? message;
        code = errorData['code']?.toString();
      }
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timeout';
      code = 'TIMEOUT';
    }

    return ApiException(
      code: code,
      message: message,
      statusCode: e.response?.statusCode,
      raw: e.response?.data,
    );
  }
}
