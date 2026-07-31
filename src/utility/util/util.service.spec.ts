import { Test, TestingModule } from '@nestjs/testing';
import { UtilService } from './util.service';
import { DataSource } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('UtilService', () => {
  let service: UtilService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilService,
        { provide: DataSource, useValue: {} },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UtilService>(UtilService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
