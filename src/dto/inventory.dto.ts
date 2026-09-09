import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MrvStatusEnum } from 'src/enums/mrv-status.enum';

export class CreateInventoryEntryDto {
  @ApiProperty({ enum: MrvStatusEnum, example: MrvStatusEnum.DRAFT, required: false })
  @IsEnum(MrvStatusEnum)
  @IsOptional()
  mrvStatus?: MrvStatusEnum;

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

  @ApiProperty({ example: 1.942, required: false })
  @IsNumber()
  @IsOptional()
  ef?: number;

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

  @ApiProperty({ example: 'DISTANCE_BASED', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  calculationMethod?: string;

  @ApiProperty({ example: 'Short-haul Economy', required: false })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  activitySubType?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  emissionFactorId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  formulaId?: number;

  @ApiProperty({ example: 0.15, required: false })
  @IsNumber()
  @IsOptional()
  locationBasedTco2e?: number;

  @ApiProperty({ example: 0.12, required: false })
  @IsNumber()
  @IsOptional()
  marketBasedTco2e?: number;

  @ApiProperty({ example: 500, required: false })
  @IsNumber()
  @IsOptional()
  distance?: number;

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  passengers?: number;

  @ApiProperty({ example: { distance: 500, passengers: 2 }, required: false })
  @IsOptional()
  variables?: Record<string, any>;
}

export class UpdateInventoryEntryDto extends PartialType(
  CreateInventoryEntryDto,
) {}
