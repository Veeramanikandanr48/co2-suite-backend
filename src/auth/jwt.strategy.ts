import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserDetails,
  UserAuthenticationDetails,
} from 'src/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserDetails)
    private readonly userRepository: Repository<UserDetails>,
    @InjectRepository(UserAuthenticationDetails)
    private readonly userAuthenticationDetailsRepository: Repository<UserAuthenticationDetails>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(_req: Request, payload: IDecodeUserDetails) {
    if (!payload?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.isActive'])
      .where('user.id = :id', { id: payload.id })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const authDetail = await this.userAuthenticationDetailsRepository
      .createQueryBuilder('auth')
      .select(['auth.userId', 'auth.isBlocked'])
      .where('auth.userId = :id', { id: payload.id })
      .andWhere('auth.isActive = :isActive', { isActive: true })
      .getRawOne<{ userId: number; isBlocked: boolean }>();

    if (authDetail?.isBlocked) {
      throw new UnauthorizedException('User is blocked');
    }

    return payload;
  }
}
