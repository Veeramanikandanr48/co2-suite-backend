import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserAuthenticationDetails,
  UserDetails,
  UserEmailVerification,
} from 'src/entities/user.entity';
import { UtilService } from 'src/utility/util/util.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/utility/email/email.service';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserDetails,
      UserEmailVerification,
      UserAuthenticationDetails,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '5h' },
      }),
    }),
  ],
  controllers: [RegistrationController],
  providers: [
    RegistrationService,
    UtilService,
    ConfigService,
    EmailService,
    MultiFactorAuthenticationService,
    JwtStrategy,
  ],
})
export class RegistrationModule {}
