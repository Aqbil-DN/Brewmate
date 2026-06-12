import '../../domain/entities/cart.dart';
import '../../domain/repositories/cart_repository.dart';
import 'cart_remote_datasource.dart';

class CartRepositoryImpl implements CartRepository {
  final CartRemoteDataSource _remoteDataSource;

  CartRepositoryImpl(this._remoteDataSource);

  @override
  Future<Cart> getCart() async {
    final data = await _remoteDataSource.getCart();
    return Cart.fromJson(data);
  }

  @override
  Future<Cart> addItem({
    required String productId,
    String? variantId,
    required int quantity,
    String? specialInstructions,
  }) async {
    final data = await _remoteDataSource.addItem(
      productId: productId,
      variantId: variantId,
      quantity: quantity,
      specialInstructions: specialInstructions,
    );
    return Cart.fromJson(data);
  }

  @override
  Future<Cart> updateItem({
    required String itemId,
    int? quantity,
    String? specialInstructions,
  }) async {
    final data = await _remoteDataSource.updateItem(
      itemId: itemId,
      quantity: quantity,
      specialInstructions: specialInstructions,
    );
    return Cart.fromJson(data);
  }

  @override
  Future<Cart> removeItem(String itemId) async {
    final data = await _remoteDataSource.removeItem(itemId);
    return Cart.fromJson(data);
  }

  @override
  Future<Cart> clearCart() async {
    final data = await _remoteDataSource.clearCart();
    return Cart.fromJson(data);
  }
}
