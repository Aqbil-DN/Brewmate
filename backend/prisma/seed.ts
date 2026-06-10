import { PrismaClient, AuthProvider, OrderType, ProductStatus, DrinkType, BudgetTier, TagType, DiscountType, InputMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Categories
  console.log('Seeding categories...');
  const categoriesData = [
    { name: 'Coffee', slug: 'coffee', displayOrder: 1 },
    { name: 'Non-Coffee', slug: 'non-coffee', displayOrder: 2 },
    { name: 'Snack', slug: 'snack', displayOrder: 3 },
    { name: 'Bundles', slug: 'bundles', displayOrder: 4 },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, displayOrder: cat.displayOrder, isActive: true },
      create: { name: cat.name, slug: cat.slug, displayOrder: cat.displayOrder, isActive: true },
    });
    categoriesMap[cat.slug] = createdCat.id;
  }

  // 2. Seed Tags
  console.log('Seeding tags...');
  const tagsData = [
    { name: 'Vegan', tagType: TagType.dietary, colorHex: '#3FA66B' },
    { name: 'Dairy-Free', tagType: TagType.dietary, colorHex: '#4E9AF1' },
    { name: 'Sugar-Free', tagType: TagType.dietary, colorHex: '#7E57C2' },
    { name: 'New', tagType: TagType.promotional, colorHex: '#FF9800' },
    { name: 'Staff Pick', tagType: TagType.label, colorHex: '#795548' },
    { name: 'Best Deal', tagType: TagType.promotional, colorHex: '#E91E63' },
  ];

  const tagsMap: Record<string, string> = {};
  for (const t of tagsData) {
    const createdTag = await prisma.tag.upsert({
      where: { name: t.name },
      update: { tagType: t.tagType, colorHex: t.colorHex },
      create: { name: t.name, tagType: t.tagType, colorHex: t.colorHex },
    });
    tagsMap[t.name] = createdTag.id;
  }

  // 3. Seed Products
  console.log('Seeding products...');
  const productsData = [
    // --- Coffee Category ---
    {
      name: 'Iced Americano',
      categorySlug: 'coffee',
      description: 'Bold espresso with chilled water, clean and refreshing.',
      basePrice: 28000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 6000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['focus', 'stay_awake', 'refreshing'],
        flavorTags: ['strong', 'fresh'],
        drinkType: DrinkType.coffee,
        budgetTier: BudgetTier.budget,
        caffeineLevel: 8,
        sweetnessLevel: 1,
        strengthLevel: 8,
        aiDescription: 'A clean, bold pick when you need caffeine without sweetness.',
      },
      tagNames: [],
    },
    {
      name: 'Hot Latte',
      categorySlug: 'coffee',
      description: 'Rich espresso with steamed milk and a thin layer of foam.',
      basePrice: 34000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 7000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['chill', 'focus'],
        flavorTags: ['creamy'],
        drinkType: DrinkType.coffee,
        budgetTier: BudgetTier.regular,
        caffeineLevel: 6,
        sweetnessLevel: 3,
        strengthLevel: 5,
        aiDescription: 'Smooth and creamy classic, perfect for a cozy morning.',
      },
      tagNames: [],
    },
    {
      name: 'Iced Palm Sugar Latte',
      categorySlug: 'coffee',
      description: 'Our signature espresso with creamy milk and natural Indonesian palm sugar.',
      basePrice: 42000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 8000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['sweet_craving', 'stay_awake', 'chill'],
        flavorTags: ['sweet', 'creamy'],
        drinkType: DrinkType.coffee,
        budgetTier: BudgetTier.regular,
        caffeineLevel: 6,
        sweetnessLevel: 8,
        strengthLevel: 5,
        aiDescription: 'A popular sweet coffee drink with rich Indonesian palm sugar flavor.',
      },
      tagNames: ['Staff Pick'],
    },
    {
      name: 'Caramel Macchiato',
      categorySlug: 'coffee',
      description: 'Espresso combined with vanilla-flavored syrup, milk and caramel drizzle.',
      basePrice: 48000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 9000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['sweet_craving', 'chill'],
        flavorTags: ['sweet', 'creamy'],
        drinkType: DrinkType.coffee,
        budgetTier: BudgetTier.regular,
        caffeineLevel: 6,
        sweetnessLevel: 9,
        strengthLevel: 4,
        aiDescription: 'A sweet indulgence combining vanilla, milk, espresso, and rich caramel.',
      },
      tagNames: ['New'],
    },
    {
      name: 'Cold Brew',
      categorySlug: 'coffee',
      description: 'Steeped for 12 hours for a smoother, less acidic coffee flavor.',
      basePrice: 45000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 9000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['focus', 'stay_awake'],
        flavorTags: ['strong', 'fresh'],
        drinkType: DrinkType.coffee,
        budgetTier: BudgetTier.regular,
        caffeineLevel: 9,
        sweetnessLevel: 1,
        strengthLevel: 9,
        aiDescription: 'Slow-steeped cold brew offering a clean, naturally sweet finish.',
      },
      tagNames: [],
    },
    {
      name: 'Espresso',
      categorySlug: 'coffee',
      description: 'Concentrated coffee brewed by forcing hot water under pressure.',
      basePrice: 26000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Single', priceModifier: 0, isDefault: true },
        { name: 'Double', priceModifier: 8000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['focus', 'stay_awake'],
        flavorTags: ['strong'],
        drinkType: DrinkType.coffee,
        budgetTier: BudgetTier.budget,
        caffeineLevel: 9,
        sweetnessLevel: 0,
        strengthLevel: 10,
        aiDescription: 'A pure shot of intense, full-bodied coffee flavor.',
      },
      tagNames: [],
    },

    // --- Non-Coffee Category ---
    {
      name: 'Matcha Latte',
      categorySlug: 'non-coffee',
      description: 'Premium Uji matcha whisked with fresh milk.',
      basePrice: 43000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 8000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['chill', 'refreshing'],
        flavorTags: ['creamy', 'fresh'],
        drinkType: DrinkType.non_coffee,
        budgetTier: BudgetTier.regular,
        caffeineLevel: 3,
        sweetnessLevel: 5,
        strengthLevel: 2,
        aiDescription: 'Smooth and earth Uji matcha blended beautifully with sweet milk.',
      },
      tagNames: ['Staff Pick'],
    },
    {
      name: 'Chocolate Frappe',
      categorySlug: 'non-coffee',
      description: 'Blended rich chocolate with milk and ice, topped with whipped cream.',
      basePrice: 52000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 10000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['sweet_craving', 'chill'],
        flavorTags: ['chocolatey', 'creamy', 'sweet'],
        drinkType: DrinkType.non_coffee,
        budgetTier: BudgetTier.premium,
        caffeineLevel: 1,
        sweetnessLevel: 9,
        strengthLevel: 1,
        aiDescription: 'A luxurious blended chocolate treat to satisfy your dessert cravings.',
      },
      tagNames: ['New'],
    },
    {
      name: 'Iced Lemon Tea',
      categorySlug: 'non-coffee',
      description: 'Freshly brewed tea with freshly squeezed lemon juice.',
      basePrice: 24000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 5000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['refreshing', 'chill'],
        flavorTags: ['fresh'],
        drinkType: DrinkType.non_coffee,
        budgetTier: BudgetTier.budget,
        caffeineLevel: 1,
        sweetnessLevel: 4,
        strengthLevel: 1,
        aiDescription: 'A zesty and refreshing iced tea perfect for a hot day.',
      },
      tagNames: ['Best Deal'],
    },
    {
      name: 'Strawberry Yakult',
      categorySlug: 'non-coffee',
      description: 'Refreshing probiotic milk drink with sweet strawberry purée.',
      basePrice: 36000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
        { name: 'Large', priceModifier: 7000, isDefault: false },
      ],
      aiAttributes: {
        needTags: ['refreshing', 'sweet_craving'],
        flavorTags: ['sweet', 'fresh'],
        drinkType: DrinkType.non_coffee,
        budgetTier: BudgetTier.regular,
        caffeineLevel: 0,
        sweetnessLevel: 7,
        strengthLevel: 1,
        aiDescription: 'Sweet and tangy yakult drink layered with fresh strawberry sauce.',
      },
      tagNames: ['New'],
    },

    // --- Snack Category ---
    {
      name: 'Brown Butter Cookies',
      categorySlug: 'snack',
      description: 'Chewy, rich cookies made with browned butter and chocolate chunks.',
      basePrice: 22000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Single', priceModifier: 0, isDefault: true },
        { name: 'Pack of 3', priceModifier: 40000, isDefault: false },
      ],
      tagNames: ['Staff Pick'],
    },
    {
      name: 'Butter Croissant',
      categorySlug: 'snack',
      description: 'Flaky, buttery French pastry baked daily.',
      basePrice: 28000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
      ],
      tagNames: ['Best Deal'],
    },
    {
      name: 'Banana Bread',
      categorySlug: 'snack',
      description: 'Moist banana slice cake infused with cinnamon.',
      basePrice: 26000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Slice', priceModifier: 0, isDefault: true },
      ],
      tagNames: ['New'],
    },
    {
      name: 'Cheese Danish',
      categorySlug: 'snack',
      description: 'Sweet cream cheese filling inside flaky puff pastry.',
      basePrice: 30000,
      isFeatured: false,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
      ],
      tagNames: [],
    },

    // --- Bundles Category ---
    {
      name: 'Coffee + Cookies Bundle',
      categorySlug: 'bundles',
      description: 'A cup of Iced Americano paired with a Brown Butter Cookie.',
      basePrice: 55000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
      ],
      tagNames: ['Best Deal'],
    },
    {
      name: 'Latte + Croissant Bundle',
      categorySlug: 'bundles',
      description: 'A cup of Hot Latte paired with a Butter Croissant.',
      basePrice: 62000,
      isFeatured: true,
      status: ProductStatus.active,
      isAvailable: true,
      variants: [
        { name: 'Regular', priceModifier: 0, isDefault: true },
      ],
      tagNames: ['Best Deal'],
    },
  ];

  for (const prod of productsData) {
    const categoryId = categoriesMap[prod.categorySlug];
    if (!categoryId) continue;

    // Idempotent upsert logic for products using a name finder check
    let dbProduct = await prisma.product.findFirst({
      where: { name: prod.name },
    });

    if (dbProduct) {
      dbProduct = await prisma.product.update({
        where: { id: dbProduct.id },
        data: {
          categoryId,
          description: prod.description,
          basePrice: prod.basePrice,
          isFeatured: prod.isFeatured,
          status: prod.status,
          isAvailable: prod.isAvailable,
        },
      });
    } else {
      dbProduct = await prisma.product.create({
        data: {
          categoryId,
          name: prod.name,
          description: prod.description,
          basePrice: prod.basePrice,
          isFeatured: prod.isFeatured,
          status: prod.status,
          isAvailable: prod.isAvailable,
        },
      });
    }

    // Replace Variants (idempotent delete & insert)
    await prisma.productVariant.deleteMany({
      where: { productId: dbProduct.id },
    });
    for (const v of prod.variants) {
      await prisma.productVariant.create({
        data: {
          productId: dbProduct.id,
          name: v.name,
          priceModifier: v.priceModifier,
          isDefault: v.isDefault,
          isAvailable: true,
        },
      });
    }

    // Upsert AI Attributes (beverages only)
    if (prod.aiAttributes) {
      await prisma.productAiAttribute.upsert({
        where: { productId: dbProduct.id },
        update: {
          needTags: prod.aiAttributes.needTags,
          flavorTags: prod.aiAttributes.flavorTags,
          drinkType: prod.aiAttributes.drinkType,
          budgetTier: prod.aiAttributes.budgetTier,
          caffeineLevel: prod.aiAttributes.caffeineLevel,
          sweetnessLevel: prod.aiAttributes.sweetnessLevel,
          strengthLevel: prod.aiAttributes.strengthLevel,
          aiDescription: prod.aiAttributes.aiDescription,
        },
        create: {
          productId: dbProduct.id,
          needTags: prod.aiAttributes.needTags,
          flavorTags: prod.aiAttributes.flavorTags,
          drinkType: prod.aiAttributes.drinkType,
          budgetTier: prod.aiAttributes.budgetTier,
          caffeineLevel: prod.aiAttributes.caffeineLevel,
          sweetnessLevel: prod.aiAttributes.sweetnessLevel,
          strengthLevel: prod.aiAttributes.strengthLevel,
          aiDescription: prod.aiAttributes.aiDescription,
        },
      });
    }

    // Replace Product Tags
    await prisma.productTag.deleteMany({
      where: { productId: dbProduct.id },
    });
    for (const tagName of prod.tagNames) {
      const tagId = tagsMap[tagName];
      if (tagId) {
        await prisma.productTag.create({
          data: {
            productId: dbProduct.id,
            tagId,
          },
        });
      }
    }
  }

  // 4. Seed Demo User
  console.log('Seeding demo user...');
  const demoEmail = 'demo@brewmate.ai';
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash: hashedPassword,
      fullName: 'Demo User',
      phoneNumber: '+6281234567890',
      isVerified: true,
      isActive: true,
    },
    create: {
      email: demoEmail,
      passwordHash: hashedPassword,
      fullName: 'Demo User',
      phoneNumber: '+6281234567890',
      authProvider: AuthProvider.email,
      isVerified: true,
      isActive: true,
    },
  });

  // User Preferences
  await prisma.userPreference.upsert({
    where: { userId: demoUser.id },
    update: {
      allergenTags: [],
      defaultOrderType: OrderType.pickup,
      defaultPaymentMethod: 'xendit',
      aiNotificationsEnabled: true,
    },
    create: {
      userId: demoUser.id,
      allergenTags: [],
      defaultOrderType: OrderType.pickup,
      defaultPaymentMethod: 'xendit',
      aiNotificationsEnabled: true,
    },
  });

  // Ensure active cart exists
  await prisma.cart.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
    },
  });

  // 5. Seed Promotions
  console.log('Seeding promotions...');
  const now = new Date();
  const oneDayAgo = new Date();
  oneDayAgo.setDate(now.getDate() - 1);

  const promoExpiry90Days = new Date();
  promoExpiry90Days.setDate(now.getDate() + 90);

  const promoExpiry60Days = new Date();
  promoExpiry60Days.setDate(now.getDate() + 60);

  const promoExpiry30Days = new Date();
  promoExpiry30Days.setDate(now.getDate() + 30);

  const promotionsData = [
    {
      code: 'BREW10',
      discountType: DiscountType.percentage,
      discountValue: 10,
      minOrderValue: 50000,
      maxUses: null,
      validFrom: oneDayAgo,
      validUntil: promoExpiry90Days,
    },
    {
      code: 'WELCOME25',
      discountType: DiscountType.fixed_amount,
      discountValue: 25000,
      minOrderValue: 100000,
      maxUses: 1000,
      validFrom: oneDayAgo,
      validUntil: promoExpiry60Days,
    },
    {
      code: 'FREESNACK',
      discountType: DiscountType.free_item,
      discountValue: 0,
      minOrderValue: 75000,
      maxUses: 500,
      validFrom: oneDayAgo,
      validUntil: promoExpiry30Days,
    },
  ];

  for (const promo of promotionsData) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: {
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderValue: promo.minOrderValue,
        maxUses: promo.maxUses,
        isActive: true,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
      },
      create: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderValue: promo.minOrderValue,
        maxUses: promo.maxUses,
        currentUses: 0,
        isActive: true,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
