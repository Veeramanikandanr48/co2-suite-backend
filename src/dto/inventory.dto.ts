import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty({ example: 1000, required: false, description: 'Raw activity input amount before normalization' })
  @IsNumber()
  @IsOptional()
  originalAmount?: number;

  @ApiProperty({ example: 'gallon', required: false, description: 'Raw activity input unit before normalization' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  originalUnit?: string;

  @ApiProperty({ example: 3785.41, required: false, description: 'Normalized activity amount matching EF unit' })
  @IsNumber()
  @IsOptional()
  normalizedAmount?: number;

  @ApiProperty({ example: 'litre', required: false, description: 'Normalized unit matching EF unit' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  normalizedUnit?: string;

  @ApiProperty({ example: 1.942, required: false, description: 'Emission factor snapshot in kg CO2e / unit' })
  @IsNumber()
  @IsOptional()
  ef?: number;

  @ApiProperty({ example: 'SCOPE_1', required: false, description: 'Scope classification (SCOPE_1, SCOPE_2, SCOPE_3)' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  scopeType?: string;

  @ApiProperty({ example: 6, required: false, description: 'Scope 3 Category Number (1-15)' })
  @IsNumber()
  @IsOptional()
  scope3CategoryNumber?: number;

  @ApiProperty({ example: 'FUEL_BASED', required: false, description: 'Calculation methodology (FUEL_BASED, DISTANCE_BASED, SPEND_BASED, etc.)' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  calculationMethod?: string;

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

  @ApiProperty({ example: 1, required: false, description: 'Optional FK to master_fuel for factor resolution' })
  @IsNumber()
  @IsOptional()
  fuelId?: number;

  @ApiProperty({ example: 1, required: false, description: 'Optional FK to master_unit for factor resolution' })
  @IsNumber()
  @IsOptional()
  unitId?: number;

  @ApiProperty({ example: 1, required: false, description: 'Optional FK to master_factor_version for factor resolution' })
  @IsNumber()
  @IsOptional()
  factorVersionId?: number;
}

export class UpdateInventoryEntryDto extends PartialType(
  CreateInventoryEntryDto,
) {}
