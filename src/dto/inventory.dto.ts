import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEmissionFactorDto {
  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'IPCC-AR6' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'AR6', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ example: 'Natural Gas' })
  @IsString()
  @IsNotEmpty()
  fuelOrGasType: string;

  @ApiProperty({ example: 'sm3', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 1.942 })
  @IsNumber()
  @IsNotEmpty()
  factor: number;

  @ApiProperty({ example: '(amount * factor) / 1000', required: false })
  @IsString()
  @IsOptional()
  formula?: string;
}

export class CreateInventoryEntryDto {
  @ApiProperty({ example: 'CARBON', required: false })
  @IsString()
  @IsOptional()
  serviceCode?: string;

  @ApiProperty({ example: 'Stationary Combustion' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Natural Gas' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'sm3', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 1.942, required: false })
  @IsNumber()
  @IsOptional()
  ef?: number;

  @ApiProperty({ example: 'IPCC (Commercial & Institutional Use)-AR6', required: false })
  @IsString()
  @IsOptional()
  efSource?: string;

  @ApiProperty({ example: '01.01.2025', required: false })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({ example: '31.12.2025', required: false })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiProperty({ example: 'Manchester Facility', required: false })
  @IsString()
  @IsOptional()
  facility?: string;

  @ApiProperty({ example: 'Approved', required: false })
  @IsString()
  @IsOptional()
  approvalStatus?: string;

  @ApiProperty({ example: 'Initial test entry', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ example: 'completed', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'uploads/inventory-docs/abc.pdf', required: false })
  @IsString()
  @IsOptional()
  documentPath?: string;
}
