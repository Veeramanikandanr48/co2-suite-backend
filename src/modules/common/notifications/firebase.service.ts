import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ServiceAccount,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit(): void {
    if (getApps().length > 0) {
      return;
    }
    try {
      const serviceAccountPath = path.join(
        process.cwd(),
        'firebase-admin-private-key.json',
      );
      const serviceAccount: ServiceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );
      initializeApp({
        credential: cert(serviceAccount),
      });
      this.logger.log('Firebase app initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', error);
    }
  }
}
