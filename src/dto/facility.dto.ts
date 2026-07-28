import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({ example: 'WD Solutions Co. LLC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 41.0082, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 28.9784, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 'Full installation address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'TRIST', required: false })
  @IsString()
  @IsOptional()
  unLocode?: string;

  @ApiProperty({ example: '34000', required: false })
  @IsString()
  @IsOptional()
  postCode?: string;

  @ApiProperty({ example: 'TR', required: false })
  @IsString()
  @IsOptional()
  countryCode?: string;
}

export class UpdateFacilityDto extends CreateFacilityDto {}
