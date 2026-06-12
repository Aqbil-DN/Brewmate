import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../cart/presentation/providers/cart_provider.dart';
import 'providers/checkout_controller.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _promoController = TextEditingController();

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartControllerProvider);
    final checkoutState = ref.watch(checkoutControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        centerTitle: true,
      ),
      body: cartState.when(
        data: (cart) {
          if (cart.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Your cart is empty'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.go('/home'),
                    child: const Text('Back to Menu'),
                  ),
                ],
              ),
            );
          }

          final subtotal = cart.subtotal;
          final discount = checkoutState.promoValidation?.discountAmount ?? 0.0;
          final total = checkoutState.promoValidation?.finalAmount ?? subtotal;

          return Stack(
            children: [
              ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Order Type
                  Text(
                    'Order Type',
                    style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                        value: 'pickup',
                        label: Text('Pickup'),
                        icon: Icon(Icons.storefront),
                      ),
                      ButtonSegment(
                        value: 'delivery',
                        label: Text('Delivery (Coming Soon)'),
                        icon: Icon(Icons.delivery_dining),
                        enabled: false,
                      ),
                    ],
                    selected: {checkoutState.selectedOrderType},
                    onSelectionChanged: (Set<String> newSelection) {
                      ref.read(checkoutControllerProvider.notifier).updateOrderType(newSelection.first);
                    },
                  ),
                  const SizedBox(height: 24),

                  // Cart Summary
                  Text(
                    'Order Summary',
                    style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.surfaceVariant),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: cart.items.map((item) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '${item.quantity}x ${item.productName} ${item.variantName != null ? '(${item.variantName})' : ''}',
                                  style: AppTextStyles.bodyMedium,
                                ),
                              ),
                              Text(
                                CurrencyFormatter.formatRupiah(item.lineTotal),
                                style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Payment Method
                  Text(
                    'Payment Method',
                    style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.surfaceVariant),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.account_balance_wallet, color: AppColors.primary),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Xendit', style: AppTextStyles.titleMedium),
                              Text('Pay with e-wallet, VA, or cards', style: AppTextStyles.labelMedium),
                            ],
                          ),
                        ),
                        const Icon(Icons.check_circle, color: AppColors.primary),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Promo Code
                  Text(
                    'Promo Code',
                    style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _promoController,
                          decoration: InputDecoration(
                            hintText: 'Enter promo code',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            errorText: checkoutState.errorMessage != null && checkoutState.applyingPromo == false
                                ? checkoutState.errorMessage
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      if (checkoutState.promoValidation != null)
                        ElevatedButton(
                          onPressed: () {
                            _promoController.clear();
                            ref.read(checkoutControllerProvider.notifier).clearPromo();
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                          child: const Text('Clear', style: TextStyle(color: Colors.white)),
                        )
                      else
                        ElevatedButton(
                          onPressed: checkoutState.applyingPromo
                              ? null
                              : () {
                                  if (_promoController.text.isNotEmpty) {
                                    ref.read(checkoutControllerProvider.notifier).applyPromo(_promoController.text);
                                  }
                                },
                          child: checkoutState.applyingPromo
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Apply'),
                        ),
                    ],
                  ),
                  if (checkoutState.promoValidation != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      checkoutState.promoValidation!.message ?? 'Promo applied!',
                      style: AppTextStyles.labelMedium.copyWith(color: Colors.green),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Special Notes
                  Text(
                    'Special Notes (Optional)',
                    style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Any special requests for the barista?',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                    maxLines: 2,
                    onChanged: (val) => ref.read(checkoutControllerProvider.notifier).updateSpecialNotes(val),
                  ),
                  
                  // Space for bottom bar
                  const SizedBox(height: 200),
                ],
              ),
              
              // Bottom Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -5),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Subtotal', style: AppTextStyles.bodyMedium),
                            Text(CurrencyFormatter.formatRupiah(subtotal), style: AppTextStyles.bodyMedium),
                          ],
                        ),
                        if (discount > 0) ...[
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Discount', style: AppTextStyles.bodyMedium.copyWith(color: Colors.green)),
                              Text('-${CurrencyFormatter.formatRupiah(discount)}', style: AppTextStyles.bodyMedium.copyWith(color: Colors.green)),
                            ],
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total', style: AppTextStyles.titleLarge.copyWith(fontWeight: FontWeight.bold)),
                            Text(
                              CurrencyFormatter.formatRupiah(total),
                              style: AppTextStyles.titleLarge.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: checkoutState.placingOrder
                                ? null
                                : () async {
                                    final success = await ref.read(checkoutControllerProvider.notifier).placeOrder();
                                    if (success) {
                                      // Call open URL then navigate
                                      await ref.read(checkoutControllerProvider.notifier).openPaymentUrl();
                                      if (context.mounted) {
                                        context.go('/payment/redirect');
                                      }
                                    } else {
                                      final error = ref.read(checkoutControllerProvider).errorMessage;
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(error ?? 'Failed to place order')),
                                        );
                                      }
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: checkoutState.placingOrder
                                ? const CircularProgressIndicator(color: Colors.white)
                                : Text(
                                    'Place Order',
                                    style: AppTextStyles.titleMedium.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
