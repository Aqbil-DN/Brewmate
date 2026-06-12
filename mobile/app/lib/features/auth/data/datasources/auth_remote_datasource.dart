import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/api/api_client.dart';
import '../models/auth_response_model.dart';
import '../models/auth_user_model.dart';

part 'auth_remote_datasource.g.dart';

abstract class AuthRemoteDataSource {
  Future<AuthResponseModel> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
  });

  Future<AuthResponseModel> login({
    required String email,
    required String password,
  });

  Future<AuthUserModel> getCurrentUser();

  Future<AuthResponseModel> loginWithFirebaseGoogle({required String idToken});
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;

  AuthRemoteDataSourceImpl(this._apiClient);

  @override
  Future<AuthResponseModel> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
  }) async {
    final response = await _apiClient.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        'fullName': fullName,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
      },
    );
    return AuthResponseModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return AuthResponseModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<AuthUserModel> getCurrentUser() async {
    final response = await _apiClient.get('/auth/me');
    return AuthUserModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseModel> loginWithFirebaseGoogle({
    required String idToken,
  }) async {
    final response = await _apiClient.post(
      '/auth/firebase-google',
      data: {'idToken': idToken},
    );
    return AuthResponseModel.fromJson(response['data'] as Map<String, dynamic>);
  }
}

@riverpod
AuthRemoteDataSource authRemoteDataSource(Ref ref) {
  return AuthRemoteDataSourceImpl(ref.watch(apiClientProvider));
}
