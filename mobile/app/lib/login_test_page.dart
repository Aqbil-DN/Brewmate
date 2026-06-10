import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

class LoginTestPage extends StatefulWidget {
  const LoginTestPage({super.key});

  @override
  State<LoginTestPage> createState() => _LoginTestPageState();
}

class _LoginTestPageState extends State<LoginTestPage> {
  String? idToken;
  String? email;
  String? error;
  bool loading = false;

  Future<void> signInWithGoogleAndGetIdToken() async {
    setState(() {
      loading = true;
      error = null;
      idToken = null;
      email = null;
    });

    try {
      User? user;

      if (kIsWeb) {
        // ── WEB: gunakan FirebaseAuth.signInWithPopup ───────────────
        final provider = GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        final result = await FirebaseAuth.instance.signInWithPopup(provider);
        user = result.user;
      } else {
        // ── ANDROID / iOS: gunakan GoogleSignIn plugin ──────────────
        final googleUser = await GoogleSignIn().signIn();

        if (googleUser == null) {
          setState(() {
            error = 'Login dibatalkan user.';
            loading = false;
          });
          return;
        }

        final googleAuth = await googleUser.authentication;

        final credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );

        final userCredential =
            await FirebaseAuth.instance.signInWithCredential(credential);
        user = userCredential.user;
      }

      if (user == null) {
        setState(() => error = 'Firebase user kosong.');
        return;
      }

      final token = await user.getIdToken();

      setState(() {
        email = user!.email;
        idToken = token;
      });
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    if (!kIsWeb) {
      await GoogleSignIn().signOut();
    }
    setState(() {
      idToken = null;
      email = null;
      error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BrewMate Google Login Test'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            ElevatedButton(
              onPressed: loading ? null : signInWithGoogleAndGetIdToken,
              child: Text(loading ? 'Loading...' : 'Continue with Google'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: signOut,
              child: const Text('Sign Out'),
            ),
            const SizedBox(height: 24),
            if (email != null) Text('Email: $email'),
            if (error != null)
              Text(
                'Error: $error',
                style: const TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 24),
            if (idToken != null) ...[
              const Text('Firebase ID Token:'),
              SelectableText(idToken!),
            ],
          ],
        ),
      ),
    );
  }
}
