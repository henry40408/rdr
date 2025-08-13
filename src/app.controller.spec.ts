import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { TerminusModule } from '@nestjs/terminus';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule.forRoot()],
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health check status', async () => {
      await expect(appController.healthz()).resolves.toEqual({
        details: {},
        error: {},
        info: {},
        status: 'ok',
      });
    });
  });
});
