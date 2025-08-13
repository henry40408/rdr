import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs/promises';
import { parseStringPromise } from 'xml2js';
import { Category, Feed } from './entities';

export interface OpmlOutlineFeed {
  $: {
    text: string;
    title?: string;
    xmlUrl?: string;
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

  private categories: Category[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onApplicationBootstrap() {
    const opmlFilePath = this.configService.get<string>(
      'OPML_FILE_PATH',
      'data/feeds.opml',
    );
    const opmlContent = await fs.readFile(opmlFilePath, 'utf-8');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const parsed: OpmlParsed = await parseStringPromise(opmlContent);

    const body = parsed.opml.body[0];
    for (const category of body.outline) {
      if (!category.outline) continue;
      const feeds: Feed[] = [];
      const cCategory = category.$;
      for (const feed of category.outline) {
        const fOutline = feed.$;
        feeds.push({ title: fOutline.title || fOutline.text });
      }
      this.categories.push({ name: cCategory.text, feeds });
    }

    this.logger.log(
      `Loaded ${this.categories.length} categories from OPML file.`,
    );
  }
}
