import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'mod-uuid', description: 'ID from master_modules table' })
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @ApiProperty({ example: 'profile' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : value))
  action: string;

  @ApiProperty({ example: 'any', description: "'own' or 'any'" })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : 'any'))
  scope?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  description?: string;
}

export class UpdatePermissionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim().toLowerCase() : 'any'))
  scope?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ type: [Number], description: 'Permission IDs to assign to this role' })
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}

export class CheckPermissionDto {
  @ApiProperty({ example: 'read' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'users:profile' })
  @IsString()
  @IsNotEmpty()
  subject: string;
}
