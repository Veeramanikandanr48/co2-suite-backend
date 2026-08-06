import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BenchmarkDataset,
  EmissionSummary,
  ReducedTarget,
} from 'src/entities/reporting-analytics.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReducedTarget,
      BenchmarkDataset,
      EmissionSummary,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, UtilService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
