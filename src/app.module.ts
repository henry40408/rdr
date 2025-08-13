import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { OpmlService } from './opml.service';
import { ConfigModule } from '@nestjs/config';
import { FeedsController } from './feeds.controller';
import { TerminusModule } from '@nestjs/terminus';
import { FeedService } from './feed.service';
import { AppConfigService } from './app-config.service';
import { EntriesController } from './entries.controller';
import { CategoriesController } from './categories.controller';
import { FeedCacheService } from './feed-cache.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TerminusModule.forRoot()],
  controllers: [AppController, CategoriesController, EntriesController, FeedsController],
  providers: [AppConfigService, FeedService, FeedCacheService, OpmlService],
})
export class AppModule {}
