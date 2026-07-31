import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UtilService } from './utility/util/util.service';

describe('AppController', () => {
  let appController: AppController;

  const mockUtilService = {
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }),
    sendSuccessResponse: jest.fn(),
    sendErrorResponse: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: UtilService, useValue: mockUtilService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should respond with service running message', async () => {
      const mockReq = {} as unknown as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;
      await appController.getHello(mockReq, mockRes);
      expect(mockUtilService.sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Service is running',
        'Hello World!',
      );
    });
  });
});
