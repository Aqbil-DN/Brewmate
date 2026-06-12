import { Injectable } from '@nestjs/common';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';

export interface ScoreProductContext {
  productAiAttributes: any;
  productIsFeatured: boolean;
  quiz: SubmitQuizDto;
}

@Injectable()
export class RecommendationScoringService {
  /**
   * Calculate a score between 0 and 100 for a given product based on user preferences.
   */
  scoreProduct(ctx: ScoreProductContext): number {
    const { productAiAttributes: attr, productIsFeatured, quiz } = ctx;
    let score = 0;

    // 1. Need Tag Overlap: +30
    // Check if the product's needTags contains the user's needAnswer
    if (attr.needTags && attr.needTags.includes(quiz.needAnswer)) {
      score += 30;
    }

    // 2. Flavor Tag Overlap: +25
    if (attr.flavorTags && attr.flavorTags.includes(quiz.flavorAnswer)) {
      score += 25;
    }

    // 3. Drink Type Match
    if (quiz.drinkTypeAnswer === 'surprise_me') {
      // surprise_me accepts anything, give neutral bonus
      score += 10;
    } else if (attr.drinkType === quiz.drinkTypeAnswer) {
      // Exact match: +15
      score += 15;
    } else if (attr.drinkType === 'both') {
      // Flexible match: +10
      score += 10;
    }

    // 4. Budget Match
    if (attr.budgetTier === quiz.budgetAnswer) {
      // Exact match: +15
      score += 15;
    } else {
      // Compatible but not exact: +8
      // Based on MVP logic:
      // user wants regular, product is budget -> compatible
      // user wants premium, product is regular/budget -> compatible
      if (
        (quiz.budgetAnswer === 'regular' && attr.budgetTier === 'budget') ||
        (quiz.budgetAnswer === 'premium' &&
          (attr.budgetTier === 'regular' || attr.budgetTier === 'budget'))
      ) {
        score += 8;
      }
    }

    // 5. Featured Bonus
    if (productIsFeatured) {
      score += 5;
    }

    // 6. Specific Pairings Bonus
    // stay_awake + caffeineLevel >= 7: +5
    if (quiz.needAnswer === 'stay_awake' && attr.caffeineLevel >= 7) score += 5;

    // focus + caffeineLevel >= 6: +4
    if (quiz.needAnswer === 'focus' && attr.caffeineLevel >= 6) score += 4;

    // sweet_craving + sweetnessLevel >= 7: +5
    if (quiz.needAnswer === 'sweet_craving' && attr.sweetnessLevel >= 7)
      score += 5;

    // flavor strong + strengthLevel >= 7: +5
    if (quiz.flavorAnswer === 'strong' && attr.strengthLevel >= 7) score += 5;

    // flavor creamy + sweetnessLevel between 3 and 8: +3
    if (
      quiz.flavorAnswer === 'creamy' &&
      attr.sweetnessLevel >= 3 &&
      attr.sweetnessLevel <= 8
    )
      score += 3;

    // flavor fresh + sweetnessLevel <= 5: +3
    if (quiz.flavorAnswer === 'fresh' && attr.sweetnessLevel <= 5) score += 3;

    // Normalize score to maximum of 100
    return Math.min(score, 100);
  }
}
