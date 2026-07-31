import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class GetNextApprovarDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleUniqueId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleId: number;
}

export class GetApprovalDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleUniqueId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  toRoleId: number;
}

export class CheckApprovalAccessDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  toRoleId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleUniqueId: number;
}

export class UpdateUserApprovalDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleUniqueId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalModuleId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  approvalStatusId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  reason: string;
}
