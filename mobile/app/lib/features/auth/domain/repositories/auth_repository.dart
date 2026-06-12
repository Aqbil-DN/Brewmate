import '../entities/auth_user.dart';

abstract class AuthRepository {
  Future<AuthUser> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
  });

  Future<AuthUser> login({required String email, required String password});

  Future<AuthUser> loginWithGoogle();

  Future<AuthUser?> getCurrentUser();

  Future<void> logout();

  Future<bool> hasToken();
}
