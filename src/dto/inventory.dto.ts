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

  @ApiProperty({
    example: 1000,
    required: false,
    description: 'Raw activity input amount before normalization',
  })
  @IsNumber()
  @IsOptional()
  originalAmount?: number;

  @ApiProperty({
    example: 'gallon',
    required: false,
    description: 'Raw activity input unit before normalization',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  originalUnit?: string;

  @ApiProperty({
    example: 3785.41,
    required: false,
    description: 'Normalized activity amount matching EF unit',
  })
  @IsNumber()
  @IsOptional()
  normalizedAmount?: number;

  @ApiProperty({
    example: 'litre',
    required: false,
    description: 'Normalized unit matching EF unit',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  normalizedUnit?: string;

  @ApiProperty({
    example: 1.942,
    required: false,
    description: 'Emission factor snapshot in kg CO2e / unit',
  })
  @IsNumber()
  @IsOptional()
  ef?: number;

  @ApiProperty({
    example: 'SCOPE_1',
    required: false,
    description: 'Scope classification (SCOPE_1, SCOPE_2, SCOPE_3)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  scopeType?: string;

  @ApiProperty({
    example: 6,
    required: false,
    description: 'Scope 3 Category Number (1-15)',
  })
  @IsNumber()
  @IsOptional()
  scope3CategoryNumber?: number;

  @ApiProperty({
    example: 'FUEL_BASED',
    required: false,
    description:
      'Calculation methodology (FUEL_BASED, DISTANCE_BASED, SPEND_BASED, etc.)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  calculationMethod?: string;

  @ApiProperty({
    example: 'CAT7_COMMUTING',
    required: false,
    description: 'Sub-category activity type code',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  activityTypeCode?: string;

  @ApiProperty({
    example: '1.0.0',
    required: false,
    description: 'Calculation engine algorithm version snapshot',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  calculationEngineVersion?: string;

  @ApiProperty({
    example: 'WITH_RF',
    required: false,
    description: 'Radiative Forcing status for aviation (WITH_RF, WITHOUT_RF)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  radiativeForcingType?: string;

  @ApiProperty({
    example: 'GAS_SPECIFIC',
    required: false,
    description: 'Emission factor type (CO2E, GAS_SPECIFIC)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  efType?: string;

  @ApiProperty({
    example: 'CO2E_COMPONENT',
    required: false,
    description: 'Factor basis (CO2E_TOTAL, CO2E_COMPONENT, GAS_MASS)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  factorBasis?: string;

  @ApiProperty({
    example: 'DEFRA 2025',
    required: false,
    description: 'Factor dataset name',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  factorDataset?: string;

  @ApiProperty({
    example: 'v1.0',
    required: false,
    description: 'Factor dataset version',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  factorVersion?: string;

  @ApiProperty({
    example: '2025',
    required: false,
    description: 'Factor dataset year',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  factorYear?: string;

  @ApiProperty({
    example: 'FOSSIL',
    required: false,
    description: 'Methane origin (FOSSIL, NON_FOSSIL)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  ch4Origin?: string;

  @ApiProperty({
    example: 'ONE_WAY',
    required: false,
    description: 'Commuting distance type (ONE_WAY, ROUND_TRIP, DAILY_TOTAL)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  distanceType?: string;

  @ApiProperty({
    example: 'IPCC AR6',
    required: false,
    description: 'GWP source and version',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  gwpSource?: string;

  @ApiProperty({
    example: 'AR6',
    required: false,
    description: 'GWP assessment version',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  gwpVersion?: string;

  @ApiProperty({
    example: '100Y',
    required: false,
    description: 'GWP time horizon (100Y, 20Y)',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  gwpHorizon?: string;

  @ApiProperty({
    example: { CO2: 1, CH4: 29.8, N2O: 273 },
    required: false,
    description: 'Exact GWP values used for gas species conversion',
  })
  @IsOptional()
  gwpValuesSnapshot?: Record<string, any>;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Biogenic carbon classification flag',
  })
  @IsOptional()
  isBiogenic?: boolean;

  @ApiProperty({
    example: 'DIRECT_RELEASE',
    required: false,
    enum: [
      'DIRECT_RELEASE',
      'RECHARGE_TOPUP',
      'INVENTORY_DIFFERENCE',
      'ESTIMATED_LEAKAGE',
    ],
    description: 'Fugitive emission calculation methodology mode',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  emissionMode?: string;

  @ApiProperty({
    example: 'COMPANY_OWNED',
    required: false,
    enum: ['COMPANY_OWNED', 'COMPANY_LEASED', 'EMPLOYEE_OWNED', 'THIRD_PARTY'],
    description:
      'Vehicle / asset operational control status for Scope 1 boundary validation',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  ownershipControl?: string;

  @ApiProperty({
    example: 12.5,
    required: false,
    description: 'Recharge / top-up refrigerant amount in kg',
  })
  @IsNumber()
  @IsOptional()
  rechargedAmount?: number;

  @ApiProperty({
    example: 250,
    required: false,
    description: 'Total equipment refrigerant capacity in kg',
  })
  @IsNumber()
  @IsOptional()
  equipmentCapacity?: number;

  @ApiProperty({
    example: 0.05,
    required: false,
    description: 'Annual estimated leakage rate fraction (e.g. 0.05 for 5%)',
  })
  @IsNumber()
  @IsOptional()
  leakageRatePercent?: number;

  @ApiProperty({
    example: 100,
    required: false,
    description: 'Beginning inventory refrigerant charge in kg',
  })
  @IsNumber()
  @IsOptional()
  inventoryStart?: number;

  @ApiProperty({
    example: 50,
    required: false,
    description: 'Purchased refrigerant quantity in kg',
  })
  @IsNumber()
  @IsOptional()
  purchasedRefrigerant?: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Recovered / recycled refrigerant quantity in kg',
  })
  @IsNumber()
  @IsOptional()
  recoveredRefrigerant?: number;

  @ApiProperty({
    example: 120,
    required: false,
    description: 'Ending inventory refrigerant charge in kg',
  })
  @IsNumber()
  @IsOptional()
  inventoryEnd?: number;

  @ApiProperty({
    example: { employeeCount: 100, travelDays: 220, dailyDistance: 20 },
    required: false,
    description: 'Structured JSON snapshot of category methodology inputs',
  })
  @IsOptional()
  methodologyInputsSnapshot?: Record<string, any>;

  @ApiProperty({
    example: 2,
    required: false,
    description: 'Number of hotel rooms reserved',
  })
  @IsNumber()
  @IsOptional()
  numberOfRooms?: number;

  @ApiProperty({
    example: 5,
    required: false,
    description: 'Number of hotel stay nights',
  })
  @IsNumber()
  @IsOptional()
  numberOfNights?: number;

  @ApiProperty({
    example: 500,
    required: false,
    description: 'Wastewater volume in m³',
  })
  @IsNumber()
  @IsOptional()
  wastewaterVolume?: number;

  @ApiProperty({
    example: 'ANAEROBIC_DIGESTION',
    required: false,
    description: 'Wastewater treatment process',
  })
  @IsString()
  @IsOptional()
  treatmentMethod?: string;

  @ApiProperty({
    example: 100,
    required: false,
    description: 'Commuting employee headcount',
  })
  @IsNumber()
  @IsOptional()
  employeeCount?: number;

  @ApiProperty({
    example: 220,
    required: false,
    description: 'Annual commuting travel days',
  })
  @IsNumber()
  @IsOptional()
  travelDays?: number;

  @ApiProperty({
    example: 20,
    required: false,
    description: 'Daily commuting distance in km',
  })
  @IsNumber()
  @IsOptional()
  dailyDistance?: number;

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

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Optional FK to master_fuel for factor resolution',
  })
  @IsNumber()
  @IsOptional()
  fuelId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Optional FK to master_unit for factor resolution',
  })
  @IsNumber()
  @IsOptional()
  unitId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Optional FK to master_factor_version for factor resolution',
  })
  @IsNumber()
  @IsOptional()
  factorVersionId?: number;
}

export class UpdateInventoryEntryDto extends PartialType(
  CreateInventoryEntryDto,
) {}
