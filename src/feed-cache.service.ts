import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { CachedFeed, Entry, Feed } from './entities';
import { MutexMap } from './mutex-map';
import path from 'path';
import fs from 'fs/promises';

@Injectable()
export class FeedCacheService {
  private readonly logger = new Logger(FeedCacheService.name);
  private readonly mutexMap = new MutexMap();

  constructor(private readonly appConfigService: AppConfigService) {}

  cachedFeedPath(feed: Feed): string {
    return path.join(this.appConfigService.dataPath, `${feed.id}.json`);
  }

  async cacheFeed(cached: CachedFeed) {
    const release = await this.mutexMap.acquire(cached.feed.id);
    try {
      const cachedFeedPath = this.cachedFeedPath(cached.feed);
      const content = await fs.readFile(cachedFeedPath, 'utf-8').catch(() => null);

      let existingEntries: Entry[] = [];
      if (content) {
        const parsed = JSON.parse(content) as CachedFeed;
        existingEntries = parsed.entries;
      }
      cached.merge(existingEntries);

      await fs.writeFile(cachedFeedPath, JSON.stringify(cached));
    } finally {
      release();
    }
  }

  async getCachedFeed(feed: Feed): Promise<CachedFeed | null> {
    const release = await this.mutexMap.acquire(feed.id);
    try {
      const cachedFeedPath = this.cachedFeedPath(feed);
      const content = await fs.readFile(cachedFeedPath, 'utf-8').catch(() => null);
      if (content) {
        this.logger.log(`Cache hit for feed ${feed.id}`);
        const parsed = JSON.parse(content) as CachedFeed;
        if (this.isCacheFresh(parsed)) return parsed;
      }
      this.logger.log(`Cache miss for feed ${feed.id}`);
      return null;
    } finally {
      release();
    }
  }

  isCacheFresh(cached: CachedFeed): boolean {
    const now = new Date();
    const lastModified = new Date(cached.lastModified).valueOf();
    return now.valueOf() - lastModified < this.appConfigService.cacheTTLMs;
  }
}
