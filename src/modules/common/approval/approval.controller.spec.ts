import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { UtilService } from 'src/utility/util/util.service';

describe('ApprovalController', () => {
  let controller: ApprovalController;

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
      controllers: [ApprovalController],
      providers: [
        { provide: ApprovalService, useValue: {} },
        { provide: UtilService, useValue: mockUtilService },
      ],
    }).compile();

    controller = module.get<ApprovalController>(ApprovalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
