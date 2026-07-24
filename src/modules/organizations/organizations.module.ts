import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationSettings } from 'src/entities/organization-settings.entity';
import { OrganizationSubscription } from 'src/entities/organization-subscription.entity';
import { OrganizationFeatureSubscription } from 'src/entities/organization-feature-subscription.entity';
import { MasterModule } from 'src/entities/master-module.entity';
import { MasterFeature } from 'src/entities/master-feature.entity';
import { UserDetails } from 'src/entities/user.entity';
import { MasterRoles } from 'src/entities/master.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { UserOrganization } from 'src/entities/user-organization.entity';
import { TenantProvisionModule } from 'src/modules/tenant-provision/tenant-provision.module';
import { CaslPermissionModule } from 'src/casl-permission/casl-permission.module';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [
    TenantProvisionModule,
    CaslPermissionModule,
    TypeOrmModule.forFeature([
      Organization,
      OrganizationSettings,
      OrganizationSubscription,
      OrganizationFeatureSubscription,
      MasterModule,
      MasterFeature,
      UserDetails,
      MasterRoles,
      UserRole,
      UserOrganization,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
