import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApiKey,
  AuditLog,
  Tenant,
  WebhookDelivery,
  WebhookEndpoint,
} from 'src/entities/enterprise.entity';
import { EnterpriseService } from './enterprise.service';
import { WebhookService } from './webhook.service';
import { EnterpriseController } from './enterprise.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      ApiKey,
      WebhookEndpoint,
      WebhookDelivery,
      AuditLog,
    ]),
  ],
  controllers: [EnterpriseController],
  providers: [EnterpriseService, WebhookService, UtilService],
  exports: [EnterpriseService, WebhookService],
})
export class EnterpriseModule {}
