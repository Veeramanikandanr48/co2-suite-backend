import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationService } from './registration.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UserAuthenticationDetails,
  UserDetails,
  UserEmailVerification,
} from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/utility/email/email.service';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { ConfigService } from '@nestjs/config';
import { UtilService } from 'src/utility/util/util.service';

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: getRepositoryToken(UserDetails),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserEmailVerification),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(UserAuthenticationDetails),
          useValue: { createQueryBuilder: jest.fn() },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
        {
          provide: MultiFactorAuthenticationService,
          useValue: {
            verifyTOTP: jest.fn(),
            saveMfaRecord: jest.fn(),
            getOtpSecretById: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: UtilService,
          useValue: {
            createLogger: jest.fn().mockReturnValue({
              info: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
