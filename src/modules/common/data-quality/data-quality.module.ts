import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import {
  ActivitySupplementaryValue,
  DataQualityResult,
  DataQualityRule,
  DataQualityScore,
} from 'src/entities/data-quality.entity';
import { DataQualityService } from './data-quality.service';
import { DataQualityController } from './data-quality.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataQualityRule,
      DataQualityResult,
      DataQualityScore,
      ActivitySupplementaryValue,
      InventoryEntry,
    ]),
  ],
  controllers: [DataQualityController],
  providers: [DataQualityService, UtilService],
  exports: [DataQualityService],
})
export class DataQualityModule {}
