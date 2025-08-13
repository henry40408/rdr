import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { OpmlService } from './opml.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Category, Entry, Feed } from './entities';
import { FeedService } from './feed.service';

@Controller({ version: '1' })
export class FeedsController {
  constructor(
    private readonly feedService: FeedService,
    private readonly opmlService: OpmlService,
  ) {}

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

  @Post(':id/download')
  @ApiOperation({ summary: 'Download a specific feed' })
  @ApiCreatedResponse({ type: Entry, isArray: true })
  async downloadFeed(@Param('id') id: string): Promise<Entry[]> {
    const feed = this.findFeed(id);
    if (!feed) throw new NotFoundException(`Feed with id ${id} not found`);
    return await this.feedService.downloadCachedFeed(feed);
  }

  private findFeed(id: string): Feed | undefined {
    return this.opmlService.feedMap.get(id);
  }
}
