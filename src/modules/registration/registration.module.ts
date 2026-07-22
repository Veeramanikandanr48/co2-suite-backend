import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserAuthenticationDetails,
  UserDetails,
  UserEmailVerification,
} from 'src/entities/user.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { UserSession } from 'src/entities/user-session.entity';
import { UtilService } from 'src/utility/util/util.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/utility/email/email.service';
import { MultiFactorAuthenticationService } from 'src/utility/multi-factor-authentication/multi-factor-authentication.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserDetails,
      UserEmailVerification,
      UserAuthenticationDetails,
      UserRole,
      UserSession,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    AuthModule,
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
