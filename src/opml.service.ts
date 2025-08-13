import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs/promises';
import { Builder, parseStringPromise } from 'xml2js';
import { Category, Feed } from './entities';
import { createHash } from 'crypto';

export interface OpmlOutlineFeed {
  $: {
    text: string;
    xmlUrl: string;
    title?: string;
    htmlUrl?: string;
    type?: string;
  };
}

export interface OpmlOutlineCategory {
  $: {
    text: string;
  };
  outline?: OpmlOutlineFeed[];
}

export interface OpmlBody {
  outline: OpmlOutlineCategory[];
}

export interface OpmlParsed {
  opml: {
    body: OpmlBody[];
  };
}

@Injectable()
export class OpmlService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OpmlService.name);

  private _categories: Category[] = [];
  private _feedMap: Map<string, Feed> = new Map();

  constructor(private readonly configService: ConfigService) {}

  get categories() {
    return this._categories;
  }

  get feedMap() {
    return this._feedMap;
  }

  async onApplicationBootstrap() {
    const opmlFilePath = this.configService.get<string>(
      'OPML_FILE_PATH',
      'data/feeds.opml',
    );
    const opmlContent = await fs.readFile(opmlFilePath, 'utf-8');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed: OpmlParsed = await parseStringPromise(opmlContent);

    const body = parsed.opml.body[0];
    for (const cOutline of body.outline) {
      if (!cOutline.outline) continue;
      const feeds: Feed[] = [];
      for (const fOutline of cOutline.outline) {
        const id = this.hash(fOutline.$.xmlUrl);
        const feed = {
          id,
          htmlUrl: fOutline.$.htmlUrl,
          title: fOutline.$.title || fOutline.$.text,
          xmlUrl: fOutline.$.xmlUrl,
        };
        feeds.push(feed);
        this._feedMap.set(id, feed);
      }
      this._categories.push({
        id: this.hash(cOutline.$.text),
        name: cOutline.$.text,
        feeds,
      });
    }

    this.logger.log(
      `Loaded ${this.categories.length} categories from OPML file.`,
    );
  }

  exportOPML(): string {
    const now = new Date();
    const obj = {
      opml: {
        $: { version: '2.0' },
        head: [
          {
            title: ['rdr'],
            dateCreated: [now.toUTCString()],
          },
        ],
        body: this.categories.map((category) => ({
          $: { text: category.name },
          outline: category.feeds.map((feed) => ({
            $: {
              title: feed.title,
              text: feed.title,
              xmlUrl: feed.xmlUrl,
              htmlUrl: feed.htmlUrl,
              type: 'rss',
            },
          })),
        })),
      },
    };
    const builder = new Builder();
    return builder.buildObject(obj);
  }

  hash(data: string): string {
    const hasher = createHash('shake256', { outputLength: 4 });
    hasher.update(data);
    return hasher.digest('hex');
  }
}
