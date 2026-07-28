import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from 'src/entities/service.entity';
import { OrganizationService } from 'src/entities/organization-service.entity';
import { ServiceScopeItem } from 'src/entities/service-scope-item.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, OrganizationService, ServiceScopeItem])],
  controllers: [ServicesController],
  providers: [ServicesService, UtilService],
  exports: [ServicesService],
})
export class ServicesModule {}
