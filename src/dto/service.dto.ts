import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignServicesDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of service IDs to subscribe the organization to',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  serviceIds: number[];
}

export class CreateServiceDto {
  @ApiProperty({ example: 'CARBON', description: 'Service code' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'CO2 Suite Carbon',
    description: 'Service display name',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Corporate Carbon Management',
    description: 'Service description',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Carbon',
    description: 'Service category',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  category?: string;

  @ApiProperty({ example: ['Carbon'], description: 'Tags', required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: '/services/carbon',
    description: 'Demo URL',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  demoUrl?: string;
}

export class CreateScopeItemDto {
  @ApiProperty({ example: 'CARBON', description: 'Service code e.g. CARBON' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  serviceCode: string;

  @ApiProperty({
    example: 'Scope 1',
    description: 'Scope display label e.g. Scope 1',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  scope: string;

  @ApiProperty({ example: 'SCOPE_1', description: 'Scope code e.g. SCOPE_1' })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  scopeCode: string;

  @ApiProperty({
    example: 'Stationary Combustion',
    description: 'Scope item name',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'STATIONARY_COMBUSTION',
    description: 'Scope item code',
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Fuel burnt in stationary equipment',
    description: 'Item description',
    required: false,
  })
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : value))
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'Display order', required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class GetSummaryQueryDto {
  @ApiProperty({ example: '2025', required: false })
  @IsString()
  @IsOptional()
  year?: string;

  @ApiProperty({ example: 'Manchester Facility', required: false })
  @IsString()
  @IsOptional()
  facility?: string;
}

export class GetEmissionFactorsQueryDto {
  @ApiProperty({ example: 'Stationary Combustion', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}

export class GetInventoryEntriesQueryDto {
  @ApiProperty({ example: 'Stationary Combustion', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Natural Gas', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ example: 'Manchester Facility', required: false })
  @IsString()
  @IsOptional()
  facility?: string;

  @ApiProperty({ example: 'completed', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'name', required: false })
  @IsString()
  @IsOptional()
  sortField?: string;

  @ApiProperty({ example: 'DESC', enum: ['ASC', 'DESC'], required: false })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  page?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;
}

export class GetActivityResultQueryDto {
  @ApiProperty({
    example: 'activity',
    enum: ['activity', 'spend'],
    required: false,
  })
  @IsString()
  @IsOptional()
  based_option?: string;

  @ApiProperty({ example: 'Manchester Facility', required: false })
  @IsString()
  @IsOptional()
  facility?: string;

  @ApiProperty({ example: '2025', required: false })
  @IsString()
  @IsOptional()
  year?: string;
}

export class GetFactorSignatureQueryDto {
  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ example: 'SC' })
  @IsString()
  activity: string;

  @ApiProperty({ example: 'activity', required: false })
  @IsString()
  @IsOptional()
  based_option?: string;
}
