import { Module } from '@nestjs/common';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { UtilService } from 'src/utility/util/util.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MasterCountry,
  MasterGender,
  MasterHobbies,
  MasterState,
} from 'src/entities/master.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterCountry,
      MasterState,
      MasterGender,
      MasterHobbies,
    ]),
  ],
  controllers: [MastersController],
  providers: [MastersService, UtilService],
})
export class MastersModule {}
