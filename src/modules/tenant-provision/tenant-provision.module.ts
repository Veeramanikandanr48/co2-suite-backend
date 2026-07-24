import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from 'src/entities/organization.entity';
import { TenantProvisionLog } from 'src/entities/tenant-provision-log.entity';
import { TenantSchemaVersion } from 'src/entities/tenant-schema-version.entity';
import { OrganizationSettings } from 'src/entities/organization-settings.entity';
import { TenantHealth } from 'src/entities/tenant-health.entity';
import { TenantProvisionService } from './tenant-provision.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      TenantProvisionLog,
      TenantSchemaVersion,
      OrganizationSettings,
      TenantHealth,
    ]),
  ],
  providers: [TenantProvisionService],
  exports: [TenantProvisionService],
})
export class TenantProvisionModule {}
