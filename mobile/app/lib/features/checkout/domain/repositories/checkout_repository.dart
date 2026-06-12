import '../entities/order.dart';
import '../entities/promotion_validation.dart';
import '../../data/models/create_order_request.dart';

abstract class CheckoutRepository {
  Future<PromotionValidation> validatePromo(String code, double cartSubtotal);
  Future<Order> createOrder(CreateOrderRequest request);
  Future<Order> getOrder(String orderId);
}
