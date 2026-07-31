import { Test, TestingModule } from '@nestjs/testing';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserDetails } from 'src/entities/user.entity';

describe('MultiFactorAuthenticationService', () => {
  let service: MultiFactorAuthenticationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiFactorAuthenticationService,
        {
          provide: getRepositoryToken(UserDetails),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MultiFactorAuthenticationService>(
      MultiFactorAuthenticationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
