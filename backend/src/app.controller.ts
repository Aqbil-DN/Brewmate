import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /api/v1/health
   *
   * Health check endpoint. Returns server status, uptime,
   * and current timestamp.
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
