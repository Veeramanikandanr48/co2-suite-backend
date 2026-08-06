import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  EmissionSummary,
  ReportDefinition,
  ReportExecution,
} from 'src/entities/reporting-analytics.entity';
import { AggregationService } from './aggregation.service';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmissionSummary,
      ReportDefinition,
      ReportExecution,
      InventoryEntry,
    ]),
  ],
  controllers: [ReportingController],
  providers: [AggregationService, ReportingService, UtilService],
  exports: [AggregationService, ReportingService],
})
export class ReportingModule {}
