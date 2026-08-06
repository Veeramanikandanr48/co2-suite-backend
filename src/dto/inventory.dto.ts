import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEmissionFactorDto {
  @ApiProperty({ example: 'Scope 1', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'IPCC' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'AR6', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  version?: string;

  @ApiProperty({ example: 'Natural Gas' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  fuelOrGasType: string;

  @ApiProperty({ example: 'sm3', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 1.942 })
  @IsNumber()
  @IsNotEmpty()
  factor: number;

  @ApiProperty({ example: 1.94, required: false })
  @IsNumber()
  @IsOptional()
  co2?: number;

  @ApiProperty({ example: 0.001, required: false })
  @IsNumber()
  @IsOptional()
  ch4?: number;

  @ApiProperty({ example: 0.0001, required: false })
  @IsNumber()
  @IsOptional()
  n2o?: number;

  @ApiProperty({ example: 1.942, required: false })
  @IsNumber()
  @IsOptional()
  co2e?: number;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsString()
  @IsOptional()
  effectiveTo?: string;

  @ApiProperty({ example: '(amount * factor) / 1000', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  formula?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  fuelGasTypeId?: number;

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  activityCategoryId?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  measurementUnitId?: number;

  @ApiProperty({ example: 4, required: false })
  @IsNumber()
  @IsOptional()
  scopeId?: number;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  factorSourceId?: number;

  @ApiProperty({ example: 6, required: false })
  @IsNumber()
  @IsOptional()
  factorVersionId?: number;
}

export class UpdateEmissionFactorDto extends PartialType(CreateEmissionFactorDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}

export class CreateInventoryEntryDto {
  @ApiProperty({ example: 'CARBON', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  serviceCode?: string;

  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Natural Gas' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'sm3', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 1.942, required: false })
  @IsNumber()
  @IsOptional()
  ef?: number;

  @ApiProperty({
    example: 'IPCC (Commercial & Institutional Use)-AR6',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  efSource?: string;

  @ApiProperty({ example: '01.01.2025', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ example: '31.12.2025', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  dateTo?: string;

  @ApiProperty({ example: 'Manchester Facility', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  facility?: string;

  @ApiProperty({ example: 'Approved', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  approvalStatus?: string;

  @ApiProperty({ example: 'Initial test entry', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  comment?: string;

  @ApiProperty({ example: 'completed', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'uploads/inventory-docs/abc.pdf', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  documentPath?: string;

  @ApiProperty({ example: '(amount * factor) / 1000', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  formula?: string;
}

export class UpdateInventoryEntryDto extends PartialType(
  CreateInventoryEntryDto,
) {}
