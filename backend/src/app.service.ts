import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Returns server health information.
   */
  getHealth() {
    return {
      status: 'ok',
      service: 'brewmate-ai-backend',
      version: '0.0.1',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
