import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : null))
  emailId: string;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : value))
  @MaxLength(70)
  password: string;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : value))
  @MaxLength(70)
  userName: string;
}

export class GoogleLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  accessToken: string;
}

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  userName: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : null))
  emailId: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  @MaxLength(70)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  roleId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class ForgotPasswordDto {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : null))
  emailId: string;
}

export class ResetPasswordDto {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  password: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  confirmPassword: string;
}

export class VerifyMFADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  secret: string;
}

export class ValidateMFADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  code: string;
}

export class EnableMFADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  secret: string;
}

export class ResetMFADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  newCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  newSecret: string;
}

export class UpdateUserDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim() : value))
  userName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  profileImageKey?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  newPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  confirmPassword: string;
}

export class BackupCodeRecoveryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  code: string;
}

export class CheckCurrentPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  currentPassword: string;
}
export class UserEmailVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  email: string;
}
export class UserOtpVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : null))
  otp: string;
}
