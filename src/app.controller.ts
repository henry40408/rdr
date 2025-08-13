import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller({ version: '' })
export class AppController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('healthz')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  healthz() {
    return this.health.check([]);
  }
}
