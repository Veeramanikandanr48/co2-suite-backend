import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MasterItemType } from 'src/entities/master-item.entity';

// 1. Gas Type DTOs
export class CreateGasTypeDto {
  @ApiProperty({ example: 'CO2' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Carbon Dioxide' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CO₂', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  chemicalFormula?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateGasTypeDto extends PartialType(CreateGasTypeDto) { }

// 2. GWP Version & Multiplier DTOs
export class CreateGwpVersionDto {
  @ApiProperty({ example: 'AR6' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'IPCC Sixth Assessment Report (2021)' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2021, required: false })
  @IsNumber()
  @IsOptional()
  publicationYear?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateGasMultiplierDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  gwpVersionId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  gasTypeId: number;

  @ApiProperty({ example: 27.9 })
  @IsNumber()
  @IsNotEmpty()
  multiplier: number;
}

// 3. Emission Factor Set DTOs
export class CreateEmissionFactorSetDto {
  @ApiProperty({ example: 'DEFRA 2026 Emission Factors' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'DEFRA' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: '2026', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  version?: string;

  @ApiProperty({ example: '2026-01-01', required: false })
  @IsString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsString()
  @IsOptional()
  effectiveTo?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateEmissionFactorSetDto extends PartialType(CreateEmissionFactorSetDto) { }

export class CreateEmissionFactorRowDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  factorSetId: number;

  @ApiProperty({ example: 'Diesel' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  fuelType: string;

  @ApiProperty({ example: 'litre' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ example: 'Mobile Combustion', required: false })
  @IsString()
  @IsOptional()
  activityCategory?: string;

  @ApiProperty({ example: 'Scope 1', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: 'Standard diesel fuel factor', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEmissionFactorValueDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  factorRowId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  gasTypeId: number;

  @ApiProperty({ example: 2.68 })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ example: 'kg', required: false })
  @IsString()
  @IsOptional()
  valueUnit?: string;
}

// 4. Formula Library DTOs
export class CreateFormulaLibraryDto {
  @ApiProperty({ example: 'ACTIVITY_MULTIPLIER' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Activity Multiplier' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Standard emission formula: (amount * factor) / 1000', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Combustion', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '(amount * factor) / 1000' })
  @IsString()
  @IsNotEmpty()
  expression: string;
}

// 5. Calculation Policy DTOs
export class CreateCalculationPolicyDto {
  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  activityCategory: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  factorSetId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  gwpVersionId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  formulaVersionId: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateCalculationPolicyDto extends PartialType(CreateCalculationPolicyDto) { }

// 6. Supplementary Field DTO
export class CreateSupplementaryFieldDto {
  @ApiProperty({ example: 'Fugitive Emissions' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'refrigerantGasType' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty({ example: 'Refrigerant Gas Type' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'select', required: false })
  @IsString()
  @IsOptional()
  fieldType?: string;

  @ApiProperty({ example: '["R-134a", "R-410A"]', required: false })
  @IsString()
  @IsOptional()
  options?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// 7. Generic Master Item DTOs
export class CreateMasterItemDto {
  @ApiProperty({ example: 'FUEL_TYPE' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  type: MasterItemType;

  @ApiProperty({ example: 'DIESEL', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Diesel' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Automotive Diesel Fuel', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ example: 'Scope 1', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: 'Fuel', required: false })
  @IsString()
  @IsOptional()
  subType?: string;

  @ApiProperty({ example: ['L', 'sm3', 'kWh'], required: false })
  @IsArray()
  @IsOptional()
  allowedUnits?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMasterItemDto extends PartialType(CreateMasterItemDto) { }

