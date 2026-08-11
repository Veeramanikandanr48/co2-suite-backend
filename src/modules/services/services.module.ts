import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ScopeCategoryMapping } from 'src/entities/scope-category-mapping.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { Facility } from 'src/entities/facility.entity';
import { Organization } from 'src/entities/organization.entity';
import { UserDetails } from 'src/entities/user.entity';
import { ServicesService } from './services.service';
import { SummaryService } from './summary.service';
import { ServicesController } from './services.controller';
import { UtilService } from 'src/utility/util/util.service';
import { CalculationEngine } from './engine/calculation-engine';
import { MasterModule } from '../master/master.module';
import { MasterCategory } from 'src/entities/master-category.entity';
import { CalculationMethodEngine } from './engine/calculation-method.engine';

@Module({
  imports: [
    MasterModule,
    TypeOrmModule.forFeature([
      Service,
      OrganizationService,
      ScopeCategoryMapping,
      InventoryEntry,
      Facility,
      Organization,
      UserDetails,
      MasterUnit,
      MasterCategory,
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
    CalculationMethodEngine,
  ],
  exports: [
    ServicesService,
    SummaryService,
    CalculationEngine,
    CalculationMethodEngine,
  ],
})
export class ServicesModule { }
