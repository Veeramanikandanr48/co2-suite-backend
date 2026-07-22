import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth/auth.service';
import { RolePermission } from 'src/entities/role-permission.entity';
import { UserSession } from 'src/entities/user-session.entity';
import { UserRole } from 'src/entities/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RolePermission, UserSession, UserRole]),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
