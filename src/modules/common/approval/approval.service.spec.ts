import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalService } from './approval.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ApprovalMatrix,
  ApprovalModules,
  UserApproval,
  UserApprovalRemarksMapping,
} from 'src/entities/approval.entity';

describe('ApprovalService', () => {
  let service: ApprovalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: DataSource, useValue: {} },
        {
          provide: getRepositoryToken(ApprovalModules),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserApproval),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(ApprovalMatrix),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserApprovalRemarksMapping),
          useValue: { save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
