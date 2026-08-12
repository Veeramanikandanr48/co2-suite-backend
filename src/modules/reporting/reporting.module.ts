import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationResult } from 'src/entities/calculation-result.entity';
import { CalculationRun } from 'src/entities/calculation-run.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { OrganizationBoundary } from 'src/entities/organization-boundary.entity';
import { SourceInclusion } from 'src/entities/source-inclusion.entity';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalculationResult,
      CalculationRun,
      InventoryEntry,
      OrganizationBoundary,
      SourceInclusion,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService, UtilService],
  exports: [ReportingService],
})
export class ReportingModule {}