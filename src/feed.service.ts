import { Injectable, Logger } from '@nestjs/common';
import { CachedFeed, Entry, Feed } from './entities';
import FeedParser from 'feedparser';
import { Readable } from 'stream';
import { milliseconds } from 'date-fns';
import { FeedCacheService } from './feed-cache.service';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(private readonly feedCacheService: FeedCacheService) {}

  async getCachedEntries(feed: Feed): Promise<Entry[]> {
    const cached = await this.feedCacheService.getCachedFeed(feed);
    if (!cached) return [];
    return cached.entries;
  }

  async getEntries(feed: Feed): Promise<Entry[]> {
    const cached = await this.feedCacheService.getCachedFeed(feed);
    if (!cached) return await this.fetchEntries(feed);
    return cached.entries;
  }

  async fetchEntries(feed: Feed): Promise<Entry[]> {
    const { default: got } = await import('got');

    const { xmlUrl } = feed;
    this.logger.log(`Downloading feed ${feed.id} from ${xmlUrl}`);

    const content = await got(xmlUrl, {
      headers: { 'user-agent': 'Feedly/1.0' },
      timeout: {
        connect: milliseconds({ seconds: 3 }),
        request: milliseconds({ seconds: 90 }),
      },
      dnsLookupIpVersion: 4,
    }).text();

    const entries = await new Promise<Entry[]>((resolve, reject) => {
      const stream = Readable.from([content]);
      const parser = new FeedParser({});

      parser.on('error', reject);
      stream.pipe(parser);

      const entries: Entry[] = [];
      parser.on('readable', () => {
        let item: FeedParser.Item | null;
        while ((item = parser.read())) {
          entries.push(Entry.fromItem(item));
        }
      });

      parser.on('end', () => {
        resolve(entries);
      });
    });

    const cached = new CachedFeed();
    cached.lastModified = new Date().toISOString();
    cached.feed = feed;
    cached.entries = entries;

    this.logger.log(`Feed ${feed.id} downloaded`);

    await this.feedCacheService.cacheFeed(cached).catch((err) => {
      this.logger.error(err);
    });

    return cached.entries;
  }
}
