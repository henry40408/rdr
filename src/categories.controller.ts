import { Controller, Get } from '@nestjs/common';
import { OpmlService } from './opml.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Category } from './entities';

@Controller({ version: '1', path: 'categories' })
export class CategoriesController {
  constructor(private readonly opmlService: OpmlService) {}

  @Get('')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({ description: 'List of all categories', type: Category, isArray: true })
  getCategories() {
    return this.opmlService.categories;
  }
}
