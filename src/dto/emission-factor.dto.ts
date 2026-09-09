import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ─── Accepted calculation method codes ────────────────────────────────────────

export const CALCULATION_METHOD_CODES = [
  'FUEL_BASED',
  'DISTANCE_BASED',
  'DISTANCE_WEIGHT',
  'LEAKAGE_RATE',
  'MASS_BALANCE',
  'LOCATION_BASED',
  'MARKET_BASED',
  'SPEND_EEIO',
  'MASS_BASED',
  'WTT_FUEL_BASED',
  'TD_LOSS_BASED',
  'SURVEY_BASED',
  'EQUITY_SHARE',
  'PROCESS_MASS_BALANCE',
] as const;

export type CalculationMethodCode = (typeof CALCULATION_METHOD_CODES)[number];

// ─── Upsert (create / update) DTO ─────────────────────────────────────────────

export class UpsertEmissionFactorDto {
  @ApiPropertyOptional({ example: 42, description: 'Provide id to update an existing record' })
  @IsInt()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional({ example: 5, description: 'FK to master_fuel. Nullable for grid EFs.' })
  @IsInt()
  @IsOptional()
  fuelId?: number | null;

  @ApiProperty({ example: 3, description: 'FK to master_factor_version. Required.' })
  @IsInt()
  @IsNotEmpty()
  factorVersionId: number;

  @ApiProperty({ example: 7, description: 'FK to master_unit (denominator unit).' })
  @IsInt()
  @IsNotEmpty()
  unitId: number;

  @ApiProperty({
    example: 'FUEL_BASED',
    description: 'Calculation method code. Must match MasterFormula.methodCode.',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? String(value).trim().toUpperCase() : value))
  calculationMethod: string;

  @ApiPropertyOptional({ example: 'economy', description: 'Sub-type variant (cabin class, waste type, etc.)' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? String(value).trim().toLowerCase() : null))
  activitySubType?: string | null;

  @ApiPropertyOptional({ example: 'GB', description: 'ISO-3166-1 alpha-2 country code or GLOBAL.' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value ? String(value).trim().toUpperCase() : null))
  geography?: string | null;

  @ApiPropertyOptional({ example: false, description: 'Include Radiative Forcing uplift (air travel only).' })
  @IsBoolean()
  @IsOptional()
  withRF?: boolean | null;

  @ApiPropertyOptional({ example: 'AR6', description: 'GWP basis: AR4 | AR5 | AR6.' })
  @IsString()
  @IsOptional()
  gwpBasis?: string | null;

  // ─── Factor values ──────────────────────────────────────────────────────────

  @ApiProperty({ example: 2.034, description: 'Total emission factor in kgCO2e per unit.' })
  @IsNumber()
  @Min(0)
  factor: number;

  @ApiPropertyOptional({ example: 1.998, description: 'CO2 portion in kgCO2e per unit.' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  co2Factor?: number;

  @ApiPropertyOptional({ example: 0.0253, description: 'CH4 × GWP in kgCO2e per unit.' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  ch4Factor?: number;

  @ApiPropertyOptional({ example: 0.0107, description: 'N2O × GWP in kgCO2e per unit.' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  n2oFactor?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  hfcFactor?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  pfcFactor?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sf6Factor?: number;

  @ApiPropertyOptional({
    example: 'DEFRA 2024 – Natural Gas – Combustion – kg – GB',
    description: 'Human-readable label for MDM admin display.',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── EF resolve query params ───────────────────────────────────────────────────

export class ResolveEmissionFactorQueryDto {
  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  fuelId?: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  factorVersionId: number;

  @ApiProperty({ example: 7 })
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  unitId: number;

  @ApiProperty({ example: 'DISTANCE_BASED' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? String(value).trim().toUpperCase() : value))
  calculationMethod: string;

  @ApiPropertyOptional({ example: 'economy' })
  @IsString()
  @IsOptional()
  activitySubType?: string;

  @ApiPropertyOptional({ example: 'GB' })
  @IsString()
  @IsOptional()
  geography?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  withRF?: boolean;
}
