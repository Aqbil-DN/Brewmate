import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ChatDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  message: string;
}
