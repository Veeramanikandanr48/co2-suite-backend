import { Test, TestingModule } from '@nestjs/testing';
import { MastersService } from './masters.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MasterApprovalStatus, MasterRoles } from 'src/entities/master.entity';

describe('MastersService', () => {
  let service: MastersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MastersService,
        {
          provide: getRepositoryToken(MasterRoles),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(MasterApprovalStatus),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MastersService>(MastersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
