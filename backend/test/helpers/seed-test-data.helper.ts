import { PrismaService } from '../../src/prisma/prisma.service.js';

export async function seedTestData(prisma: PrismaService) {
  // Create test category
  const coffeeCategory = await prisma.category.create({
    data: {
      name: 'Coffee',
      slug: 'coffee',
      isActive: true,
    },
  });

  // Create test product
  const product = await prisma.product.create({
    data: {
      name: 'Test Latte',
      slug: 'test-latte',
      description: 'A test latte.',
      basePrice: 30000,
      costPrice: 15000,
      isAvailable: true,
      categoryId: coffeeCategory.id,
      productAiAttributes: {
        create: {
          drinkType: 'coffee',
          isCaffeinated: true,
          isSweet: false,
          isCreamy: true,
          temperaturePriority: 'both',
          flavorProfile: ['creamy', 'strong'],
        },
      },
      productVariants: {
        create: [
          {
            name: 'Regular',
            priceModifier: 0,
            isAvailable: true,
            isDefault: true,
          },
          {
            name: 'Large',
            priceModifier: 5000,
            isAvailable: true,
            isDefault: false,
          },
        ],
      },
    },
    include: {
      productVariants: true,
    },
  });

  // Create active promotion
  const promotion = await prisma.promotion.create({
    data: {
      code: 'BREW10',
      description: '10% off',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 50000,
      maxDiscountAmount: 20000,
      startDate: new Date('2000-01-01'),
      endDate: new Date('2099-12-31'),
      maxUsesPerUser: 1,
      totalMaxUses: 100,
      currentUses: 0,
      isActive: true,
    },
  });

  return {
    coffeeCategory,
    product,
    defaultVariant: product.productVariants[0],
    promotion,
  };
}
