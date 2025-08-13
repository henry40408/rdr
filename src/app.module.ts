import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { OpmlService } from './opml.service';
import { ConfigModule } from '@nestjs/config';
import { FeedsController } from './feeds.controller';
import { TerminusModule } from '@nestjs/terminus';
import { FeedService } from './feed.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TerminusModule.forRoot()],
  controllers: [AppController, FeedsController],
  providers: [FeedService, OpmlService],
})
export class AppModule {}
