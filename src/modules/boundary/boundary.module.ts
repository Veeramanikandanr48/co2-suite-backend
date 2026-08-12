import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationBoundary } from 'src/entities/organization-boundary.entity';
import { SourceInclusion } from 'src/entities/source-inclusion.entity';
import { AuditModule } from 'src/modules/common/audit/audit.module';
import { BoundaryController } from './boundary.controller';
import { BoundaryService } from './boundary.service';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationBoundary, SourceInclusion]),
    AuditModule,
  ],
  controllers: [BoundaryController],
  providers: [BoundaryService, UtilService],
  exports: [BoundaryService],
})
export class BoundaryModule {}