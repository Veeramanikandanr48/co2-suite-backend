import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ResolveFactorDto {
  @ApiProperty({ example: 1, required: false, description: 'FK to master_fuel' })
  @IsNumber()
  @IsOptional()
  fuelId?: number;

  @ApiProperty({ example: 1, required: false, description: 'FK to master_unit' })
  @IsNumber()
  @IsOptional()
  unitId?: number;

  @ApiProperty({ example: 1, required: false, description: 'FK to master_factor_version' })
  @IsNumber()
  @IsOptional()
  factorVersionId?: number;
}

export type ResolutionLevel =
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
