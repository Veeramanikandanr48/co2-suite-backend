import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserManagementDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  userName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  roleId?: number;

  @ApiProperty({ required: false, type: [Number], example: [2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  additionalRoleIds?: number[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = true;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isTwoFactorAuthenticationEnabled?: boolean = false;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  sendWelcomeEmail?: boolean = false;

  @ApiProperty({ required: false, description: 'Organization ID if creating an organization user' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class UpdateUserManagementDto {
  @ApiProperty({ required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  userName?: string;

  @ApiProperty({ required: false, example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isTwoFactorAuthenticationEnabled?: boolean;

  @ApiProperty({ required: false, type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];

  @ApiProperty({ required: false, description: 'Organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class UserQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Search name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['active', 'inactive', 'all'], default: 'all' })
  @IsOptional()
  @IsString()
  status?: string = 'all';

  @ApiProperty({ required: false, enum: ['root', 'organization', 'all'], default: 'root' })
  @IsOptional()
  @IsString()
  scope?: string = 'root';

  @ApiProperty({ required: false, description: 'Filter by Organization ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class ResetUserPasswordDto {
  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
