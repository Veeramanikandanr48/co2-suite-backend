import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CommonListPayloadDto {
  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  offSet?: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  limit?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  searchInput?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sortField?: string;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
