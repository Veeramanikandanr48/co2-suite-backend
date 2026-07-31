import { Test, TestingModule } from '@nestjs/testing';
import { MastersController } from './masters.controller';
import { MastersService } from './masters.service';
import { UtilService } from 'src/utility/util/util.service';

describe('MastersController', () => {
  let controller: MastersController;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MastersController],
      providers: [
        { provide: MastersService, useValue: {} },
        { provide: UtilService, useValue: mockUtilService },
      ],
    }).compile();

    controller = module.get<MastersController>(MastersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
