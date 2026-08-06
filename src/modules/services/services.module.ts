import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { Facility } from 'src/entities/facility.entity';
import { Organization } from 'src/entities/organization.entity';
import { UserDetails } from 'src/entities/user.entity';
import { CalculationSnapshot } from 'src/entities/calculation-snapshot.entity';
import {
  CalculationPolicy,
  EmissionFactorRow,
  EmissionFactorSet,
  EmissionFactorValue,
  FormulaVersion,
  GasMultiplier,
  GwpVersion,
} from 'src/entities/master-config.entity';
import { ServicesService } from './services.service';
import { SummaryService } from './summary.service';
import { ServicesController } from './services.controller';
import { UtilService } from 'src/utility/util/util.service';
import { CalculationEngine } from './engine/calculation-engine';
import { CalculationDbService } from './engine/calculation-db.service';
import { DataQualityModule } from 'src/modules/common/data-quality/data-quality.module';

@Module({
  imports: [
    DataQualityModule,
    TypeOrmModule.forFeature([
      Service,
      OrganizationService,
      ServiceScopeItem,
      EmissionFactor,
      InventoryEntry,
      Facility,
      Organization,
      UserDetails,
      CalculationSnapshot,
      CalculationPolicy,
      EmissionFactorSet,
      EmissionFactorRow,
      EmissionFactorValue,
      GwpVersion,
      GasMultiplier,
      FormulaVersion,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads/inventory-docs');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `doc-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  ],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    SummaryService,
    UtilService,
    CalculationEngine,
    CalculationDbService,
  ],
  exports: [ServicesService, SummaryService, CalculationEngine, CalculationDbService],
})
export class ServicesModule {}
