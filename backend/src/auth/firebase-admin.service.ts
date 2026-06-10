import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

/**
 * Wraps firebase-admin SDK initialisation and token verification.
 *
 * Initialised once at module bootstrap using credential.cert
 * with values from environment variables.
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (getApps().length > 0) {
      this.logger.log(
        'Firebase Admin already initialised, reusing existing app',
      );
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase Admin credentials not configured — Google Sign-In will not work. ' +
          'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env',
      );
      return;
    }

    // Convert escaped newlines (\\n) in private key to real newlines
    const normalizedPrivateKey = privateKey.replace(/\\n/g, '\n');

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizedPrivateKey,
      }),
    });

    this.logger.log(`Firebase Admin initialised for project: ${projectId}`);
  }

  /**
   * Verify a Firebase ID token and return the decoded payload.
   *
   * Throws if the token is invalid, expired, or Firebase is not configured.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (getApps().length === 0) {
      throw new Error('Firebase Admin is not initialised');
    }
    return getAuth().verifyIdToken(idToken);
  }
}
