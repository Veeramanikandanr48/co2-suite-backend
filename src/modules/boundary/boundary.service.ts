import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationBoundary } from 'src/entities/organization-boundary.entity';
import { SourceInclusion } from 'src/entities/source-inclusion.entity';
import { AuditService } from 'src/modules/common/audit/audit.service';
import {
  CreateOrganizationBoundaryDto,
  CreateSourceInclusionDto,
  GetBoundaryQueryDto,
  ReviewSourceInclusionDto,
  UpdateOrganizationBoundaryDto,
  UpdateSourceInclusionDto,
} from 'src/dto/boundary.dto';
import { MasterRole } from 'src/enums/casl.enum';
import { AuditAction, InclusionStatus } from 'src/enums/ghg.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

@Injectable()
export class BoundaryService {
  constructor(
    @InjectRepository(OrganizationBoundary)
    private readonly boundaryRepo: Repository<OrganizationBoundary>,
    @InjectRepository(SourceInclusion)
    private readonly inclusionRepo: Repository<SourceInclusion>,
    private readonly auditService: AuditService,
  ) {}

  private assertNotRegularUser(user: IDecodeUserDetails): void {
    if (user?.roleId === MasterRole.USER) {
      throw new ForbiddenException('Regular users cannot perform this action');
    }
  }

  private resolveTargetOrgId(
    user: IDecodeUserDetails,
    requestedOrgId?: number,
  ): number | undefined {
    if (user?.roleId === MasterRole.SUPER_ADMIN) {
      return requestedOrgId || user?.organizationId || 1;
    }
    return user?.organizationId || requestedOrgId || 1;
  }

  // ─── Organization boundaries ───────────────────────────────────────────────

  async createBoundary(
    dto: CreateOrganizationBoundaryDto,
    user: IDecodeUserDetails,
  ): Promise<OrganizationBoundary> {
    this.assertNotRegularUser(user);
    const organizationId = this.resolveTargetOrgId(user, dto.organizationId);

    const existing = await this.boundaryRepo.findOne({
      where: { organizationId, reportingYear: dto.reportingYear, isActive: true },
    });
    if (existing) {
      throw new BadRequestException(
        `A boundary already exists for organization ${organizationId} in ${dto.reportingYear}. Use update instead.`,
      );
    }

    const entity = this.boundaryRepo.create({
      ...dto,
      organizationId,
      isActive: true,
      createdBy: user?.id,
    });
    const saved = await this.boundaryRepo.save(entity);

    await this.auditService.record({
      organizationId,
      entityType: 'organization_boundary',
      entityId: saved.id,
      entityLabel: `Boundary ${dto.reportingYear}`,
      action: AuditAction.CREATE,
      afterJson: saved as unknown as Record<string, unknown>,
      reason: 'Organizational boundary defined',
      actorId: user?.id,
    });
    return saved;
  }

  async listBoundaries(
    user: IDecodeUserDetails,
    query: GetBoundaryQueryDto,
  ): Promise<{ listData: OrganizationBoundary[]; dataCount: number }> {
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN
        ? query?.organizationId
        : user?.organizationId;

    const qb = this.boundaryRepo
      .createQueryBuilder('boundary')
      .where('boundary.isActive = :isActive', { isActive: true })
      .orderBy('boundary.reportingYear', 'DESC');

    if (targetOrgId) {
      qb.andWhere('boundary.organizationId = :orgId', { orgId: targetOrgId });
    }
    if (query?.reportingYear) {
      qb.andWhere('boundary.reportingYear = :year', {
        year: query.reportingYear,
      });
    }

    const [listData, dataCount] = await qb.getManyAndCount();
    return { listData, dataCount };
  }

  async getBoundary(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<OrganizationBoundary> {
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN ? undefined : user?.organizationId;
    const qb = this.boundaryRepo
      .createQueryBuilder('boundary')
      .where('boundary.id = :id', { id })
      .andWhere('boundary.isActive = :isActive', { isActive: true });
    if (targetOrgId) {
      qb.andWhere('boundary.organizationId = :orgId', { orgId: targetOrgId });
    }
    const boundary = await qb.getOne();
    if (!boundary) {
      throw new BadRequestException('Organization boundary not found');
    }
    return boundary;
  }

  async updateBoundary(
    id: number,
    dto: UpdateOrganizationBoundaryDto,
    user: IDecodeUserDetails,
  ): Promise<OrganizationBoundary> {
    this.assertNotRegularUser(user);
    const boundary = await this.getBoundary(id, user);
    const organizationId = this.resolveTargetOrgId(user, dto.organizationId);

    const before = { ...boundary };
    Object.assign(boundary, dto, {
      organizationId,
      updatedBy: user?.id,
    });
    const saved = await this.boundaryRepo.save(boundary);
    await this.auditService.record({
      organizationId,
      entityType: 'organization_boundary',
      entityId: saved.id,
      entityLabel: `Boundary ${saved.reportingYear}`,
      action: AuditAction.UPDATE,
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: saved as unknown as Record<string, unknown>,
      reason: 'Organizational boundary updated',
      actorId: user?.id,
    });
    return saved;
  }

  async deactivateBoundary(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertNotRegularUser(user);
    const boundary = await this.getBoundary(id, user);
    boundary.isActive = false;
    boundary.deletedBy = user?.id;
    await this.boundaryRepo.save(boundary);
    await this.auditService.record({
      organizationId: boundary.organizationId,
      entityType: 'organization_boundary',
      entityId: boundary.id,
      entityLabel: `Boundary ${boundary.reportingYear}`,
      action: AuditAction.DELETE,
      beforeJson: { isActive: true },
      afterJson: { isActive: false },
      reason: 'Organizational boundary deactivated',
      actorId: user?.id,
    });
    return { message: 'Organization boundary deactivated successfully' };
  }

  // ─── Source inclusions ─────────────────────────────────────────────────────

  async upsertInclusion(
    dto: CreateSourceInclusionDto,
    user: IDecodeUserDetails,
  ): Promise<SourceInclusion> {
    this.assertNotRegularUser(user);
    const organizationId = this.resolveTargetOrgId(user, dto.organizationId);

    const existing = await this.inclusionRepo.findOne({
      where: {
        organizationId,
        reportingYear: dto.reportingYear,
        sourceKey: dto.sourceKey,
        isActive: true,
      },
    });

    if (existing) {
      const before = { ...existing };
      const outcome = Object.assign(existing, dto, {
        organizationId,
        updatedBy: user?.id,
      });
      const saved = await this.inclusionRepo.save(outcome);
      await this.auditService.record({
        organizationId,
        entityType: 'source_inclusion',
        entityId: saved.id,
        entityLabel: `${dto.reportingYear} / ${dto.sourceKey}`,
        action:
          before.inclusionStatus !== saved.inclusionStatus
            ? AuditAction.BOUNDARY_CHANGE
            : AuditAction.UPDATE,
        beforeJson: before as unknown as Record<string, unknown>,
        afterJson: saved as unknown as Record<string, unknown>,
        reason: 'Source inclusion status updated',
        actorId: user?.id,
      });
      return saved;
    }

    const entity = this.inclusionRepo.create({
      ...dto,
      organizationId,
      isActive: true,
      createdBy: user?.id,
    });
    const saved = await this.inclusionRepo.save(entity);
    await this.auditService.record({
      organizationId,
      entityType: 'source_inclusion',
      entityId: saved.id,
      entityLabel: `${dto.reportingYear} / ${dto.sourceKey}`,
      action: AuditAction.CREATE,
      afterJson: saved as unknown as Record<string, unknown>,
      reason: 'Source inclusion record created',
      actorId: user?.id,
    });
    return saved;
  }

  async listInclusions(
    user: IDecodeUserDetails,
    query: GetBoundaryQueryDto,
  ): Promise<{ listData: SourceInclusion[]; dataCount: number }> {
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN
        ? query?.organizationId
        : user?.organizationId;

    const qb = this.inclusionRepo
      .createQueryBuilder('inclusion')
      .where('inclusion.isActive = :isActive', { isActive: true })
      .orderBy('inclusion.category', 'ASC')
      .addOrderBy('inclusion.sourceKey', 'ASC');

    if (targetOrgId) {
      qb.andWhere('inclusion.organizationId = :orgId', { orgId: targetOrgId });
    }
    if (query?.reportingYear) {
      qb.andWhere('inclusion.reportingYear = :year', {
        year: query.reportingYear,
      });
    }

    const [listData, dataCount] = await qb.getManyAndCount();
    return { listData, dataCount };
  }

  async getInclusion(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<SourceInclusion> {
    const targetOrgId =
      user?.roleId === MasterRole.SUPER_ADMIN ? undefined : user?.organizationId;
    const qb = this.inclusionRepo
      .createQueryBuilder('inclusion')
      .where('inclusion.id = :id', { id })
      .andWhere('inclusion.isActive = :isActive', { isActive: true });
    if (targetOrgId) {
      qb.andWhere('inclusion.organizationId = :orgId', { orgId: targetOrgId });
    }
    const inclusion = await qb.getOne();
    if (!inclusion) {
      throw new BadRequestException('Source inclusion record not found');
    }
    return inclusion;
  }

  async updateInclusion(
    id: number,
    dto: UpdateSourceInclusionDto,
    user: IDecodeUserDetails,
  ): Promise<SourceInclusion> {
    this.assertNotRegularUser(user);
    const inclusion = await this.getInclusion(id, user);
    const organizationId = this.resolveTargetOrgId(user, dto.organizationId);

    const before = { ...inclusion };
    Object.assign(inclusion, dto, {
      organizationId,
      updatedBy: user?.id,
    });
    const saved = await this.inclusionRepo.save(inclusion);
    await this.auditService.record({
      organizationId,
      entityType: 'source_inclusion',
      entityId: saved.id,
      entityLabel: `${saved.reportingYear} / ${saved.sourceKey}`,
      action:
        before.inclusionStatus !== saved.inclusionStatus
          ? AuditAction.BOUNDARY_CHANGE
          : AuditAction.UPDATE,
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: saved as unknown as Record<string, unknown>,
      reason: 'Source inclusion record updated',
      actorId: user?.id,
    });
    return saved;
  }

  /**
   * Reviewer decision path (doc 21): sets status + reviewer metadata.
   */
  async reviewInclusion(
    id: number,
    dto: ReviewSourceInclusionDto,
    user: IDecodeUserDetails,
  ): Promise<SourceInclusion> {
    this.assertNotRegularUser(user);
    const inclusion = await this.getInclusion(id, user);
    const before = { ...inclusion };
    inclusion.inclusionStatus = dto.inclusionStatus;
    inclusion.exclusionReason = dto.exclusionReason ?? inclusion.exclusionReason;
    inclusion.evidenceRef = dto.evidenceRef ?? inclusion.evidenceRef;
    inclusion.materialityRationale =
      dto.materialityRationale ?? inclusion.materialityRationale;
    inclusion.reviewerId = user?.id;
    inclusion.reviewDate = new Date().toISOString().split('T')[0];
    inclusion.updatedBy = user?.id;
    const saved = await this.inclusionRepo.save(inclusion);
    await this.auditService.record({
      organizationId: inclusion.organizationId,
      entityType: 'source_inclusion',
      entityId: saved.id,
      entityLabel: `${saved.reportingYear} / ${saved.sourceKey}`,
      action:
        saved.inclusionStatus === InclusionStatus.EXCLUDED
          ? AuditAction.BOUNDARY_CHANGE
          : AuditAction.UPDATE,
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: saved as unknown as Record<string, unknown>,
      reason: `Source inclusion reviewed → ${saved.inclusionStatus}`,
      actorId: user?.id,
    });
    return saved;
  }

  async deleteInclusion(
    id: number,
    user: IDecodeUserDetails,
  ): Promise<{ message: string }> {
    this.assertNotRegularUser(user);
    const inclusion = await this.getInclusion(id, user);
    inclusion.isActive = false;
    inclusion.deletedBy = user?.id;
    await this.inclusionRepo.save(inclusion);
    await this.auditService.record({
      organizationId: inclusion.organizationId,
      entityType: 'source_inclusion',
      entityId: inclusion.id,
      entityLabel: `${inclusion.reportingYear} / ${inclusion.sourceKey}`,
      action: AuditAction.DELETE,
      beforeJson: { isActive: true },
      afterJson: { isActive: false },
      reason: 'Source inclusion record deactivated',
      actorId: user?.id,
    });
    return { message: 'Source inclusion record deactivated successfully' };
  }
}