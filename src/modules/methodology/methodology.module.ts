import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GwpSet } from 'src/entities/gwp-set.entity';
import { GwpValue } from 'src/entities/gwp-value.entity';
import { EmissionFactor } from 'src/entities/emission-factor.entity';
import { UnitConversion } from 'src/entities/unit-conversion.entity';
import { MasterFuel } from 'src/entities/master-fuel.entity';
import { MasterFactorVersion } from 'src/entities/master-factor-version.entity';
import { MasterUnit } from 'src/entities/master-unit.entity';
import { MethodologyController } from './methodology.controller';
import { MethodologyService } from './methodology.service';
import { FactorResolutionService } from './factor-resolution.service';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GwpSet,
      GwpValue,
      EmissionFactor,
      UnitConversion,
      MasterFuel,
      MasterFactorVersion,
      MasterUnit,
    ]),
  ],
  controllers: [MethodologyController],
  providers: [MethodologyService, FactorResolutionService, UtilService],
  exports: [MethodologyService, FactorResolutionService],
})
export class MethodologyModule {}
