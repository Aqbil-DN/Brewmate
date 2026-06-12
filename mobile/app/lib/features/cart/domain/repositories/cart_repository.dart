import '../entities/cart.dart';

abstract class CartRepository {
  Future<Cart> getCart();
  Future<Cart> addItem({
    required String productId,
    String? variantId,
    required int quantity,
    String? specialInstructions,
  });
  Future<Cart> updateItem({
    required String itemId,
    int? quantity,
    String? specialInstructions,
  });
  Future<Cart> removeItem(String itemId);
  Future<Cart> clearCart();
}
