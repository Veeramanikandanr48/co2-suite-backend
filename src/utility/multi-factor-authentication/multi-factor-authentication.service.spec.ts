import { Test, TestingModule } from '@nestjs/testing';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';

describe('MultiFactorAuthenticationService', () => {
  let service: MultiFactorAuthenticationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MultiFactorAuthenticationService],
    }).compile();

    service = module.get<MultiFactorAuthenticationService>(
      MultiFactorAuthenticationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
