import {
  ApprovalDetailsResponse,
  IApprovalData,
  IApprovalRemarksData,
  IApprovalUpdatePayload,
  INextAprDetail,
} from 'src/interfaces/approval.interface';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import {
  ApprovalModules,
  UserApproval,
  ApprovalMatrix,
  UserApprovalRemarksMapping,
} from 'src/entities/approval.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILoggerMethods } from 'src/utility/base-interface.interface';
import { MasterApprovalStatus, MasterRoles } from 'src/entities/master.entity';
import { Injectable } from '@nestjs/common';
import { ApprovalStatusEnum } from 'src/enums/approval.enum';

@Injectable()
export class ApprovalService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ApprovalModules)
    private readonly approvalModuleRepository: Repository<ApprovalModules>,
    @InjectRepository(UserApproval)
    private readonly userApprovalRepository: Repository<UserApproval>,
    @InjectRepository(ApprovalMatrix)
    private readonly approvalMatrixRepository: Repository<ApprovalMatrix>,
    @InjectRepository(UserApprovalRemarksMapping)
    private readonly userApprovalRemarksMappingRepository: Repository<UserApprovalRemarksMapping>,
  ) { }

  private validateSqlIdentifier(value: string, fieldName: string): string {
    const valid = value
      .split('.')
      .every((part) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part));
    if (!valid) {
      throw new Error(`Invalid approval module ${fieldName}`);
    }
    return value
      .split('.')
      .map((part) => `"${part}"`)
      .join('.');
  }

  private validateConditionName(conditionName: string): string {
    const clause = '("[a-zA-Z_][a-zA-Z0-9_]*"|[a-zA-Z_][a-zA-Z0-9_]*)';
    const operator = '(=|!=|<>|>|>=|<|<=|IS NULL|IS NOT NULL|LIKE)';
    const literal = "('[^']*'|\\d+(\\.\\d+)?|true|false|NULL)";
    const singleCondition = new RegExp(
      `^\\s*${clause}\\s*${operator}(\\s+${literal})?\\s*$`,
      'i',
    );

    if (singleCondition.test(conditionName)) {
      return conditionName;
    }

    const conditions = conditionName.split(/\s+(AND|OR)\s+/i);
    if (
      conditions.length > 1 &&
      conditions.every((part) => singleCondition.test(part))
    ) {
      return conditionName;
    }

    throw new Error('Invalid approval matrix condition');
  }

  async insertUserApprovalWithQueryRunner(
    data: IApprovalData,
    queryRunner: QueryRunner,
  ) {
    const {
      approvalModuleUniqueId,
      approvalModuleId,
      isRoleApproval,
      userRoleId,
      userId,
      toUserId,
      approvalStatusId,
      reason,
      servicePartnerId,
      masterServiceTypeId,
      logger,
    } = data;

    const tempDocApproval = [];

    const [approvalModule, approvalMatrix] = await Promise.all([
      this.getApprovalModuleDetails(approvalModuleId),
      this.getApprovalMatrixByModuleId(approvalModuleId),
    ]);
    logger?.info('Approval module and approval matrix fetched');
    logger?.info(
      `Total approval matrix found for this module: ${approvalMatrix.length}`,
    );

    if (!approvalMatrix.length || !approvalModule) {
      logger?.info('No approval matrix found for this module');
      return false;
    }

    for (const matrix of approvalMatrix) {
      const mappingTable = this.validateSqlIdentifier(
        approvalModule.mappingTable,
        'mappingTable',
      );
      const mappingColumn = this.validateSqlIdentifier(
        approvalModule.mappingColumn,
        'mappingColumn',
      );
      const conditionName = this.validateConditionName(matrix.conditionName);
      const query = `SELECT COUNT(*) as "totalCount" FROM ${mappingTable} WHERE ${mappingColumn} = $1 AND ${conditionName} AND "isActive" = true`;

      const result = await queryRunner.query(query, [approvalModuleUniqueId]);

      const totalCount = result?.[0]?.totalCount
        ? Number(result[0].totalCount)
        : 0;

      if (totalCount > 0) tempDocApproval.push(matrix);
    }

    logger?.info(
      `Total approval matrix found for this module with condition: ${tempDocApproval.length}`,
    );

    const matrixRoles = tempDocApproval.map((m) => m.toRoleId);
    logger?.info(`Matrix roles: ${matrixRoles.join(', ')}`);

    const maxApprovalOrder = Math.max(
      ...tempDocApproval.map((m) => m.approvalOrder),
    );
    logger?.info(`Max approval order: ${maxApprovalOrder}`);

    const maxApprovalOrderRole = tempDocApproval.find(
      (m) => m.approvalOrder === maxApprovalOrder && m.toRoleId === userRoleId,
    )?.toRoleId;
    logger?.info(`Max approval order role: ${maxApprovalOrderRole}`);

    const currentUserMatrix = tempDocApproval.find(
      (m) => m.toRoleId === userRoleId,
    );
    const partiallyAppOrderList = currentUserMatrix
      ? tempDocApproval.filter(
        (m) => m.approvalOrder < currentUserMatrix.approvalOrder,
      )
      : [];
    logger?.info(
      `Partially approved order list: ${partiallyAppOrderList.map((m) => m.approvalOrder).join(', ')}`,
    );

    const isMaxApprove = maxApprovalOrderRole === userRoleId;
    logger?.info(`Is max approve: ${isMaxApprove}`);

    // order by approvalOrder
    tempDocApproval.sort((a, b) => a.approvalOrder - b.approvalOrder);
    logger?.info(`Approval matrix sorted by approval order`);

    const minOrder = Math.min(...tempDocApproval.map((m) => m.approvalOrder));
    logger?.info(`Min order: ${minOrder}`);

    const userApprovalData = [];
    for (let i = 0; i < tempDocApproval.length; i++) {
      const e = tempDocApproval[i];
      const isPartiallyApproved = partiallyAppOrderList.some(
        (p) => p.id === e.id,
      );
      const isCurrUserRole = e.toRoleId === userRoleId;

      const isNextApprover = !matrixRoles.includes(userRoleId)
        ? minOrder === e.approvalOrder
        : false;
      logger?.info(`Is next approver: ${isNextApprover}`);

      const approvalStatusId =
        isMaxApprove || isPartiallyApproved
          ? ApprovalStatusEnum.APPROVE
          : isCurrUserRole
            ? ApprovalStatusEnum.APPROVE
            : ApprovalStatusEnum.PENDING;
      logger?.info(`Approval status: ${approvalStatusId}`);

      const isCurrApprover = !isMaxApprove && isCurrUserRole;
      logger?.info(`Is curr approver: ${isCurrApprover}`);

      userApprovalData.push({
        approvalModuleUniqueId,
        approvalModuleId,
        approvalOrder: e.approvalOrder,
        approvalGroup: e.approvalGroup,
        isParallel: e.isParallel,
        isCurrApprover,
        isNextApprover,
        approvalStatusId,
        createdBy: userId,
        isRoleApproval,
        toRoleId: e.toRoleId,
        userRoleId,
        servicePartnerId,
        masterServiceTypeId,
        toUserId,
      });
    }

    await queryRunner.manager.insert(UserApproval, userApprovalData);
    logger.info('User approval inserted successfully with query runner');
    return true;
  }

  async updateUserApprovalWithQueryRunner(
    data: IApprovalData,
    queryRunner: QueryRunner,
  ) {
    const {
      approvalModuleUniqueId,
      approvalModuleId,
      approvalStatusId,
      reason,
      userId,
      userRoleId,
      logger,
    } = data;

    const approvalModule =
      await this.getApprovalModuleDetails(approvalModuleId);
    if (!approvalModule) {
      logger.info('Approval module not found');
      return false;
    }
    logger.info(`Approval module found`);

    const [nextApprovalDetail, maxApprovalOrder] = await Promise.all([
      this.getNextApprovarDetailsWithQRunner(
        approvalModuleUniqueId,
        approvalModuleId,
        queryRunner,
      ),
      this.getMaxApprovalOrder(approvalModuleUniqueId, approvalModuleId),
    ]);
    logger.info(`Next approval detail and max approval order fetched`);

    if (!nextApprovalDetail || nextApprovalDetail.toRoleId != userRoleId) {
      logger.info(
        `Role Id ${userRoleId} is not the current approvar for this approval module`,
      );
      return false;
    }
    logger.info(
      `Role Id ${userRoleId} is the current approvar for this approval module`,
    );

    await queryRunner.manager.update(
      UserApproval,
      { approvalModuleUniqueId, approvalModuleId, isCurrApprover: true },
      {
        isCurrApprover: false,
        updatedBy: userId,
      },
    );
    logger.info(`Successfully updated current approver for approval module`);

    await queryRunner.manager.update(
      UserApproval,
      {
        approvalModuleUniqueId,
        approvalModuleId,
        toRoleId: userRoleId,
        isNextApprover: true,
      },
      {
        approvalStatusId,
        isNextApprover: false,
        isCurrApprover: true,
        updatedBy: userId,
      },
    );
    logger.info(`Successfully updated next approver for approval module`);

    if (nextApprovalDetail.approvalOrder < maxApprovalOrder.maxApprovalOrder) {
      if (approvalStatusId != ApprovalStatusEnum.REJECT) {
        await queryRunner.manager.update(
          UserApproval,
          {
            approvalModuleUniqueId,
            approvalModuleId,
            approvalOrder: nextApprovalDetail.approvalOrder + 1,
          },
          {
            isNextApprover: true,
            approvalStatusId: ApprovalStatusEnum.PENDING,
            updatedBy: userId,
          },
        );
        logger.info(`Successfully updated next approver for approval module`);
      } else {
        logger.info(
          'Approval status is rejected, so no need to update the approval order',
        );
      }
    } else {
      logger.info('Approval order mismatching.');
      return true;
    }
    return true;
  }

  getNextApprovarDetails(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
  ): Promise<INextAprDetail> {
    return this.userApprovalRepository
      .createQueryBuilder()
      .select([
        '"approvalOrder"',
        '"approvalGroup"',
        '"isParallel"',
        '"toRoleId"',
        '"approvalStatusId"',
      ])
      .where('"approvalModuleUniqueId" = :approvalModuleUniqueId', {
        approvalModuleUniqueId,
      })
      .andWhere('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
      .andWhere('"isNextApprover" = true')
      .getRawOne();
  }

  getNextApprovarDetailsWithQRunner(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
    queryRunner: QueryRunner,
  ): Promise<INextAprDetail> {
    return queryRunner.manager
      .getRepository(UserApproval)
      .createQueryBuilder()
      .select([
        '"approvalOrder"',
        '"approvalGroup"',
        '"isParallel"',
        '"toRoleId"',
        '"approvalStatusId"',
      ])
      .where('"approvalModuleUniqueId" = :approvalModuleUniqueId', {
        approvalModuleUniqueId,
      })
      .andWhere('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
      .andWhere('"isNextApprover" = true')
      .getRawOne();
  }

  async getMaxApprovalOrder(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
  ) {
    return await this.userApprovalRepository
      .createQueryBuilder()
      .select('MAX("approvalOrder") as "maxApprovalOrder"')
      .where('"approvalModuleUniqueId" = :approvalModuleUniqueId', {
        approvalModuleUniqueId,
      })
      .andWhere('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
      .getRawOne<{ maxApprovalOrder: number }>();
  }

  getRoleApproveDetail(
    approvalModuleUniqueId: number,
    toRoleId: number,
  ): Promise<INextAprDetail> {
    return this.userApprovalRepository
      .createQueryBuilder('userApproval')
      .select(['"approvalOrder"', '"approvalGroup"', '"isParallel"'])
      .where('"approvalModuleUniqueId" = :approvalModuleUniqueId', {
        approvalModuleUniqueId,
      })
      .andWhere('"toRoleId" = :toRoleId', { toRoleId })
      .getRawOne();
  }

  async getApprovalModuleDetails(approvalModuleId: number) {
    return await this.approvalModuleRepository
      .createQueryBuilder('approvalModule')
      .where('"id" = :approvalModuleId', { approvalModuleId })
      .andWhere('"isActive" = true')
      .select(
        '"mappingTable", "mappingColumn", "moduleName", "moduleShortName", "id"',
      )
      .getRawOne();
  }

  async getApprovalMatrixByModuleId(approvalModuleId: number) {
    return await this.approvalMatrixRepository
      .createQueryBuilder('approvalMatrix')
      .where('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
      .andWhere('"isActive" = true')
      .select(
        '"id", "conditionName", "toRoleId", "approvalOrder", "approvalGroup", "isParallel", "approvalModuleId"',
      )
      .getRawMany();
  }

  // Get Approval Details With All Details (Current Approver, Previous Approver, Role Status)
  async getApprovalDetails(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
    toRoleId: number,
  ): Promise<ApprovalDetailsResponse> {
    return this.userApprovalRepository
      .createQueryBuilder('userApproval')
      .select('"approvalModuleUniqueId"')
      .addSelect(
        (qb) =>
          qb
            .select(
              `
                        jsonb_build_object(
                            'apprStatusId', doc."approvalStatusId",
                            'hasAccess', doc."isNextApprover",
                            'apprStatusName', apst."name"
                        )
                    `,
            )
            .from(UserApproval, 'doc')
            .innerJoin(
              MasterApprovalStatus,
              'apst',
              'apst.id = doc.approvalStatusId',
            )
            .where(
              'doc.approvalModuleUniqueId = userApproval.approvalModuleUniqueId AND doc.toRoleId = :toRoleId AND doc.approvalModuleId = :approvalModuleId',
              { toRoleId, approvalModuleId },
            )
            .limit(1),
        'roleStatus',
      )
      .addSelect(
        (qb) =>
          qb
            .select(
              `
                        jsonb_build_object(
                            'currentApprover', role."roleName",
                            'currentApprovalOrder', doc."approvalOrder"
                        )
                    `,
            )
            .from(MasterRoles, 'role')
            .innerJoin(UserApproval, 'doc', 'doc.toRoleId = role.id')
            .where(
              'doc.approvalModuleUniqueId = userApproval.approvalModuleUniqueId AND doc.isNextApprover = true AND doc.approvalModuleId = :approvalModuleId',
              { approvalModuleId },
            )
            .limit(1),
        'currentApprDet',
      )
      .addSelect(
        (qb) =>
          qb
            .select(
              `
                        COALESCE(
                            jsonb_build_object(
                                'previousAppr', role."roleName",
                                'previousApprId', role."id",
                                'roleName', role."roleName"
                            ),
                            jsonb_build_object(
                                'previousAppr', 'User',
                                'previousApprId', 0,
                                'roleName', 'User'
                            )
                        )
                    `,
            )
            .from(MasterRoles, 'role')
            .innerJoin(UserApproval, 'doc', 'doc.toRoleId = role.id')
            .where(
              'doc.approvalModuleUniqueId = userApproval.approvalModuleUniqueId AND doc.isCurrApprover = true AND doc.approvalModuleId = :approvalModuleId',
              { approvalModuleId },
            )
            .limit(1),
        'previousApprDet',
      )
      .where('userApproval.approvalModuleUniqueId = :approvalModuleUniqueId', {
        approvalModuleUniqueId,
      })
      .getRawOne<ApprovalDetailsResponse>();
  }

  // Get Has Access Only
  async checkApprovalAccess(
    approvalModuleId: number,
    userRoleId: number,
    approvalModuleUniqueId: number,
  ) {
    return await this.userApprovalRepository
      .createQueryBuilder('userApproval')
      .select('"isNextApprover" as "hasAccess"')
      .where('"approvalModuleUniqueId" = :approvalModuleUniqueId', {
        approvalModuleUniqueId,
      })
      .andWhere('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
      .andWhere('"toRoleId" = :userRoleId', { userRoleId })
      .getRawOne();
  }

  async checkApprovalExist(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
  ) {
    return await this.userApprovalRepository
      .createQueryBuilder()
      .where(
        '("approvalModuleUniqueId" =:approvalModuleUniqueId and "approvalModuleId" =:approvalModuleId)',
        { approvalModuleUniqueId, approvalModuleId },
      )
      .getExists();
  }

  async updateApprovalRemarks(data: IApprovalRemarksData) {
    return await this.userApprovalRemarksMappingRepository.save(data);
  }

  async getUserApproval(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
  ) {
    return await this.userApprovalRepository
      .createQueryBuilder('userApproval')
      .where(
        '"approvalModuleUniqueId" = :approvalModuleUniqueId AND "approvalModuleId" = :approvalModuleId AND "isCurrApprover" = true AND "approvalStatusId" = :approvalStatusId',
        {
          approvalModuleUniqueId,
          approvalModuleId,
          approvalStatusId: ApprovalStatusEnum.REJECT,
        },
      )
      .select('"id"')
      .getRawOne();
  }

  async saveUserApproval(data: Record<string, unknown>) {
    return await this.userApprovalRepository.save(
      data as unknown as UserApproval,
    );
  }

  async updateUserApprovalEntries(data: IApprovalUpdatePayload) {
    return await this.userApprovalRepository.update(
      {
        approvalModuleId: data.approvalModuleId,
        approvalModuleUniqueId: data.approvalModuleUniqueId,
      },
      data,
    );
  }

  async checkAllApproved(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
  ) {
    return await this.userApprovalRepository
      .createQueryBuilder()
      .where(
        '"approvalModuleUniqueId" = :approvalModuleUniqueId AND "approvalModuleId" = :approvalModuleId',
        { approvalModuleUniqueId, approvalModuleId },
      )
      .andWhere('"approvalStatusId" = :approvalStatusId', {
        approvalStatusId: ApprovalStatusEnum.APPROVE,
      })
      .getExists();
  }

  async checkAnyRejected(
    approvalModuleUniqueId: number,
    approvalModuleId: number,
  ) {
    return await this.userApprovalRepository
      .createQueryBuilder()
      .where(
        '"approvalModuleUniqueId" = :approvalModuleUniqueId AND "approvalModuleId" = :approvalModuleId',
        { approvalModuleUniqueId, approvalModuleId },
      )
      .andWhere('"approvalStatusId" = :approvalStatusId', {
        approvalStatusId: ApprovalStatusEnum.REJECT,
      })
      .getExists();
  }

  async insertDynamicApproval(data: {
    approvalModuleId: number;
    primaryId: number;
    notificationTitle?: string;
    notificationBody?: string;
    url?: string;
    isNeedNotify?: boolean;
    userId: number;
    userRoleId: number;
    branchId: number;
    logger?: ILoggerMethods;
  }): Promise<boolean> {
    try {
      const {
        approvalModuleId,
        primaryId,
        userId,
        userRoleId,
        branchId,
        isNeedNotify = false,
        logger,
      } = data;
      logger?.info('insertDynamicApproval: Method Start');

      const [approvalModule, baseApprovalMatrix] = await Promise.all([
        this.getApprovalModuleDetails(approvalModuleId),
        this.approvalMatrixRepository
          .createQueryBuilder('matrix')
          .select([
            'matrix.id',
            'matrix.approvalModuleId',
            'matrix.fieldName',
            'matrix.conditionName',
            'matrix.approvalOrder',
            'matrix.approvalGroup',
            'matrix.isParallel',
            'matrix.toRoleId',
            'matrix.isActive',
          ])
          .where('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
          .andWhere('"fieldName" = :fieldName', { fieldName: 'None' })
          .andWhere('"isActive" = true')
          .getMany(),
      ]);

      if (!approvalModule) {
        logger?.error('ApprovalModule is null');
        return false;
      }

      const tempApprovalMatrix = [...baseApprovalMatrix];

      const conditionalMatrix = await this.approvalMatrixRepository
        .createQueryBuilder('matrix')
        .select([
          'matrix.id',
          'matrix.approvalModuleId',
          'matrix.fieldName',
          'matrix.conditionName',
          'matrix.approvalOrder',
          'matrix.approvalGroup',
          'matrix.isParallel',
          'matrix.toRoleId',
          'matrix.isActive',
        ])
        .where('"approvalModuleId" = :approvalModuleId', { approvalModuleId })
        .andWhere('"fieldName" != :fieldName', { fieldName: 'None' })
        .andWhere('"isActive" = true')
        .getMany();

      for (const matrix of conditionalMatrix) {
        const mappingTable = this.validateSqlIdentifier(
          approvalModule.mappingTable,
          'mappingTable',
        );
        const mappingColumn = this.validateSqlIdentifier(
          approvalModule.mappingColumn,
          'mappingColumn',
        );
        const conditionName = this.validateConditionName(matrix.conditionName);
        const query = `SELECT COUNT(*) as "countOfVal" FROM ${mappingTable} 
                    WHERE ${mappingColumn} = $1 
                    AND ${conditionName} 
                    AND "isActive" = true`;

        const result = await this.dataSource.query(query, [primaryId]);
        const countOfVal = result?.[0]?.countOfVal
          ? Number(result[0].countOfVal)
          : 0;

        if (countOfVal > 0) {
          tempApprovalMatrix.push(matrix);
        }
      }

      const matrixRoles = tempApprovalMatrix.map((m) => m.toRoleId);
      const maxApprovalOrder = Math.max(
        ...tempApprovalMatrix.map((m) => m.approvalOrder),
      );
      const maxApprovalOrderRole = tempApprovalMatrix.find(
        (m) =>
          m.approvalOrder === maxApprovalOrder && m.toRoleId === userRoleId,
      )?.toRoleId;

      const currentUserMatrix = tempApprovalMatrix.find(
        (m) => m.toRoleId === userRoleId,
      );
      const partiallyAppOrderList = currentUserMatrix
        ? tempApprovalMatrix.filter(
          (m) => m.approvalOrder < currentUserMatrix.approvalOrder,
        )
        : [];

      const isMaxApprove = maxApprovalOrderRole === userRoleId;

      tempApprovalMatrix.sort((a, b) => a.approvalOrder - b.approvalOrder);
      const minOrder = Math.min(
        ...tempApprovalMatrix.map((m) => m.approvalOrder),
      );

      const userApprovals = tempApprovalMatrix.map((matrix) => {
        const isPartiallyApproved = partiallyAppOrderList.some(
          (p) => p.id === matrix.id,
        );
        const isCurrUserRole = matrix.toRoleId === userRoleId;

        return {
          approvalModuleId: matrix.approvalModuleId,
          approvalModuleUniqueId: primaryId,
          approvalOrder: matrix.approvalOrder,
          userRoleId: matrix.toRoleId,
          branchId,
          isParallel: matrix.isParallel,
          submittedRoleId: userRoleId,
          approvalStatusId:
            isMaxApprove || isPartiallyApproved
              ? ApprovalStatusEnum.APPROVE
              : isCurrUserRole
                ? ApprovalStatusEnum.APPROVE
                : ApprovalStatusEnum.PENDING,
          isNextApprover: !matrixRoles.includes(userRoleId)
            ? minOrder === matrix.approvalOrder
            : false,
          isCurrApprover: !isMaxApprove && isCurrUserRole,
          createdBy: userId,
          isActive: true,
          url: data.url || '',
        };
      });

      await this.userApprovalRepository.save(userApprovals);
      logger?.info('insertDynamicApproval: Method End');
      return true;
    } catch (error) {
      data.logger?.error(
        `Exception occurred in insertDynamicApproval: ${error.message}`,
      );
      return false;
    }
  }

  async updateApproval(
    approvalModuleId: number,
    primaryId: number,
    status: number,
    remarks?: string,
    // notify?: NotificationInsertViewModel
  ): Promise<boolean> {
    const logger = { info: (_msg: string) => { }, error: (_msg: string) => { } };
    const roleId = 1;
    const userId = 1;

    try {
      const [allApproverData] = await Promise.all([
        this.userApprovalRepository
          .createQueryBuilder('ua')
          .select([
            'ua.id',
            'ua.approvalModuleId',
            'ua.approvalModuleUniqueId',
            'ua.approvalOrder',
            'ua.approvalGroup',
            'ua.isParallel',
            'ua.toRoleId',
            'ua.approvalStatusId',
            'ua.isNextApprover',
            'ua.isCurrApprover',
            'ua.isActive',
          ])
          .where('ua.approvalModuleId = :approvalModuleId', {
            approvalModuleId,
          })
          .andWhere('ua.approvalModuleUniqueId = :primaryId', { primaryId })
          .andWhere('ua.isActive = :isActive', { isActive: true })
          .getMany(),
        // this.getCurrentUserRoleId(), // You'll need to implement this method
        // this.getCurrentUserId(), // You'll need to implement this method
      ]);

      if (!allApproverData.length) {
        logger.error('User approval data is null');
        return false;
      }

      // Reset all current approvers
      await this.userApprovalRepository.update(
        { approvalModuleId, approvalModuleUniqueId: primaryId },
        { isCurrApprover: false },
      );

      const changeStatus = await this.userApprovalRepository
        .createQueryBuilder('ua')
        .select([
          'ua.id',
          'ua.approvalModuleId',
          'ua.approvalModuleUniqueId',
          'ua.approvalOrder',
          'ua.approvalGroup',
          'ua.isParallel',
          'ua.toRoleId',
          'ua.approvalStatusId',
          'ua.isNextApprover',
          'ua.isCurrApprover',
          'ua.isActive',
        ])
        .where('ua.approvalModuleUniqueId = :primaryId', { primaryId })
        .andWhere('ua.approvalModuleId = :approvalModuleId', {
          approvalModuleId,
        })
        .andWhere('ua.isActive = :isActive', { isActive: true })
        .andWhere('ua.toRoleId = :roleId', { roleId })
        .andWhere('ua.approvalStatusId = :status', {
          status: ApprovalStatusEnum.PENDING,
        })
        .andWhere('ua.isNextApprover = :isNextApprover', {
          isNextApprover: true,
        })
        .orderBy('ua.approvalOrder', 'ASC')
        .getOne();

      if (!changeStatus) {
        logger.error('ChangeStatus is null');
        return false;
      }

      const secondMinApprovalData = allApproverData.filter(
        (a) =>
          a.approvalOrder !== changeStatus.approvalOrder &&
          !a.isCurrApprover &&
          a.approvalOrder > changeStatus.approvalOrder,
      );

      const secondMinApproval =
        secondMinApprovalData.length > 0
          ? Math.min(...secondMinApprovalData.map((a) => a.approvalOrder))
          : 0;

      if (status === ApprovalStatusEnum.APPROVE && secondMinApproval !== 0) {
        await this.userApprovalRepository.update(
          {
            approvalModuleId,
            approvalModuleUniqueId: primaryId,
            approvalOrder: In([secondMinApproval, changeStatus.approvalOrder]),
          },
          {
            isNextApprover: false,
            isCurrApprover: false,
            approvalStatusId: ApprovalStatusEnum.PENDING,
          },
        );

        // Update specific records
        await this.userApprovalRepository.update(
          { approvalOrder: secondMinApproval },
          { isNextApprover: true },
        );

        await this.userApprovalRepository.update(
          { approvalOrder: changeStatus.approvalOrder },
          {
            approvalStatusId: ApprovalStatusEnum.APPROVE,
            isCurrApprover: true,
          },
        );
      } else if (status === ApprovalStatusEnum.APPROVE) {
        await this.userApprovalRepository.update(
          { approvalOrder: changeStatus.approvalOrder },
          {
            isNextApprover: false,
            isCurrApprover: true,
            approvalStatusId: ApprovalStatusEnum.APPROVE,
          },
        );
      } else {
        await this.userApprovalRepository.update(
          { approvalOrder: changeStatus.approvalOrder },
          {
            approvalStatusId: ApprovalStatusEnum.REJECT,
            isNextApprover: false,
            isCurrApprover: true,
          },
        );
      }

      // Save remarks if status is not approve
      if (status !== ApprovalStatusEnum.APPROVE && remarks) {
        await this.userApprovalRemarksMappingRepository.save({
          approvalModuleId,
          approvalModuleUniqueId: primaryId,
          remarks: remarks || '',
          createdBy: userId,
          statusId: status,
          isActive: true,
          branchId: 1, // You'll need to implement this
        });
      }

      logger.info('Method End');
      return true;
    } catch (error) {
      logger.error(`Exception occurred: ${error.message}`);
      return false;
    }
  }
}
