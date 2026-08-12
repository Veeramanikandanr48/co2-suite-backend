import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetReconciliationQueryDto {
  @ApiProperty({ example: 2025, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  reportingYear?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  organizationId?: number;

  @ApiProperty({ example: 'Istanbul Plant', required: false })
  @IsString()
  @IsOptional()
  facility?: string;
}

export class GetBreakdownQueryDto {
  @ApiProperty({ example: 2025, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  reportingYear?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  organizationId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  scopeNumber?: number;

  @ApiProperty({ example: 'Stationary Combustion', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Istanbul Plant', required: false })
  @IsString()
  @IsOptional()
  facility?: string;
}