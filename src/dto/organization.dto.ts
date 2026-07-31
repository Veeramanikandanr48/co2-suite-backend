import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  name: string;

  @ApiProperty({ example: 'ACME' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  contactEmail: string;

  @ApiProperty({ example: 'acme.com', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  emailDomain?: string;

  // Initial Organization Admin User credentials
  @ApiProperty({ example: 'acme_admin' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  adminUserName: string;

  @ApiProperty({ example: 'admin@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  adminEmail: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(70)
  adminPassword: string;

  @ApiProperty({ example: 'Acme', required: false })
  @IsOptional()
  @IsString()
  adminFirstName?: string;

  @ApiProperty({ example: 'Admin', required: false })
  @IsOptional()
  @IsString()
  adminLastName?: string;
}

export class AddOrganizationMemberDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  firstName: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ example: 'johndoe' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  userName: string;

  @ApiProperty({ example: 'john@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  email: string;

  @ApiProperty({ example: 'User@123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 3, description: 'Role ID (2 for Admin, 3 for User)' })
  @IsNotEmpty()
  roleId: number;
}

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emailDomain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateOrganizationMemberDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  roleId?: number;
}
