import { Injectable, Logger } from '@nestjs/common';
import { CachedFeed, Entry, Feed } from './entities';
import FeedParser from 'feedparser';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import { AppConfigService } from './app-config.service';
import { milliseconds } from 'date-fns';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  cachedFeedPath(feed: Feed): string {
    return path.join(this.appConfigService.dataPath, `${feed.id}.json`);
  }

  async getCachedEntries(feed: Feed): Promise<Entry[]> {
    const now = new Date();
    const cachedPath = this.cachedFeedPath(feed);
    const content = await fs.readFile(cachedPath, 'utf8').catch(() => null);
    if (content) {
      const parsed = JSON.parse(content) as CachedFeed;
      this.logger.log(`Found cached feed ${feed.id}, last modified at ${parsed.lastModified}`);
      if (this.isCacheFresh(now, parsed)) return parsed.entries;
    }
    return [];
  }

  async getEntries(feed: Feed): Promise<Entry[]> {
    const now = new Date();
    const cachedPath = this.cachedFeedPath(feed);
    const content = await fs.readFile(cachedPath, 'utf8').catch(() => null);
    if (content) {
      const parsed = JSON.parse(content) as CachedFeed;
      this.logger.log(`Found cached feed ${feed.id}, last modified at ${parsed.lastModified}`);
      if (this.isCacheFresh(now, parsed)) return parsed.entries;
    }
    this.logger.log(`Cache miss for feed ${feed.id}`);
    return await this.fetchEntries(feed);
  }

  async fetchEntries(feed: Feed): Promise<Entry[]> {
    const { default: got } = await import('got');

    const { xmlUrl } = feed;
    this.logger.log(`Downloading feed ${feed.id} from ${xmlUrl}`);

    const content = await got(xmlUrl, {
      headers: { 'user-agent': 'Feedly/1.0' },
      timeout: { request: milliseconds({ seconds: 90 }) },
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

    await this.updateCache(cached).catch((err) => {
      this.logger.error(err);
    });

    return cached.entries;
  }

  isCacheFresh(now: Date, cached: CachedFeed): boolean {
    const lastModified = new Date(cached.lastModified).valueOf();
    return now.valueOf() - lastModified < this.appConfigService.cacheTTLMs;
  }

  async updateCache(cached: CachedFeed) {
    const cachedPath = this.cachedFeedPath(cached.feed);
    await fs.writeFile(cachedPath, JSON.stringify(cached));
  }
}
