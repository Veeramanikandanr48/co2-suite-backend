import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ConsolidationApproach,
  InclusionStatus,
  Scope2ReportingBasis,
} from 'src/enums/ghg.enum';

export class CreateOrganizationBoundaryDto {
  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  reportingYear: number;

  @ApiProperty({ enum: ConsolidationApproach, default: 'OPERATIONAL_CONTROL' })
  @IsEnum(ConsolidationApproach)
  @IsOptional()
  consolidationApproach?: string;

  @ApiProperty({ enum: Scope2ReportingBasis, default: 'LOCATION_BASED' })
  @IsEnum(Scope2ReportingBasis)
  @IsOptional()
  scope2ReportingBasis?: string;

  @ApiProperty({ example: 'GHG Protocol Corporate Standard 2004', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  methodologyRegistryRef?: string;

  @ApiProperty({
    example: {
      parentCompany: 'WD Holdings B.V.',
      subsidiaries: ['WD Trading LLC'],
      equitySharePercent: 100,
      leaseStatus: 'owned',
      operationalControl: true,
      financialControl: true,
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  boundaryJson?: Record<string, unknown>;

  @ApiProperty({ example: 'Consolidated boundary for all operating entities', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateOrganizationBoundaryDto extends CreateOrganizationBoundaryDto {}

export class CreateSourceInclusionDto {
  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  reportingYear: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  scopeId?: number;

  @ApiProperty({ example: 'Stationary Combustion', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  category?: string;

  @ApiProperty({ example: 'natural-gas-boilers' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sourceKey: string;

  @ApiProperty({ enum: InclusionStatus, default: 'INCLUDED' })
  @IsEnum(InclusionStatus)
  @IsOptional()
  inclusionStatus?: string;

  @ApiProperty({ example: 'Below materiality threshold (0.5%)', required: false })
  @IsString()
  @IsOptional()
  exclusionReason?: string;

  @ApiProperty({ example: 'OPERATIONAL_CONTROL', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  boundaryBasis?: string;

  @ApiProperty({ example: '1//abc', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  evidenceRef?: string;

  @ApiProperty({ example: 'Emissions below significance threshold', required: false })
  @IsString()
  @IsOptional()
  materialityRationale?: string;
}

export class UpdateSourceInclusionDto extends CreateSourceInclusionDto {}

export class ReviewSourceInclusionDto {
  @ApiProperty({ enum: InclusionStatus })
  @IsEnum(InclusionStatus)
  @IsNotEmpty()
  inclusionStatus: string;

  @ApiProperty({ example: 'Exclusion validated against org chart', required: false })
  @IsString()
  @IsOptional()
  exclusionReason?: string;

  @ApiProperty({ example: 'Contract appendix A.pdf', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  evidenceRef?: string;

  @ApiProperty({ example: 'Materiality set at 1% of total', required: false })
  @IsString()
  @IsOptional()
  materialityRationale?: string;
}

export class GetBoundaryQueryDto {
  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  organizationId?: number;

  @ApiProperty({ example: 2025, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : value))
  reportingYear?: number;
}