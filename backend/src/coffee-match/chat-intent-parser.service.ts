import { Injectable } from '@nestjs/common';
import {
  NeedAnswer,
  FlavorAnswer,
  DrinkTypeAnswer,
  BudgetAnswer,
} from './dto/submit-quiz.dto.js';

export interface ParsedIntent {
  needAnswer?: NeedAnswer;
  flavorAnswer?: FlavorAnswer;
  drinkTypeAnswer?: DrinkTypeAnswer;
  budgetAnswer?: BudgetAnswer;
  isOffTopic: boolean;
}

@Injectable()
export class ChatIntentParserService {
  parse(message: string): ParsedIntent {
    const lowerMessage = message.toLowerCase();

    // 1. Off-topic check
    // Simple negative matching for common off-topic prompts
    const offTopicKeywords = [
      'matematika',
      'presiden',
      'kode',
      'python',
      'javascript',
      'html',
      'cuaca',
      'berita',
      'tugas',
      'pr',
    ];
    const isOffTopic = offTopicKeywords.some((kw) => lowerMessage.includes(kw));

    if (isOffTopic) {
      return { isOffTopic: true };
    }

    const intent: ParsedIntent = {
      isOffTopic: false,
    };

    // 2. Parse Need
    if (
      this.containsAny(lowerMessage, [
        'ngantuk',
        'melek',
        'begadang',
        'caffeine',
        'kafein',
        'awake',
      ])
    ) {
      intent.needAnswer = NeedAnswer.STAY_AWAKE;
    } else if (
      this.containsAny(lowerMessage, [
        'fokus',
        'kerja',
        'belajar',
        'produktif',
        'meeting',
      ])
    ) {
      intent.needAnswer = NeedAnswer.FOCUS;
    } else if (
      this.containsAny(lowerMessage, [
        'seger',
        'segar',
        'haus',
        'dingin',
        'refresh',
        'panas',
      ])
    ) {
      intent.needAnswer = NeedAnswer.REFRESHING;
    } else if (
      this.containsAny(lowerMessage, ['santai', 'rileks', 'relax', 'nongkrong'])
    ) {
      intent.needAnswer = NeedAnswer.CHILL;
    } else if (
      this.containsAny(lowerMessage, ['manis', 'dessert', 'craving', 'gula'])
    ) {
      intent.needAnswer = NeedAnswer.SWEET_CRAVING;
    }

    // 3. Parse Flavor
    if (
      this.containsAny(lowerMessage, [
        'manis',
        'sweet',
        'gula',
        'palm sugar',
        'caramel',
      ])
    ) {
      intent.flavorAnswer = FlavorAnswer.SWEET;
    } else if (
      this.containsAny(lowerMessage, ['coklat', 'chocolate', 'choco'])
    ) {
      intent.flavorAnswer = FlavorAnswer.CHOCOLATEY;
    } else if (
      this.containsAny(lowerMessage, ['creamy', 'susu', 'milky', 'latte'])
    ) {
      intent.flavorAnswer = FlavorAnswer.CREAMY;
    } else if (
      this.containsAny(lowerMessage, [
        'strong',
        'bold',
        'pahit',
        'espresso',
        'americano',
      ])
    ) {
      intent.flavorAnswer = FlavorAnswer.STRONG;
    } else if (
      this.containsAny(lowerMessage, [
        'fresh',
        'fruity',
        'lemon',
        'strawberry',
        'segar',
      ])
    ) {
      intent.flavorAnswer = FlavorAnswer.FRESH;
    }

    // 4. Parse Drink Type
    if (
      this.containsAny(lowerMessage, [
        'non coffee',
        'non-kopi',
        'matcha',
        'coklat',
        'chocolate',
        'tea',
        'yakult',
      ])
    ) {
      intent.drinkTypeAnswer = DrinkTypeAnswer.NON_COFFEE;
    } else if (
      this.containsAny(lowerMessage, [
        'coffee',
        'kopi',
        'espresso',
        'americano',
        'latte',
        'cold brew',
      ])
    ) {
      intent.drinkTypeAnswer = DrinkTypeAnswer.COFFEE;
    } else if (
      this.containsAny(lowerMessage, [
        'terserah',
        'surprise',
        'bebas',
        'rekomendasiin',
      ])
    ) {
      intent.drinkTypeAnswer = DrinkTypeAnswer.SURPRISE_ME;
    }

    // 5. Parse Budget
    if (
      this.containsAny(lowerMessage, [
        'murah',
        'hemat',
        'budget',
        'under 35',
        'dibawah 35',
      ])
    ) {
      intent.budgetAnswer = BudgetAnswer.BUDGET;
    } else if (
      this.containsAny(lowerMessage, ['premium', 'mahal', 'treat', 'spesial'])
    ) {
      intent.budgetAnswer = BudgetAnswer.PREMIUM;
    } else if (
      this.containsAny(lowerMessage, ['regular', 'normal', 'sedang'])
    ) {
      intent.budgetAnswer = BudgetAnswer.REGULAR;
    }

    // Heuristics: if nothing matched but it's clearly asking for coffee/drink, it's not off-topic
    if (
      !intent.needAnswer &&
      !intent.flavorAnswer &&
      !intent.drinkTypeAnswer &&
      !intent.budgetAnswer &&
      !this.containsAny(lowerMessage, [
        'kopi',
        'minum',
        'haus',
        'pesan',
        'menu',
        'rekomendasi',
      ])
    ) {
      // Very short unclear messages might be off-topic, but let's allow basic greetings by default
      if (lowerMessage.length > 30) {
        // If it's a long message and no coffee keywords hit, might be off-topic
        // Let's rely on Groq to handle weird inputs gracefully if it slips through
      }
    }

    return intent;
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }
}
