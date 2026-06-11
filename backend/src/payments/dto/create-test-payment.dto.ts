import { IsNumber, IsEmail, Min } from 'class-validator';

export class CreateTestPaymentDto {
  @IsNumber()
  @Min(10000)
  amount!: number;

  @IsEmail()
  email!: string;
}
