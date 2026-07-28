import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { UserAuthenticationDetails, UserDetails } from 'src/entities/user.entity';
import { CreateOrganizationDto, AddOrganizationMemberDto } from 'src/dto/organization.dto';
import { CommonListPayloadDto } from 'src/dto/common-list.dto';
import { ICommonSortFieldObject } from 'src/utility/base-interface.interface';
import { UtilService } from 'src/utility/util/util.service';
import * as bcrypt from 'bcryptjs';
import { MasterRole } from 'src/enums/casl.enum';
import { LoginMasterType } from 'src/enums/registration.enum';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
    @InjectRepository(UserDetails)
    private readonly userRepo: Repository<UserDetails>,
    private readonly utilService: UtilService,
  ) {}

  async onboardOrganization(
    dto: CreateOrganizationDto,
    superAdminId: number,
  ) {
    // 1. Check if organization code or name already exists
    const existingOrg = await this.organizationRepo.findOne({
      where: [{ code: dto.code }, { name: dto.name }],
    });
    if (existingOrg) {
      throw new ConflictException('Organization name or code already exists');
    }

    // 2. Check if admin email or username already exists
    const existingUser = await this.userRepo.findOne({
      where: [{ email: dto.adminEmail }, { userName: dto.adminUserName }],
    });
    if (existingUser) {
      throw new ConflictException('Admin email or username already registered');
    }

    // 3. Execute atomic transaction to create Organization + Admin user
    const queryRunner = await this.utilService.connectQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Create Organization record
      const orgEntity = queryRunner.manager.create(Organization, {
        name: dto.name,
        code: dto.code,
        contactEmail: dto.contactEmail,
        emailDomain: dto.emailDomain || null,
        createdBy: superAdminId,
        isActive: true,
      });
      const savedOrg = await queryRunner.manager.save(Organization, orgEntity);

      // Create Admin user (roleId: 2 = Admin)
      const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
      const adminEntity = queryRunner.manager.create(UserDetails, {
        userName: dto.adminUserName,
        email: dto.adminEmail,
        password: hashedPassword,
        roleId: MasterRole.ADMIN, // roleId 2
        organizationId: savedOrg.id,
        firstName: dto.adminFirstName || dto.adminUserName,
        lastName: dto.adminLastName || null,
        isActive: true,
        isVerified: true,
        createdBy: superAdminId,
      });
      const savedAdmin = await queryRunner.manager.save(UserDetails, adminEntity);

      // Create Auth Details for Admin user
      const authDetails = queryRunner.manager.create(UserAuthenticationDetails, {
        userId: savedAdmin.id,
        attemptedCount: 0,
        isBlocked: false,
        masterLoginTypeId: LoginMasterType.LOGIN,
        createdBy: superAdminId,
      });
      await queryRunner.manager.save(UserAuthenticationDetails, authDetails);

      await queryRunner.commitTransaction();

      return {
        organization: {
          id: savedOrg.id,
          name: savedOrg.name,
          code: savedOrg.code,
          contactEmail: savedOrg.contactEmail,
        },
        adminUser: {
          id: savedAdmin.id,
          userName: savedAdmin.userName,
          email: savedAdmin.email,
          roleId: savedAdmin.roleId,
          organizationId: savedAdmin.organizationId,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Organization onboarding failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getAllOrganizations() {
    return this.organizationRepo.find({
      order: { id: 'ASC' },
    });
  }

  async getOrganizationById(id: number) {
    return this.organizationRepo.findOne({
      where: { id },
    });
  }

  async updateOrganization(id: number, data: Partial<Organization>) {
    const org = await this.getOrganizationById(id);
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    await this.organizationRepo.update(id, data);
    return this.getOrganizationById(id);
  }

  async deleteOrganization(id: number) {
    const org = await this.getOrganizationById(id);
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    await this.organizationRepo.update(id, { isActive: false });
    return { message: 'Organization deactivated successfully', id };
  }

  async getOrganizationFilterList(payload: CommonListPayloadDto) {
    const tableName = 'org';
    const tableSortCheck = ['id', 'name', 'code', 'contactEmail', 'isActive', 'createdOn'];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'org.id',
      name: 'org.name',
      code: 'org.code',
      contactEmail: 'org.contactEmail',
      isActive: 'org.isActive',
      createdOn: 'org.createdOn',
    };

    const processedPayload = await this.utilService.processListPayload(
      payload || {},
      tableName,
      tableSortCheck,
      sortFieldObject,
      10,
      'id',
    );

    const { offSet, limit, sortField, sortOrder } = processedPayload;
    const { searchInput = '' } = payload || {};

    const query = this.organizationRepo.createQueryBuilder(tableName);

    if (searchInput && searchInput.trim()) {
      const term = `%${searchInput.trim().toLowerCase()}%`;
      query.where(
        'LOWER(org.name) LIKE :term OR LOWER(org.code) LIKE :term OR LOWER(org.contactEmail) LIKE :term',
        { term },
      );
    }

    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();

    return {
      listData,
      dataCount,
    };
  }

  async getOrganizationUsersFilterList(
    orgId: number,
    payload: CommonListPayloadDto,
  ) {
    const tableName = 'user';
    const tableSortCheck = [
      'id',
      'firstName',
      'lastName',
      'email',
      'userName',
      'roleId',
      'isActive',
      'createdOn',
    ];
    const sortFieldObject: ICommonSortFieldObject = {
      id: 'user.id',
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      email: 'user.email',
      userName: 'user.userName',
      roleId: 'user.roleId',
      isActive: 'user.isActive',
      createdOn: 'user.createdOn',
    };

    const processedPayload = await this.utilService.processListPayload(
      payload || {},
      tableName,
      tableSortCheck,
      sortFieldObject,
      10,
      'id',
    );

    const { offSet, limit, sortField, sortOrder } = processedPayload;
    const { searchInput = '' } = payload || {};

    const query = this.userRepo
      .createQueryBuilder(tableName)
      .where('user.organizationId = :orgId', { orgId });

    if (searchInput && searchInput.trim()) {
      const term = `%${searchInput.trim().toLowerCase()}%`;
      query.andWhere(
        '(LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term OR LOWER(user.email) LIKE :term OR LOWER(user.userName) LIKE :term)',
        { term },
      );
    }

    const orderDirection = sortOrder === -1 ? 'DESC' : 'ASC';
    query.orderBy(sortField, orderDirection);
    query.skip(offSet).take(limit);

    const [listData, dataCount] = await query.getManyAndCount();

    return {
      listData,
      dataCount,
    };
  }

  async addMemberToOrganization(
    orgId: number,
    dto: AddOrganizationMemberDto,
    creatorId: number,
  ) {
    const org = await this.getOrganizationById(orgId);
    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const existingUser = await this.userRepo.findOne({
      where: [{ email: dto.email }, { userName: dto.userName }],
    });
    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userEntity = this.userRepo.create({
      userName: dto.userName,
      email: dto.email,
      password: hashedPassword,
      roleId: dto.roleId || MasterRole.USER,
      organizationId: orgId,
      firstName: dto.firstName,
      lastName: dto.lastName || null,
      isActive: true,
      isVerified: true,
      createdBy: creatorId,
    });
    const savedUser = await this.userRepo.save(userEntity);

    return {
      id: savedUser.id,
      userName: savedUser.userName,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      roleId: savedUser.roleId,
      organizationId: savedUser.organizationId,
    };
  }
}
