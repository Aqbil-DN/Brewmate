import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

/**
 * Allowed Node environments.
 */
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Environment variable schema.
 *
 * Required variables will cause the app to fail fast on startup
 * if they are missing or invalid.
 *
 * Optional variables (XAI_API_KEY, XENDIT_SECRET_KEY) are marked
 * as optional for early development but will be required before
 * going to production.
 */
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required' })
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '7d';

  // ── Optional for early development ──────────────────────
  @IsString()
  @IsOptional()
  XAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  XAI_GROK_BASE_URL?: string;

  @IsString()
  @IsOptional()
  XENDIT_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  XENDIT_WEBHOOK_TOKEN?: string;

  // ── Firebase (optional for early development) ───────────
  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  FIREBASE_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  FIREBASE_CLIENT_EMAIL?: string;
}

/**
 * Validate environment variables at startup.
 *
 * Used by ConfigModule.forRoot({ validate }).
 * Throws a descriptive error listing all invalid/missing vars.
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'unknown error';
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(
      `\n\n❌ Environment validation failed:\n${errorMessages}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n` +
        `See .env.example for reference.\n`,
    );
  }

  return validatedConfig;
}
