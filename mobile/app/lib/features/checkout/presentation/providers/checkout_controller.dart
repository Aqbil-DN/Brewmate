import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/api/dio_provider.dart';
import '../../../cart/presentation/providers/cart_provider.dart';
import '../../data/datasources/checkout_remote_datasource.dart';
import '../../data/models/create_order_request.dart';
import '../../data/repositories/checkout_repository_impl.dart';
import '../../domain/repositories/checkout_repository.dart';
import 'checkout_state.dart';

part 'checkout_controller.g.dart';

@riverpod
CheckoutRemoteDataSource checkoutRemoteDataSource(Ref ref) {
  final dio = ref.watch(dioProvider);
  return CheckoutRemoteDataSource(dio);
}

@riverpod
CheckoutRepository checkoutRepository(Ref ref) {
  final remoteDataSource = ref.watch(checkoutRemoteDataSourceProvider);
  return CheckoutRepositoryImpl(remoteDataSource);
}

@riverpod
class CheckoutController extends _$CheckoutController {
  @override
  CheckoutState build() {
    return const CheckoutState();
  }

  void updateOrderType(String type) {
    state = state.copyWith(selectedOrderType: type);
  }

  void updateSpecialNotes(String notes) {
    state = state.copyWith(specialNotes: notes);
  }

  Future<void> applyPromo(String code) async {
    final cartState = ref.read(cartControllerProvider);
    final cart = cartState.value;
    if (cart == null || cart.items.isEmpty) {
      state = state.copyWith(errorMessage: 'Cart is empty');
      return;
    }

    state = state.copyWith(applyingPromo: true, errorMessage: null);

    try {
      final repository = ref.read(checkoutRepositoryProvider);
      final validation = await repository.validatePromo(code, cart.subtotal);
      state = state.copyWith(
        applyingPromo: false,
        promoValidation: validation,
      );
    } catch (e) {
      state = state.copyWith(
        applyingPromo: false,
        errorMessage: e.toString(),
        promoValidation: null,
      );
    }
  }

  void clearPromo() {
    state = state.copyWith(promoValidation: null, errorMessage: null);
  }

  Future<bool> placeOrder() async {
    final cartState = ref.read(cartControllerProvider);
    final cart = cartState.value;
    if (cart == null || cart.items.isEmpty) {
      state = state.copyWith(errorMessage: 'Cart is empty');
      return false;
    }

    state = state.copyWith(placingOrder: true, errorMessage: null);

    try {
      final repository = ref.read(checkoutRepositoryProvider);
      final request = CreateOrderRequest(
        orderType: state.selectedOrderType,
        paymentMethod: state.selectedPaymentMethod,
        promoCode: state.promoValidation?.code,
        specialNotes: state.specialNotes,
      );

      final order = await repository.createOrder(request);

      state = state.copyWith(
        placingOrder: false,
        order: order,
      );

      // Refresh cart because backend might have cleared it (or will clear it later)
      ref.invalidate(cartControllerProvider);

      return true;
    } catch (e) {
      state = state.copyWith(
        placingOrder: false,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  Future<void> openPaymentUrl() async {
    final url = state.order?.paymentUrl;
    if (url != null) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        state = state.copyWith(errorMessage: 'Could not open payment URL');
      }
    }
  }

  Future<void> checkOrderStatus() async {
    final orderId = state.order?.id;
    if (orderId == null) return;

    try {
      final repository = ref.read(checkoutRepositoryProvider);
      final order = await repository.getOrder(orderId);
      state = state.copyWith(order: order);
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to refresh order: $e');
    }
  }
}
