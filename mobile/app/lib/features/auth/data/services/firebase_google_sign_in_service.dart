import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/api/api_exception.dart';

part 'firebase_google_sign_in_service.g.dart';

class FirebaseGoogleSignInService {
  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  FirebaseGoogleSignInService(this._firebaseAuth, this._googleSignIn);

  Future<String> signInAndGetIdToken() async {
    User? firebaseUser;

    if (kIsWeb) {
      // 1. Web: Use FirebaseAuth signInWithPopup to avoid google_sign_in popup_closed issues
      try {
        final provider = GoogleAuthProvider();
        // Force account selection every time on Web
        provider.setCustomParameters({'prompt': 'select_account'});

        final userCredential = await _firebaseAuth.signInWithPopup(provider);
        firebaseUser = userCredential.user;
      } catch (e) {
        throw ApiException(
          code: 'GOOGLE_SIGN_IN_FAILED',
          message: 'Google sign-in failed: ${e.toString()}',
        );
      }
    } else {
      // 2. Mobile: Use GoogleSignIn plugin
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        throw ApiException(
          code: 'GOOGLE_SIGN_IN_CANCELLED',
          message: 'Google sign-in was cancelled.',
        );
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      final OAuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _firebaseAuth
          .signInWithCredential(credential);
      firebaseUser = userCredential.user;
    }

    // 3. Get Firebase ID token
    final String? idToken = await firebaseUser?.getIdToken();

    if (idToken == null || idToken.isEmpty) {
      throw ApiException(
        code: 'GOOGLE_ID_TOKEN_MISSING',
        message: 'Failed to retrieve Firebase ID token.',
      );
    }

    return idToken;
  }
}

@riverpod
FirebaseGoogleSignInService firebaseGoogleSignInService(Ref ref) {
  return FirebaseGoogleSignInService(FirebaseAuth.instance, GoogleSignIn());
}
