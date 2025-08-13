import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import FeedParser from 'feedparser';
import sanitize from 'sanitize-html';

export class Entry {
  @ApiProperty({ description: 'Entry GUID' })
  guid!: string;

  @ApiProperty({ description: 'Entry title' })
  title!: string;

  @ApiProperty({ description: 'Entry link' })
  link!: string;

  @ApiPropertyOptional({ description: 'Entry description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Entry publication date' })
  pubDate: Date | null;

  static fromItem(item: FeedParser.Item): Entry {
    return {
      guid: item.guid,
      title: item.title,
      link: item.link,
      description: sanitize(item.description),
      pubDate: item.pubdate,
    };
  }
}

export class Feed {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Feed title' })
  title!: string;

  @ApiProperty({ description: 'XML URL of the feed' })
  xmlUrl!: string;

  @ApiPropertyOptional({ description: 'HTML URL of the feed' })
  htmlUrl?: string;
}

export class CachedFeed {
  lastModified: string;
  feed: Feed;
  entries: Entry[];

  merge(entries: Entry[]) {
    const guids = new Set(this.entries.map((e) => e.guid));
    for (const entry of entries) {
      if (guids.has(entry.guid)) continue;
      this.entries.push(entry);
    }
  }
}

export class Category {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Category name' })
  name!: string;

  @ApiProperty({
    description: 'List of feeds in the category',
    type: Feed,
    isArray: true,
  })
  feeds: Feed[];
}
