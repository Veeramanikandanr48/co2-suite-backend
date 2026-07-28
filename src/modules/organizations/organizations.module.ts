import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from 'src/entities/organization.entity';
import { UserAuthenticationDetails, UserDetails } from 'src/entities/user.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      UserDetails,
      UserAuthenticationDetails,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, UtilService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
