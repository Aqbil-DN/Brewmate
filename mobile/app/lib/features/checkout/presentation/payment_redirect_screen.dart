import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import 'providers/checkout_controller.dart';

class PaymentRedirectScreen extends ConsumerWidget {
  const PaymentRedirectScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(checkoutControllerProvider);
    final order = state.order;

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Payment')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('No order found.'),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                child: const Text('Back Home'),
              ),
            ],
          ),
        ),
      );
    }

    final isPaid = order.paymentStatus.toLowerCase() == 'paid' || 
                   order.status.toLowerCase() == 'completed' || 
                   order.status.toLowerCase() == 'preparing';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Status'),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(
              isPaid ? Icons.check_circle : Icons.hourglass_top,
              size: 100,
              color: isPaid ? Colors.green : AppColors.primary,
            ),
            const SizedBox(height: 24),
            Text(
              isPaid ? 'Payment Successful!' : 'Waiting for Payment',
              textAlign: TextAlign.center,
              style: AppTextStyles.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Order: ${order.orderNumber}',
              textAlign: TextAlign.center,
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Status: ${order.paymentStatus.toUpperCase()}',
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 48),
            if (!isPaid)
              ElevatedButton(
                onPressed: () => ref.read(checkoutControllerProvider.notifier).checkOrderStatus(),
                child: const Text('Refresh Status'),
              ),
            if (!isPaid) const SizedBox(height: 16),
            if (!isPaid && order.paymentUrl != null)
              OutlinedButton(
                onPressed: () => ref.read(checkoutControllerProvider.notifier).openPaymentUrl(),
                child: const Text('Open Payment Page Again'),
              ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => context.go('/home'),
              child: const Text('Back to Home'),
            ),
          ],
        ),
      ),
    );
  }
}
