import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ResolveFactorDto {
  @ApiProperty({
    example: 1,
    required: false,
    description: 'FK to master_fuel',
  })
  @IsNumber()
  @IsOptional()
  fuelId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'FK to master_unit',
  })
  @IsNumber()
  @IsOptional()
  unitId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'FK to master_factor_version',
  })
  @IsNumber()
  @IsOptional()
  factorVersionId?: number;

  @ApiProperty({
    example: '2024-05-15',
    required: false,
    description: 'Date of activity for temporal resolution',
  })
  @IsOptional()
  activityDate?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'FK to master_geography',
  })
  @IsNumber()
  @IsOptional()
  geographyId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'FK to master_activity_type',
  })
  @IsNumber()
  @IsOptional()
  activityTypeId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'FK to master_energy_type',
  })
  @IsNumber()
  @IsOptional()
  energyTypeId?: number;
}

export type ResolutionLevel =
  | 'V2_EMISSION_FACTOR'
  | 'VERSION_FUEL_UNIT'
  | 'VERSION_FUEL'
  | 'FUEL_UNIT'
  | 'FACTOR_VERSION_BASELINE'
  | 'MASTER_FUEL_BASELINE';

export class ResolvedFactorResultDto {
  @ApiProperty({ example: 1.938 })
  emissionFactor: number;

  @ApiProperty({ example: 'DEFRA 2024 (Version-Fuel)' })
  efSource: string;

  @ApiProperty({ example: 'VERSION_FUEL' })
  resolutionLevel: ResolutionLevel;

  @ApiProperty({ example: 1, required: false })
  factorVersionId?: number;

  @ApiProperty({ example: 1, required: false })
  fuelId?: number;

  @ApiProperty({ example: 1, required: false })
  unitId?: number;
}
