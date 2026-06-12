import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../cart/presentation/providers/cart_provider.dart';
import 'providers/product_detail_provider.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  String? _selectedVariantId;

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(productDetailProvider(widget.productId));

    return Scaffold(
      appBar: AppBar(title: const Text('Product Details')),
      body: detailAsync.when(
        data: (product) {
          // Initialize selected variant if not set
          if (_selectedVariantId == null && product.variants.isNotEmpty) {
            final defaultVariant = product.variants.firstWhere(
              (v) => v.isDefault,
              orElse: () => product.variants.first,
            );
            _selectedVariantId = defaultVariant.id;
          }

          double currentPrice = product.basePrice;
          if (_selectedVariantId != null) {
            final selectedVariant = product.variants.firstWhere(
              (v) => v.id == _selectedVariantId,
              orElse: () => product.variants.first,
            );
            currentPrice += selectedVariant.priceModifier;
          }

          final totalPrice = currentPrice;

          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.only(
                  bottom: 100,
                ), // Space for FAB/Bottom Bar
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Image
                    AspectRatio(
                      aspectRatio: 1,
                      child:
                          product.imageUrl != null &&
                              product.imageUrl!.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: product.imageUrl!,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: CircularProgressIndicator(),
                              ),
                              errorWidget: (context, url, error) => const Icon(
                                Icons.coffee,
                                size: 100,
                                color: AppColors.divider,
                              ),
                            )
                          : Container(
                              color: AppColors.surfaceVariant,
                              child: const Icon(
                                Icons.coffee,
                                size: 100,
                                color: AppColors.divider,
                              ),
                            ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title & Category
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  product.name,
                                  style: AppTextStyles.headlineSmall.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              if (product.category != null)
                                Chip(
                                  label: Text(product.category!.name),
                                  backgroundColor: AppColors.surfaceVariant,
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Price
                          Text(
                            CurrencyFormatter.formatRupiah(totalPrice),
                            style: AppTextStyles.headlineMedium.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          // Tags
                          if (product.tags.isNotEmpty) ...[
                            Wrap(
                              spacing: 8,
                              children: product.tags.map((tag) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.secondary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(
                                      color: AppColors.secondary,
                                    ),
                                  ),
                                  child: Text(
                                    tag.name,
                                    style: AppTextStyles.labelSmall.copyWith(
                                      color: AppColors.secondary,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 16),
                          ],
                          // Description
                          if (product.description != null &&
                              product.description!.isNotEmpty) ...[
                            Text(
                              'Description',
                              style: AppTextStyles.titleMedium.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              product.description!,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textSecondary,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],
                          // Variants
                          if (product.variants.isNotEmpty) ...[
                            Text(
                              'Select Variant',
                              style: AppTextStyles.titleMedium.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...product.variants.map((variant) {
                              return RadioListTile<String>(
                                title: Text(variant.name),
                                subtitle: variant.priceModifier > 0
                                    ? Text(
                                        '+ Rp ${variant.priceModifier.toInt()}',
                                      )
                                    : variant.priceModifier < 0
                                    ? Text(
                                        '- Rp ${variant.priceModifier.abs().toInt()}',
                                      )
                                    : null,
                                value: variant.id,
                                groupValue: _selectedVariantId,
                                activeColor: AppColors.primary,
                                onChanged: variant.isAvailable
                                    ? (value) {
                                        setState(() {
                                          _selectedVariantId = value;
                                        });
                                      }
                                    : null,
                                contentPadding: EdgeInsets.zero,
                              );
                            }),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              // Bottom Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
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
                  child: ElevatedButton(
                    onPressed: product.isAvailable
                        ? () {
                            ref
                                .read(cartControllerProvider.notifier)
                                .addItem(
                                  productId: product.id,
                                  variantId: _selectedVariantId,
                                  quantity: 1, // Default 1
                                );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Added to Cart!'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      product.isAvailable
                          ? 'Add to Cart'
                          : 'Currently Unavailable',
                      style: AppTextStyles.titleMedium.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $error'),
              ElevatedButton(
                onPressed: () =>
                    ref.refresh(productDetailProvider(widget.productId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
