import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/order.dart';
import '../../domain/entities/promotion_validation.dart';
import '../../../cart/domain/entities/cart.dart';

part 'checkout_state.freezed.dart';

@freezed
abstract class CheckoutState with _$CheckoutState {
  const factory CheckoutState({
    Cart? cart,
    PromotionValidation? promoValidation,
    @Default('pickup') String selectedOrderType,
    @Default('xendit') String selectedPaymentMethod,
    String? specialNotes,
    @Default(false) bool placingOrder,
    @Default(false) bool applyingPromo,
    Order? order,
    String? errorMessage,
  }) = _CheckoutState;
}
