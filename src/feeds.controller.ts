import { Controller, Get, Header } from '@nestjs/common';
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

  @Get('export_opml')
  @ApiOperation({ summary: 'Export feeds as OPML file' })
  @ApiOkResponse({
    type: String,
    content: {
      'application/xml': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename="feeds.opml"')
  exportOpml(): string {
    return this.opmlService.exportOPML();
  }
}
