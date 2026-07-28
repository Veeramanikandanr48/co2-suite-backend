import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'CageSuite Carbon', description: 'Service display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Corporate Carbon Management', description: 'Service description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Carbon', description: 'Service category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: ['Carbon'], description: 'Tags', required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: '/services/carbon', description: 'Demo URL', required: false })
  @IsString()
  @IsOptional()
  demoUrl?: string;
}

export class CreateScopeItemDto {
  @ApiProperty({ example: 'CARBON', description: 'Service code e.g. CARBON' })
  @IsString()
  @IsNotEmpty()
  serviceCode: string;

  @ApiProperty({ example: 'Scope 1', description: 'Scope display label e.g. Scope 1' })
  @IsString()
  @IsNotEmpty()
  scope: string;

  @ApiProperty({ example: 'SCOPE_1', description: 'Scope code e.g. SCOPE_1' })
  @IsString()
  @IsNotEmpty()
  scopeCode: string;

  @ApiProperty({ example: 'Stationary Combustion', description: 'Scope item name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'STATIONARY_COMBUSTION', description: 'Scope item code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Fuel burnt in stationary equipment', description: 'Item description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'Display order', required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
