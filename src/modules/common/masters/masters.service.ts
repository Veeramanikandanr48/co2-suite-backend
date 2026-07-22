import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MasterCountry,
  MasterGender,
  MasterHobbies,
  MasterState,
} from 'src/entities/master.entity';
import { Repository } from 'typeorm';
@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(MasterCountry)
    private masterCountryRepository: Repository<MasterCountry>,
    @InjectRepository(MasterState)
    private masterStateRepository: Repository<MasterState>,
    @InjectRepository(MasterGender)
    private masterGenderRepository: Repository<MasterGender>,
    @InjectRepository(MasterHobbies)
    private masterHobbiesRepository: Repository<MasterHobbies>,
  ) {}

  async getMasterCountries() {
    return await this.masterCountryRepository.find({
      select: { id: true, countryName: true, countryCode: true, isActive: true },
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async getStatesByCountryId(countryId: number) {
    return await this.masterStateRepository
      .createQueryBuilder('s')
      .innerJoin(MasterCountry, 'c', 'c.id = s.countryId and c.isActive = true')
      .select(
        's.id, s.stateName, s.stateCode, s.isActive, s.countryId, c.countryName, c.countryCode',
      )
      .where('s.isActive = true')
      .andWhere('s.countryId = :countryId', { countryId })
      .getRawMany();
  }

  async getMasterGenders() {
    return await this.masterGenderRepository.find({
      select: { id: true, genderName: true, genderShortName: true },
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async getMasterHobbies() {
    return await this.masterHobbiesRepository.find({
      select: { id: true, hobbyName: true },
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }
}
