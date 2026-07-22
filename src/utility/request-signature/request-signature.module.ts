import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionSigningKeyService } from './session-signing-key.service';
import { RequestSignatureMiddleware } from './request-signature.middleware';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET,
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [SessionSigningKeyService, RequestSignatureMiddleware],
  exports: [SessionSigningKeyService, RequestSignatureMiddleware, JwtModule],
})
export class RequestSignatureModule {}
