class ApiException implements Exception {
  final String? code;
  final String message;
  final int? statusCode;
  final dynamic raw;

  ApiException({this.code, required this.message, this.statusCode, this.raw});

  @override
  String toString() {
    return 'ApiException(code: $code, message: $message, statusCode: $statusCode)';
  }
}
