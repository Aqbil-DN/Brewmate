import { IsEnum, IsNotEmpty } from 'class-validator';

export enum NeedAnswer {
  FOCUS = 'focus',
  CHILL = 'chill',
  REFRESHING = 'refreshing',
  SWEET_CRAVING = 'sweet_craving',
  STAY_AWAKE = 'stay_awake',
}

export enum FlavorAnswer {
  SWEET = 'sweet',
  CREAMY = 'creamy',
  STRONG = 'strong',
  CHOCOLATEY = 'chocolatey',
  FRESH = 'fresh',
}

export enum DrinkTypeAnswer {
  COFFEE = 'coffee',
  NON_COFFEE = 'non_coffee',
  SURPRISE_ME = 'surprise_me',
}

export enum BudgetAnswer {
  BUDGET = 'budget',
  REGULAR = 'regular',
  PREMIUM = 'premium',
}

export class SubmitQuizDto {
  @IsNotEmpty()
  @IsEnum(NeedAnswer)
  needAnswer: NeedAnswer;

  @IsNotEmpty()
  @IsEnum(FlavorAnswer)
  flavorAnswer: FlavorAnswer;

  @IsNotEmpty()
  @IsEnum(DrinkTypeAnswer)
  drinkTypeAnswer: DrinkTypeAnswer;

  @IsNotEmpty()
  @IsEnum(BudgetAnswer)
  budgetAnswer: BudgetAnswer;
}
