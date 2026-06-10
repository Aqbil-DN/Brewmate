import { IsNotEmpty, IsString } from 'class-validator';

export class FirebaseLoginDto {
  @IsString({ message: 'idToken must be a string' })
  @IsNotEmpty({ message: 'idToken is required' })
  idToken!: string;
}
