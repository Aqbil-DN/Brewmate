import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase Google Auth ID Token' })
  @IsString({ message: 'idToken must be a string' })
  @IsNotEmpty({ message: 'idToken is required' })
  idToken!: string;
}
