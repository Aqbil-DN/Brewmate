import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Fallback to DATABASE_URL_TEST if DATABASE_URL is somehow missing or we want to be safe
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// Fallback values for required test variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.XENDIT_WEBHOOK_TOKEN =
  process.env.XENDIT_WEBHOOK_TOKEN || 'xnd_test_webhook_token';

// Suppress console.log and console.error during tests for cleaner output unless DEBUG is true
if (!process.env.DEBUG) {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  // We keep error for debugging
  // jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
}
