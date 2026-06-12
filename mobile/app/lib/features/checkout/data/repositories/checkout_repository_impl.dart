import '../../domain/entities/order.dart';
import '../../domain/entities/promotion_validation.dart';
import '../../domain/repositories/checkout_repository.dart';
import '../datasources/checkout_remote_datasource.dart';
import '../models/create_order_request.dart';

class CheckoutRepositoryImpl implements CheckoutRepository {
  final CheckoutRemoteDataSource _remoteDataSource;

  CheckoutRepositoryImpl(this._remoteDataSource);

  @override
  Future<PromotionValidation> validatePromo(String code, double cartSubtotal) async {
    final response = await _remoteDataSource.validatePromo(code, cartSubtotal);
    return PromotionValidation.fromJson(response);
  }

  @override
  Future<Order> createOrder(CreateOrderRequest request) async {
    final response = await _remoteDataSource.createOrder(request);
    return Order.fromJson(response);
  }

  @override
  Future<Order> getOrder(String orderId) async {
    final response = await _remoteDataSource.getOrder(orderId);
    return Order.fromJson(response);
  }
}
