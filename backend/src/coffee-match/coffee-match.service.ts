import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecommendationScoringService } from './recommendation-scoring.service.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { AddRecommendationToCartDto } from './dto/add-recommendation-to-cart.dto.js';
import { CartService } from '../cart/cart.service.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';

@Injectable()
export class CoffeeMatchService {
  private readonly logger = new Logger(CoffeeMatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: RecommendationScoringService,
    private readonly cartService: CartService,
  ) {}

  async submitQuiz(userId: string | null, dto: SubmitQuizDto) {
    let allergenTags: string[] = [];

    // 1. Fetch user preferences if authenticated
    if (userId) {
      const prefs = await this.prisma.userPreference.findUnique({
        where: { userId },
      });
      if (prefs && prefs.allergenTags) {
        allergenTags = prefs.allergenTags;
      }
    }

    // 2. Query eligible drink products
    // Exclude snack and bundle categories
    let eligibleProducts = await this.prisma.product.findMany({
      where: {
        status: 'active',
        isAvailable: true,
        productAiAttributes: { isNot: null },
        category: {
          slug: { notIn: ['snack', 'bundles'] }
        }
      },
      include: {
        category: true,
        productAiAttributes: true,
        productVariants: {
          where: { isAvailable: true }
        },
        productTags: {
          include: { tag: true }
        }
      }
    });

    // 3. Allergen filtering
    if (allergenTags.length > 0) {
      eligibleProducts = eligibleProducts.filter(p => {
        const pTags = p.productTags.map(pt => pt.tag.name.toLowerCase());
        // If product has any tag that matches the user's allergen, exclude it.
        const hasAllergen = allergenTags.some(a => pTags.includes(a.toLowerCase()));
        return !hasAllergen;
      });
    }

    // 4. Filter by Drink Type
    eligibleProducts = eligibleProducts.filter(p => {
      const type = p.productAiAttributes?.drinkType;
      if (dto.drinkTypeAnswer === 'surprise_me') return true;
      if (type === 'both') return true;
      return type === dto.drinkTypeAnswer;
    });

    // 5. Filter by Budget
    let filteredByBudget = this.filterByBudget(eligibleProducts, dto.budgetAnswer);

    // Relax budget if too few results
    if (filteredByBudget.length < 3) {
      filteredByBudget = eligibleProducts; // Relax budget, keep drink type
    }

    // 6. Score each product
    let scoredProducts = filteredByBudget.map(p => {
      const score = this.scoringService.scoreProduct({
        productAiAttributes: p.productAiAttributes,
        productIsFeatured: p.isFeatured,
        quiz: dto
      });
      return { product: p, score };
    });

    // 7. Sort by score desc, featured desc, name asc
    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.product.isFeatured !== a.product.isFeatured) return b.product.isFeatured ? 1 : -1;
      return a.product.name.localeCompare(b.product.name);
    });

    // Top 3
    const topDrinks = scoredProducts.slice(0, 3);

    // 8. Find a Snack Cross-Sell
    const snacks = await this.prisma.product.findMany({
      where: {
        status: 'active',
        isAvailable: true,
        category: { slug: 'snack' }
      },
      include: { category: true }
    });

    // Simple scoring for snacks (prefer featured)
    let snackRec: any = null;
    if (snacks.length > 0) {
      snacks.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      snackRec = snacks[0];
    }

    // 9. Create DB session and events atomically
    return this.prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.aiQuizSession.create({
        data: {
          userId,
          inputMode: 'quiz',
          needAnswer: dto.needAnswer,
          flavorAnswer: dto.flavorAnswer,
          drinkTypeAnswer: dto.drinkTypeAnswer,
          budgetAnswer: dto.budgetAnswer,
          recommendationsShown: topDrinks.length + (snackRec ? 1 : 0),
          completedAt: new Date(), // completed immediately for rules-based
        }
      });

      // Insert drink recommendations
      const recommendationsResult: any[] = [];
      let currentRank = 1;

      for (const item of topDrinks) {
        const event = await tx.aiRecommendationEvent.create({
          data: {
            sessionId: session.id,
            productId: item.product.id,
            rankPosition: currentRank++,
            matchScore: item.score,
            aiReasonText: this.buildAiReasonText(item.product.name, dto),
          }
        });
        recommendationsResult.push(this.mapDrinkResponse(event, item.product, item.score, dto));
      }

      // Insert snack recommendation
      let snackResult: any = null;
      if (snackRec) {
        const snackEvent = await tx.aiRecommendationEvent.create({
          data: {
            sessionId: session.id,
            productId: snackRec.id,
            rankPosition: currentRank,
            matchScore: 80, // arbitrary high score for cross-sell
            aiReasonText: 'Pairs nicely with your drink pick.',
          }
        });
        snackResult = this.mapSnackResponse(snackEvent, snackRec);
      }

      return {
        sessionId: session.id,
        inputMode: session.inputMode,
        recommendations: recommendationsResult,
        snackCrossSell: snackResult,
      };
    });
  }

  async addToCart(userId: string, eventId: string, dto: AddRecommendationToCartDto) {
    const event = await this.prisma.aiRecommendationEvent.findUnique({
      where: { id: eventId },
      include: { session: true, product: true }
    });

    if (!event) {
      throw new NotFoundException({
        code: 'RECOMMENDATION_EVENT_NOT_FOUND',
        message: 'Recommendation event not found.'
      });
    }

    if (event.session.userId && event.session.userId !== userId) {
      throw new ForbiddenException({
        code: AppErrorCodes.FORBIDDEN,
        message: 'You are not allowed to add this recommendation to your cart.'
      });
    }

    if (event.product.status !== 'active' || !event.product.isAvailable) {
      throw new BadRequestException({
        code: AppErrorCodes.PRODUCT_UNAVAILABLE,
        message: 'Product is no longer available.'
      });
    }

    let variantId = dto.variantId;
    if (!variantId) {
      // Find default variant if exists
      const defaultVariant = await this.prisma.productVariant.findFirst({
        where: { productId: event.product.id, isDefault: true, isAvailable: true }
      });
      if (defaultVariant) variantId = defaultVariant.id;
    }

    // Add to cart
    const cart = await this.cartService.addItem(userId, {
      productId: event.product.id,
      variantId,
      quantity: dto.quantity || 1,
      specialInstructions: dto.specialInstructions,
    });

    // Update tracking
    if (!event.wasAddedToCart) {
      await this.prisma.$transaction([
        this.prisma.aiRecommendationEvent.update({
          where: { id: event.id },
          data: { wasAddedToCart: true }
        }),
        this.prisma.aiQuizSession.update({
          where: { id: event.sessionId },
          data: { recommendationsAddedToCart: { increment: 1 } }
        })
      ]);
    }

    return cart;
  }

  async completeSession(userId: string | null, sessionId: string) {
    const session = await this.prisma.aiQuizSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException({
        code: 'COFFEE_MATCH_SESSION_NOT_FOUND',
        message: 'Session not found.'
      });
    }

    if (session.userId && session.userId !== userId) {
      throw new ForbiddenException({
        code: AppErrorCodes.FORBIDDEN,
        message: 'You are not allowed to modify this session.'
      });
    }

    if (!session.completedAt) {
      await this.prisma.aiQuizSession.update({
        where: { id: sessionId },
        data: { completedAt: new Date() }
      });
    }

    return {
      success: true,
      message: 'Session marked as completed.'
    };
  }

  // --- Helpers ---

  private filterByBudget(products: any[], budgetAnswer: string) {
    return products.filter(p => {
      const tier = p.productAiAttributes?.budgetTier;
      if (budgetAnswer === 'premium') return true; // premium user can afford anything
      if (budgetAnswer === 'regular') return tier === 'regular' || tier === 'budget';
      return tier === 'budget';
    });
  }

  private buildAiReasonText(productName: string, quiz: SubmitQuizDto) {
    const needStr = quiz.needAnswer.replace('_', ' ');
    return `Chosen because you wanted something ${quiz.flavorAnswer} for ${needStr}.`;
  }

  private mapDrinkResponse(event: any, product: any, score: number, quiz: SubmitQuizDto) {
    const defaultVariant = product.productVariants?.find(v => v.isDefault) || product.productVariants?.[0] || null;
    
    return {
      eventId: event.id,
      productId: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: Number(product.basePrice.toString()),
      matchScore: score,
      tasteDescriptor: `${product.productAiAttributes?.aiDescription || 'A great choice'}`,
      aiReasonText: event.aiReasonText,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      defaultVariant: defaultVariant ? {
        id: defaultVariant.id,
        name: defaultVariant.name,
        priceModifier: Number(defaultVariant.priceModifier.toString()),
      } : null,
      tags: product.productTags?.map(pt => pt.tag.name) || [],
    };
  }

  private mapSnackResponse(event: any, product: any) {
    return {
      eventId: event.id,
      productId: product.id,
      name: product.name,
      price: Number(product.basePrice.toString()),
      matchScore: 80,
      aiReasonText: event.aiReasonText,
    };
  }
}
