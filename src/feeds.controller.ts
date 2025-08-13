import { Controller, Get } from '@nestjs/common';
import { OpmlService } from './opml.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Category } from './entities';

@Controller({ version: '1' })
export class FeedsController {
  constructor(private readonly opmlService: OpmlService) {}

  @Get('feeds')
  @ApiOperation({ summary: 'Get feeds' })
  @ApiOkResponse({ type: Category, isArray: true })
  feeds(): Category[] {
    return this.opmlService.categories;
  }
}
