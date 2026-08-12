import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── GWP Set ─────────────────────────────────────────────────────────────────

export class GwpValueItemDto {
  @ApiProperty({ example: 'CH4', description: 'Gas code: CO2 | CH4 | N2O | HFC | PFC | SF6 | NF3' })
  @IsString()
  @IsNotEmpty()
  gasCode: string;

  @ApiProperty({ example: 'Methane', required: false })
  @IsString()
  @IsOptional()
  gasName?: string;

  @ApiProperty({ example: 'CH4', required: false })
  @IsString()
  @IsOptional()
  chemicalFormula?: string;

  @ApiProperty({ example: 29.8 })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 'FOSSIL', enum: ['FOSSIL', 'NON_FOSSIL', null], required: false })
  @IsIn(['FOSSIL', 'NON_FOSSIL', null, undefined])
  @IsOptional()
  methaneOrigin?: string | null;
}

export class CreateGwpSetDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'GHG Protocol AR6 (100-year)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'GHG Protocol / IPCC AR6', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: 'AR6', enum: ['AR4', 'AR5', 'AR6'], required: false })
  @IsIn(['AR4', 'AR5', 'AR6'])
  @IsOptional()
  assessment?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  timeHorizon?: number;

  @ApiProperty({ example: 'v1', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFossilMethaneDistinguished?: boolean;

  @ApiProperty({ example: '100-year GWP from IPCC AR6', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [GwpValueItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GwpValueItemDto)
  @IsOptional()
  values?: GwpValueItemDto[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GwpValueUpsertDto extends PartialType(GwpValueItemDto) {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;
}

// ─── Emission Factor ─────────────────────────────────────────────────────────

export class CreateEmissionFactorDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 1, description: 'FK to master_fuel' })
  @IsNumber()
  @IsOptional()
  fuelId?: number;

  @ApiProperty({ example: 1, description: 'FK to master_factor_version' })
  @IsNumber()
  @IsOptional()
  factorVersionId?: number;

  @ApiProperty({ example: 1, description: 'FK to master_unit (denominator)' })
  @IsNumber()
  @IsOptional()
  unitBasisId?: number;

  @ApiProperty({ example: 'UK', default: 'GLOBAL' })
  @IsString()
  @IsOptional()
  geography?: string;

  @ApiProperty({ example: 2025, required: false })
  @IsNumber()
  @IsOptional()
  reportingYear?: number;

  @ApiProperty({ example: 'Standard factor', required: false })
  @IsString()
  @IsOptional()
  methodology?: string;

  @ApiProperty({ example: 'CURRENT', enum: ['CURRENT', 'DRAFT', 'RETIRED', 'CUSTOM_APPROVED'], default: 'CURRENT' })
  @IsIn(['CURRENT', 'DRAFT', 'RETIRED', 'CUSTOM_APPROVED'])
  @IsOptional()
  methodologyStatus?: string;

  @ApiProperty({ example: 1.942 })
  @IsNumber()
  @IsNotEmpty()
  factorValue: number;

  @ApiProperty({ example: 1.927, required: false })
  @IsNumber()
  @IsOptional()
  co2Value?: number;

  @ApiProperty({ example: 0.0049, required: false })
  @IsNumber()
  @IsOptional()
  ch4Value?: number;

  @ApiProperty({ example: 0.0009, required: false })
  @IsNumber()
  @IsOptional()
  n2oValue?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  hfcValue?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  pfcValue?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  sf6Value?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  nf3Value?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  biogenicCo2Value?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFossilMethane?: boolean;

  @ApiProperty({ example: 'kgCO2e', default: 'kgCO2e', required: false })
  @IsString()
  @IsOptional()
  outputUnit?: string;

  @ApiProperty({ example: 'PRIMARY', enum: ['PRIMARY', 'SUPPLIER_SPECIFIC', 'AVERAGE_DATA', 'ESTIMATED'], required: false })
  @IsIn(['PRIMARY', 'SUPPLIER_SPECIFIC', 'AVERAGE_DATA', 'ESTIMATED'])
  @IsOptional()
  dataQuality?: string;

  @ApiProperty({ example: 'https://www.gov.uk/.../conversion-factors-2024', required: false })
  @IsString()
  @IsOptional()
  sourceReference?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefaultFactor?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── Unit Conversion ─────────────────────────────────────────────────────────

export class CreateUnitConversionDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'kWh' })
  @IsString()
  @IsNotEmpty()
  fromUnit: string;

  @ApiProperty({ example: 'MWh' })
  @IsString()
  @IsNotEmpty()
  toUnit: string;

  @ApiProperty({ example: 0.001 })
  @IsNumber()
  @IsNotEmpty()
  conversionFactor: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  fromUnitId?: number;

  @ApiProperty({ example: 2, required: false })
  @IsInt()
  @IsOptional()
  toUnitId?: number;

  @ApiProperty({ example: 'SI prefix', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── Boundary / Inclusion ────────────────────────────────────────────────────

export class CreateOrganizationBoundaryDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  organizationId: number;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @IsNotEmpty()
  reportingYear: number;

  @ApiProperty({ example: 'OPERATIONAL_CONTROL', enum: ['EQUITY_SHARE', 'OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL'] })
  @IsIn(['EQUITY_SHARE', 'OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL'])
  @IsOptional()
  consolidationApproach?: string;

  @ApiProperty({ example: 'LOCATION_BASED', enum: ['LOCATION_BASED', 'MARKET_BASED', 'DUAL'] })
  @IsIn(['LOCATION_BASED', 'MARKET_BASED', 'DUAL'])
  @IsOptional()
  scope2ReportingBasis?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  methodologyRegistryRef?: string;

  @ApiProperty({ required: false, type: Object })
  @IsObject()
  @IsOptional()
  boundaryJson?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateSourceInclusionDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  organizationId: number;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @IsNotEmpty()
  reportingYear: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  scopeId?: number;

  @ApiProperty({ example: 'Purchased Electricity', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'SC|Natural Gas' })
  @IsString()
  @IsNotEmpty()
  sourceKey: string;

  @ApiProperty({ example: 'INCLUDED', enum: ['INCLUDED', 'EXCLUDED', 'NOT_APPLICABLE', 'PENDING_REVIEW'] })
  @IsIn(['INCLUDED', 'EXCLUDED', 'NOT_APPLICABLE', 'PENDING_REVIEW'])
  @IsOptional()
  inclusionStatus?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  exclusionReason?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  boundaryBasis?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  reviewerId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reviewDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  evidenceRef?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  materialityRationale?: string;
}

// ─── Calculation / Recalculation ─────────────────────────────────────────────

export class RecalculateEntryDto {
  @ApiProperty({ example: 'Material change in emission factor release', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  gwpSetId?: number;
}

export class RecalculateYearDto {
  @ApiProperty({ example: 2025 })
  @IsInt()
  @IsNotEmpty()
  reportingYear: number;

  @ApiProperty({ example: 'Emission factor release 2026 applied to 2025 inventory', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  gwpSetId?: number;
}

export class AuditQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  entityId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;
}