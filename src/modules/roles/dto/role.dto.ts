import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER', description: 'Immutable uppercase key' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, { message: 'roleKey must be uppercase letters and underscores only' })
  @Transform(({ value }) => (value ? value.trim().toUpperCase() : value))
  roleKey: string;

  @ApiProperty({ example: 'Manager' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim() : value))
  roleName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  roleShortName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  description?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  roleName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  roleShortName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  description?: string;
}

export class AssignRoleDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  roleId: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class SwitchRoleDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}
