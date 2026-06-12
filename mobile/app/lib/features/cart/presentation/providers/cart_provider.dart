import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/api/dio_provider.dart';
import '../../data/datasources/cart_remote_datasource.dart';
import '../../data/repositories/cart_repository_impl.dart';
import '../../domain/entities/cart.dart';
import '../../domain/repositories/cart_repository.dart';

part 'cart_provider.g.dart';

@riverpod
CartRemoteDataSource cartRemoteDataSource(CartRemoteDataSourceRef ref) {
  final dio = ref.watch(dioProvider);
  return CartRemoteDataSource(dio);
}

@riverpod
CartRepository cartRepository(CartRepositoryRef ref) {
  final remoteDataSource = ref.watch(cartRemoteDataSourceProvider);
  return CartRepositoryImpl(remoteDataSource);
}

@riverpod
class CartController extends _$CartController {
  @override
  FutureOr<Cart> build() async {
    final repository = ref.watch(cartRepositoryProvider);
    return repository.getCart();
  }

  Future<void> addItem({
    required String productId,
    String? variantId,
    required int quantity,
    String? specialInstructions,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(cartRepositoryProvider);
      return repository.addItem(
        productId: productId,
        variantId: variantId,
        quantity: quantity,
        specialInstructions: specialInstructions,
      );
    });
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(cartRepositoryProvider);
      return repository.updateItem(itemId: itemId, quantity: quantity);
    });
  }

  Future<void> removeItem(String itemId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(cartRepositoryProvider);
      return repository.removeItem(itemId);
    });
  }

  Future<void> clearCart() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(cartRepositoryProvider);
      return repository.clearCart();
    });
  }
}
