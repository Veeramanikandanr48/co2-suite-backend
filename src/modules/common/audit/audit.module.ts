import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTrail } from 'src/entities/audit-trail.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditTrail])],
  controllers: [AuditController],
  providers: [AuditService, UtilService],
  exports: [AuditService],
})
export class AuditModule {}
