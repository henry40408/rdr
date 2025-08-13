import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Entry } from './entities';
import { FeedService } from './feed.service';
import { OpmlService } from './opml.service';

@Controller({ version: '1', path: 'entries' })
export class EntriesController {
  constructor(
    private readonly feedService: FeedService,
    private readonly opmlService: OpmlService,
  ) {}

  @Get('')
  @ApiOperation({ summary: 'Get entries' })
  @ApiOkResponse({ description: 'List of all entries', type: Entry, isArray: true })
  async getEntries(): Promise<Entry[]> {
    const feeds = Array.from(this.opmlService.feedMap.values());
    const allFeedEntries = await Promise.all(feeds.map((feed) => this.feedService.getCachedEntries(feed)));
    const entries: Entry[] = [];
    for (const feedEntries of allFeedEntries) {
      for (const feedEntry of feedEntries) {
        entries.push(feedEntry);
      }
    }
    return entries;
  }
}
