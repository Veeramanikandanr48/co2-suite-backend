import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MrvStatusEnum } from 'src/enums/mrv-status.enum';

export class SubmitMrvEntryDto {
  @ApiPropertyOptional({ description: 'Submission comments or rationale' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Optional SHA256 checksum of supporting document' })
  @IsOptional()
  @IsString()
  evidenceSha256?: string;
}

export class AuditMrvEntryDto {
  @ApiPropertyOptional({ description: 'Audit notes or evidence verification remarks' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectMrvEntryDto {
  @ApiProperty({ description: 'Mandatory reason for rejecting entry back to DRAFT' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class LockMrvEntryDto {
  @ApiPropertyOptional({ description: 'Regulatory locking remarks' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class BulkLockMrvDto {
  @ApiProperty({ description: 'Array of inventory entry IDs to lock', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  entryIds: number[];

  @ApiPropertyOptional({ description: 'Regulatory batch locking remarks' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class GetMrvQueueQueryDto {
  @ApiPropertyOptional({ enum: MrvStatusEnum })
  @IsOptional()
  @IsEnum(MrvStatusEnum)
  mrvStatus?: MrvStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by facility name' })
  @IsOptional()
  @IsString()
  facility?: string;

  @ApiPropertyOptional({ description: 'Filter by year (e.g. 2026)' })
  @IsOptional()
  @IsString()
  year?: string;
}
