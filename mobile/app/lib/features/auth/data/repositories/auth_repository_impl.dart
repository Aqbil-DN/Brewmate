import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/storage/token_storage.dart';
import '../../domain/entities/auth_user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../services/firebase_google_sign_in_service.dart';

part 'auth_repository_impl.g.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final TokenStorage _tokenStorage;
  final FirebaseGoogleSignInService _googleSignInService;

  AuthRepositoryImpl(
    this._remoteDataSource,
    this._tokenStorage,
    this._googleSignInService,
  );

  @override
  Future<AuthUser> register({
    required String email,
    required String password,
    required String fullName,
    String? phoneNumber,
  }) async {
    final response = await _remoteDataSource.register(
      email: email,
      password: password,
      fullName: fullName,
      phoneNumber: phoneNumber,
    );
    await _tokenStorage.saveAccessToken(response.accessToken);
    return response.user.toEntity();
  }

  @override
  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final response = await _remoteDataSource.login(
      email: email,
      password: password,
    );
    await _tokenStorage.saveAccessToken(response.accessToken);
    return response.user.toEntity();
  }

  @override
  Future<AuthUser> loginWithGoogle() async {
    final idToken = await _googleSignInService.signInAndGetIdToken();
    final response = await _remoteDataSource.loginWithFirebaseGoogle(
      idToken: idToken,
    );
    await _tokenStorage.saveAccessToken(response.accessToken);
    return response.user.toEntity();
  }

  @override
  Future<AuthUser?> getCurrentUser() async {
    final hasToken = await _tokenStorage.hasAccessToken();
    if (!hasToken) {
      return null;
    }

    try {
      final userModel = await _remoteDataSource.getCurrentUser();
      return userModel.toEntity();
    } catch (e) {
      // If fetching user fails (e.g., token expired), clear token
      await logout();
      rethrow;
    }
  }

  @override
  Future<void> logout() async {
    await firebase_auth.FirebaseAuth.instance.signOut();
    await GoogleSignIn().signOut();
    await _tokenStorage.clearAccessToken();
  }

  @override
  Future<bool> hasToken() async {
    return _tokenStorage.hasAccessToken();
  }
}

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepositoryImpl(
    ref.watch(authRemoteDataSourceProvider),
    ref.watch(tokenStorageProvider),
    ref.watch(firebaseGoogleSignInServiceProvider),
  );
}
