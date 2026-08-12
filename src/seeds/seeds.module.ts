import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GwpSet } from 'src/entities/gwp-set.entity';
import { GwpValue } from 'src/entities/gwp-value.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import { ApprovalModules, ApprovalMatrix } from 'src/entities/approval.entity';
import { EnterpriseSeedService } from './enterprise-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GwpSet,
      GwpValue,
      MasterUnit,
      MasterFactorVersion,
      MasterFuel,
      EmissionFactor,
      UnitConversion,
      ApprovalModules,
      ApprovalMatrix,
    ]),
  ],
  providers: [EnterpriseSeedService],
  exports: [EnterpriseSeedService],
})
export class SeedsModule {}
