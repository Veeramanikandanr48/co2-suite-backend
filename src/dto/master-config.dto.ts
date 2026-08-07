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
  @ApiProperty({ example: 'CARBON', required: false, default: 'CARBON' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  serviceCode?: string;

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

  @ApiProperty({ example: 'PUBLISHED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsString()
  @IsOptional()
  effectiveTo?: string;

  @ApiProperty({ example: ['DEFRA', 'Scope1'], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: { fr: { name: 'Diesel Fuel' } }, required: false })
  @IsOptional()
  translations?: Record<string, { name?: string; description?: string }>;

  @ApiProperty({ example: ['gasoil', 'diesel'], required: false })
  @IsArray()
  @IsOptional()
  keywords?: string[];

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  schemaId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({ example: { density: 0.85 }, required: false })
  @IsOptional()
  customAttributes?: Record<string, any>;

  @ApiProperty({ example: 'Initial creation', required: false })
  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class UpdateMasterItemDto extends PartialType(CreateMasterItemDto) { }

// Governance Change Request DTOs
export class CreateChangeRequestDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  masterItemId?: number;

  @ApiProperty({ example: 'UPDATE' })
  @IsString()
  @IsNotEmpty()
  actionType: string;

  @ApiProperty({ example: { name: 'Updated Diesel Name' } })
  @IsNotEmpty()
  proposedChanges: Record<string, any>;

  @ApiProperty({ example: 'Annual factor update per DEFRA 2025' })
  @IsString()
  @IsOptional()
  requestReason?: string;
}

export class ReviewChangeRequestDto {
  @ApiProperty({ example: 'APPROVED' })
  @IsString()
  @IsNotEmpty()
  status: string; // 'APPROVED' | 'REJECTED'

  @ApiProperty({ example: 'Looks good, approved for release', required: false })
  @IsString()
  @IsOptional()
  reviewerComments?: string;
}

export class CreateMasterSchemaDto {
  @ApiProperty({ example: 'FuelTypeSchema' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Schema for dynamic fuel parameters', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: { type: 'object', properties: { flashPoint: { type: 'number' } } } })
  @IsNotEmpty()
  jsonSchema: Record<string, any>;
}

// 8. Unit Conversion DTOs
export class CreateUnitConversionDto {
  @ApiProperty({ example: 'kg', required: false })
  @IsString()
  @IsOptional()
  fromUnitCode?: string;

  @ApiProperty({ example: 'kg', required: false })
  @IsString()
  @IsOptional()
  fromUnit?: string;

  @ApiProperty({ example: 'tonne', required: false })
  @IsString()
  @IsOptional()
  toUnitCode?: string;

  @ApiProperty({ example: 'tonne', required: false })
  @IsString()
  @IsOptional()
  toUnit?: string;

  @ApiProperty({ example: 0.001 })
  @IsNumber()
  @IsNotEmpty()
  multiplier: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  offset?: number;

  @ApiProperty({ example: 'MASS', required: false })
  @IsString()
  @IsOptional()
  dimension?: string;

  @ApiProperty({ example: 'Convert kilograms to metric tonnes', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateUnitConversionDto extends PartialType(CreateUnitConversionDto) {}

export class BulkImportMasterItemsDto {
  @ApiProperty({ type: [CreateMasterItemDto] })
  @IsArray()
  @IsNotEmpty()
  items: CreateMasterItemDto[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}


