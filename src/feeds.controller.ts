import { Controller, Get, Header, Logger, NotFoundException, Param, Post } from '@nestjs/common';
import { OpmlService } from './opml.service';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Entry, Feed } from './entities';
import { FeedService } from './feed.service';

@Controller({ version: '1', path: 'feeds' })
export class FeedsController {
  private readonly logger = new Logger(FeedsController.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly opmlService: OpmlService,
  ) {}

  @Get('')
  @ApiOperation({ summary: 'Get feeds' })
  @ApiOkResponse({ description: 'List of all feeds', type: Feed, isArray: true })
  getFeeds(): Feed[] {
    return Array.from(this.opmlService.feedMap.values());
  }

  @Get('export_opml')
  @ApiOperation({ summary: 'Export feeds as OPML file' })
  @ApiOkResponse({
    description: 'OPML file containing all feeds',
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

  @Get(':id/entries')
  @ApiOperation({ summary: 'Get entries from a specific feed' })
  @ApiOkResponse({ description: 'List of entries for the specified feed', type: Entry, isArray: true })
  async getFeedEntries(@Param('id') id: string): Promise<Entry[]> {
    const feed = this.findFeed(id);
    if (!feed) throw new NotFoundException(`Feed with id ${id} not found`);
    return await this.feedService.getEntries(feed);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh entries for a specific feed' })
  @ApiCreatedResponse({ description: 'Entries refreshed successfully', type: Object })
  async refreshFeed(@Param('id') id: string): Promise<Entry[]> {
    const feed = this.findFeed(id);
    if (!feed) throw new NotFoundException(`Feed with id ${id} not found`);
    return await this.feedService.getEntries(feed);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh entries for all feeds' })
  @ApiCreatedResponse({ description: 'Entries refreshed successfully', type: Object })
  async refreshFeeds() {
    const feeds = Array.from(this.opmlService.feedMap.values());
    const settled = await Promise.allSettled(feeds.map((feed) => this.feedService.getEntries(feed)));
    for (let i = 0; i < feeds.length; i += 1) {
      const feed = feeds[i];
      const result = settled[i];
      if (result.status === 'rejected') {
        this.logger.error(`Failed to refresh feed ${feed.id} ${feed.xmlUrl}: ${result.reason}`);
      }
    }
    return {};
  }

  private findFeed(id: string): Feed | undefined {
    return this.opmlService.feedMap.get(id);
  }
}
