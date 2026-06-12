import { PrismaService } from '../../src/prisma/prisma.service.js';

export async function seedTestData(prisma: PrismaService) {
  // Upsert test category
  const coffeeCategory = await prisma.category.upsert({
    where: { slug: 'coffee' },
    update: {},
    create: {
      name: 'Coffee',
      slug: 'coffee',
      isActive: true,
    },
  });

  // Find or create test product (Product has no unique slug field in schema)
  let product = await prisma.product.findFirst({
    where: { name: 'Test Latte' },
    include: { productVariants: true },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        categoryId: coffeeCategory.id,
        name: 'Test Latte',
        description: 'A test latte.',
        basePrice: 30000,
        costPrice: 15000,
        isAvailable: true,
        productAiAttributes: {
          create: {
            drinkType: 'coffee',
            isCaffeinated: true,
            isSweet: false,
            isCreamy: true,
            needTags: ['stay_awake', 'focus'],
            flavorTags: ['creamy', 'strong'],
            budgetTier: 'regular',
            caffeineLevel: 7,
            sweetnessLevel: 3,
            strengthLevel: 6,
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
  }

  const defaultVariant = product.productVariants.find((v) => v.isDefault) ?? product.productVariants[0];

  // Upsert active promotion (Promotion has unique `code`)
  const promotion = await prisma.promotion.upsert({
    where: { code: 'BREW10' },
    update: {
      isActive: true,
      validFrom: new Date('2000-01-01'),
      validUntil: new Date('2099-12-31'),
    },
    create: {
      code: 'BREW10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 50000,
      maxUses: null,
      currentUses: 0,
      isActive: true,
      validFrom: new Date('2000-01-01'),
      validUntil: new Date('2099-12-31'),
    },
  });

  return { coffeeCategory, product, defaultVariant, promotion };
}
