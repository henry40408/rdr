import { Injectable, Logger } from '@nestjs/common';
import { Entry, Feed } from './entities';
import FeedParser from 'feedparser';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import fs from 'fs/promises';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  private readonly dataPath: string;

  constructor(private readonly configService: ConfigService) {
    const opmlFilePath = this.configService.get<string>(
      'OPML_FILE_PATH',
      'data/feeds.opml',
    );
    this.dataPath = path.dirname(path.resolve(opmlFilePath));
  }

  async downloadCachedFeed(feed: Feed): Promise<Entry[]> {
    const cachedPath = this.cachedPath(feed);
    const existing = await fs
      .access(cachedPath)
      .then(() => true)
      .catch(() => false);
    if (existing) {
      this.logger.log(`Found cached feed ${feed.id}`);
      const cached = await fs.readFile(cachedPath, 'utf-8');
      return JSON.parse(cached) as Entry[];
    }
    return await this.downloadFeed(feed);
  }

  async downloadFeed(feed: Feed): Promise<Entry[]> {
    const { default: got } = await import('got');

    const { xmlUrl } = feed;
    this.logger.log(`Downloading feed ${feed.id} from ${xmlUrl}`);

    const content = await got(xmlUrl).text();

    const resolved = await new Promise<Entry[]>((resolve, reject) => {
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

    this.cacheFeed(feed, resolved).catch((err) => {
      this.logger.error('Error caching feed:', err);
    });

    return resolved;
  }

  private cachedPath(feed: Feed): string {
    return path.join(this.dataPath, `${feed.id}.json`);
  }

  private async cacheFeed(feed: Feed, entries: Entry[]): Promise<void> {
    const cachedPath = this.cachedPath(feed);
    await fs.writeFile(cachedPath, JSON.stringify(entries));
    this.logger.log(`Cached feed ${feed.id} to ${cachedPath}`);
  }
}
