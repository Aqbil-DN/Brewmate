import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/splash/presentation/splash_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/providers/auth_controller.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/catalogue/presentation/catalogue_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/coffee_match/presentation/coffee_match_entry_screen.dart';

import 'route_names.dart';

part 'app_router.g.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'root',
);
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>(
  debugLabel: 'shell',
);

@riverpod
GoRouter appRouter(Ref ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      // If auth state is loading or initial, stay on splash screen
      if (authState.isLoading || !authState.hasValue) {
        return null;
      }

      final isAuth = authState.value != null;
      final isSplash = state.uri.path == '/splash';
      final isLogin = state.uri.path == '/login';
      final isRegister = state.uri.path == '/register';

      final isGoingToPublicRoute = isSplash || isLogin || isRegister;

      if (!isAuth) {
        // Unauthenticated user trying to access protected route or still on splash
        if (!isGoingToPublicRoute || isSplash) {
          return '/login';
        }
      } else {
        // Authenticated user trying to access public route (splash/login/register)
        if (isGoingToPublicRoute) {
          return '/home';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        name: RouteNames.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        name: RouteNames.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        name: RouteNames.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/home',
            name: RouteNames.home,
            builder: (context, state) => const HomeDashboardScreen(),
          ),
          GoRoute(
            path: '/catalogue',
            name: RouteNames.catalogue,
            builder: (context, state) => const CatalogueScreen(),
          ),
          GoRoute(
            path: '/cart',
            name: RouteNames.cart,
            builder: (context, state) => const CartScreen(),
          ),
          GoRoute(
            path: '/orders',
            name: RouteNames.orders,
            builder: (context, state) => const OrdersScreen(),
          ),
          GoRoute(
            path: '/profile',
            name: RouteNames.profile,
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/coffee-match',
        name: RouteNames.coffeeMatch,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CoffeeMatchEntryScreen(),
      ),
    ],
  );
}
