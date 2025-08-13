import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { milliseconds } from 'date-fns';
import path from 'path';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get cacheTTLMs(): number {
    const ms = this.configService.get<string>('CACHE_TTL_MS', String(milliseconds({ hours: 1 })));
    return parseInt(ms, 10);
  }

  get dataPath(): string {
    const relativePath = this.configService.get<string>('DATA_PATH', 'data');
    return path.resolve(relativePath);
  }

  get opmlPath(): string {
    const relativePath = this.configService.get<string>('OPML_PATH', 'feeds.opml');
    return path.join(this.dataPath, relativePath);
  }
}
