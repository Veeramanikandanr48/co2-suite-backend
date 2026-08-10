import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// ─── Master Scope ─────────────────────────────────────────────────────────────

export class CreateMasterScopeDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Scope 1', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: 'SC', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim().toUpperCase() : value))
  code?: string;

  @ApiProperty({ example: 'Emissions from fuel burned in stationary equipment', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Master Category ──────────────────────────────────────────────────────────

export class CreateMasterCategoryDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Scope 1', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: 1, required: false, description: 'FK to master_scope' })
  @IsNumber()
  @IsOptional()
  scopeId?: number;

  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: 'SC', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim().toUpperCase() : value))
  code?: string;

  @ApiProperty({ example: 'Category for fuel burned in stationary equipment', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Master Fuel ──────────────────────────────────────────────────────────────

export class CreateMasterFuelDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Natural Gas' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: 'NAT_GAS', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? value.trim().toUpperCase() : value))
  code?: string;

  @ApiProperty({ example: 1, required: false, description: 'FK to master_scope' })
  @IsNumber()
  @IsOptional()
  scopeId?: number;

  @ApiProperty({ example: 'Gaseous fossil fuel used for heating and power', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Master Unit ──────────────────────────────────────────────────────────────

export class CreateMasterUnitDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Kilogram CO2 Equivalent' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: 'kgCO2e' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  symbol: string;

  @ApiProperty({ example: 'Standard unit for greenhouse gas emissions', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Master Datasource ────────────────────────────────────────────────────────

export class CreateMasterDatasourceDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Department for Energy Security and Net Zero' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: 'DEFRA' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toUpperCase())
  code: string;

  @ApiProperty({ example: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'UK government GHG conversion factors publisher', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Master Factor Version ────────────────────────────────────────────────────

export class CreateMasterFactorVersionDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: '2024' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  version: string;

  @ApiProperty({ example: 2024, required: false })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiProperty({ example: 1, required: false, description: 'FK to master_datasource' })
  @IsNumber()
  @IsOptional()
  datasourceId?: number;

  @ApiProperty({ example: 'DEFRA 2024 conversion factors release', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

// ─── Master Formula ───────────────────────────────────────────────────────────

export class CreateMasterFormulaDto {
  @ApiProperty({ example: 1, required: false, description: 'Provide id to update existing record' })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Standard Factor Conversion' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty({ example: '(amount * factor) / 1000' })
  @IsString()
  @IsNotEmpty()
  formula: string;

  @ApiProperty({ example: ['amount', 'factor'], required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiProperty({ example: 'tCO2e', required: false })
  @IsString()
  @IsOptional()
  outputUnit?: string;

  @ApiProperty({ example: 'Converts raw consumption to tonnes CO2e', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateMasterScopeDto extends PartialType(CreateMasterScopeDto) { }
export class UpdateMasterFuelDto extends PartialType(CreateMasterFuelDto) { }
export class UpdateMasterUnitDto extends PartialType(CreateMasterUnitDto) { }
export class UpdateMasterDatasourceDto extends PartialType(CreateMasterDatasourceDto) { }
export class UpdateMasterFactorVersionDto extends PartialType(CreateMasterFactorVersionDto) { }
export class UpdateMasterFormulaDto extends PartialType(CreateMasterFormulaDto) { }
