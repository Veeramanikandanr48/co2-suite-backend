import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { InventoryAuditEvent } from 'src/entities/inventory-audit-event.entity';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { MrvAuditEventTypeEnum, MrvStatusEnum } from 'src/enums/mrv-status.enum';
import {
  AuditMrvEntryDto,
  BulkLockMrvDto,
  GetMrvQueueQueryDto,
  LockMrvEntryDto,
  RejectMrvEntryDto,
  SubmitMrvEntryDto,
} from './dto/mrv.dto';

@Injectable()
export class MrvService {
  constructor(
    @InjectRepository(InventoryEntry)
    private readonly inventoryRepo: Repository<InventoryEntry>,
    @InjectRepository(InventoryAuditEvent)
    private readonly auditRepo: Repository<InventoryAuditEvent>,
  ) { }

  private resolveOrgId(user: IDecodeUserDetails): number {
    return user.organizationId || 1;
  }

  /**
   * Find active entry belonging to user's organization
   */
  async findEntryOrThrow(id: number, orgId: number): Promise<InventoryEntry> {
    const entry = await this.inventoryRepo.findOne({
      where: { id, organizationId: orgId, isActive: true },
      relations: { masterEmissionFactor: true, masterFormula: true },
    });
    if (!entry) {
      throw new NotFoundException(`Inventory entry #${id} not found`);
    }
    return entry;
  }

  /**
   * Submit an entry for verification: DRAFT -> SUBMITTED
   */
  async submitEntry(
    user: IDecodeUserDetails,
    id: number,
    dto: SubmitMrvEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const entry = await this.findEntryOrThrow(id, orgId);

    if (entry.mrvStatus === MrvStatusEnum.LOCKED) {
      throw new ForbiddenException(
        'INVENTORY_RECORD_LOCKED: Locked inventory entries cannot be transitioned',
      );
    }
    if (entry.mrvStatus === MrvStatusEnum.SUBMITTED) {
      throw new BadRequestException('Entry is already submitted for review');
    }
    if (entry.mrvStatus === MrvStatusEnum.AUDITED) {
      throw new BadRequestException('Entry is already audited. It can only be locked or rejected');
    }

    const prevStatus = entry.mrvStatus || MrvStatusEnum.DRAFT;
    entry.mrvStatus = MrvStatusEnum.SUBMITTED;
    entry.approvalStatus = 'SUBMITTED';

    const saved = await this.inventoryRepo.save(entry);

    // Record immutable audit event
    await this.auditRepo.save(
      this.auditRepo.create({
        inventoryEntryId: entry.id,
        organizationId: orgId,
        eventType: MrvAuditEventTypeEnum.STATUS_CHANGE,
        previousStatus: prevStatus,
        newStatus: MrvStatusEnum.SUBMITTED,
        actorId: user.id,
        actorEmail: user.email || null,
        comment: dto.comment || 'Submitted for verification',
        evidenceSha256: dto.evidenceSha256 || null,
        formulaSnapshot: entry.formulaId
          ? { formulaId: entry.formulaId, calculationMethod: entry.calculationMethod }
          : null,
        factorSnapshot: entry.emissionFactorId
          ? {
            emissionFactorId: entry.emissionFactorId,
            ef: entry.ef,
            efSource: entry.efSource,
          }
          : null,
      }),
    );

    return saved;
  }

  /**
   * Audit / Verify an entry: SUBMITTED -> AUDITED
   */
  async auditEntry(
    user: IDecodeUserDetails,
    id: number,
    dto: AuditMrvEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const entry = await this.findEntryOrThrow(id, orgId);

    if (entry.mrvStatus === MrvStatusEnum.LOCKED) {
      throw new ForbiddenException(
        'INVENTORY_RECORD_LOCKED: Locked inventory entries cannot be modified',
      );
    }
    if (entry.mrvStatus !== MrvStatusEnum.SUBMITTED) {
      throw new BadRequestException(
        `Cannot audit an entry with status '${entry.mrvStatus}'. Entry must be in SUBMITTED status.`,
      );
    }

    const prevStatus = entry.mrvStatus;
    entry.mrvStatus = MrvStatusEnum.AUDITED;
    entry.approvalStatus = 'AUDITED';
    entry.verifiedBy = user.id;
    entry.verifiedAt = new Date();

    const saved = await this.inventoryRepo.save(entry);

    await this.auditRepo.save(
      this.auditRepo.create({
        inventoryEntryId: entry.id,
        organizationId: orgId,
        eventType: MrvAuditEventTypeEnum.STATUS_CHANGE,
        previousStatus: prevStatus,
        newStatus: MrvStatusEnum.AUDITED,
        actorId: user.id,
        actorEmail: user.email || null,
        comment: dto.comment || 'Audited and verified by reviewer',
      }),
    );

    return saved;
  }

  /**
   * Reject an entry back to DRAFT: SUBMITTED/AUDITED -> DRAFT
   */
  async rejectEntry(
    user: IDecodeUserDetails,
    id: number,
    dto: RejectMrvEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const entry = await this.findEntryOrThrow(id, orgId);

    if (entry.mrvStatus === MrvStatusEnum.LOCKED) {
      throw new ForbiddenException(
        'INVENTORY_RECORD_LOCKED: Locked inventory entries cannot be rejected or modified',
      );
    }
    if (entry.mrvStatus === MrvStatusEnum.DRAFT) {
      throw new BadRequestException('Entry is already in DRAFT status');
    }

    const prevStatus = entry.mrvStatus;
    entry.mrvStatus = MrvStatusEnum.DRAFT;
    entry.approvalStatus = 'REJECTED';
    entry.comment = dto.reason;

    const saved = await this.inventoryRepo.save(entry);

    await this.auditRepo.save(
      this.auditRepo.create({
        inventoryEntryId: entry.id,
        organizationId: orgId,
        eventType: MrvAuditEventTypeEnum.REJECTED,
        previousStatus: prevStatus,
        newStatus: MrvStatusEnum.DRAFT,
        actorId: user.id,
        actorEmail: user.email || null,
        comment: dto.reason,
      }),
    );

    return saved;
  }

  /**
   * Lock an entry permanently: AUDITED -> LOCKED
   */
  async lockEntry(
    user: IDecodeUserDetails,
    id: number,
    dto: LockMrvEntryDto,
  ): Promise<InventoryEntry> {
    const orgId = this.resolveOrgId(user);
    const entry = await this.findEntryOrThrow(id, orgId);

    if (entry.mrvStatus === MrvStatusEnum.LOCKED) {
      throw new BadRequestException('Entry is already LOCKED');
    }
    if (entry.mrvStatus !== MrvStatusEnum.AUDITED) {
      throw new BadRequestException(
        `Cannot lock entry with status '${entry.mrvStatus}'. Entry must be AUDITED before locking.`,
      );
    }

    const prevStatus = entry.mrvStatus;
    entry.mrvStatus = MrvStatusEnum.LOCKED;
    entry.approvalStatus = 'LOCKED';
    entry.lockedBy = user.id;
    entry.lockedAt = new Date();

    const saved = await this.inventoryRepo.save(entry);

    await this.auditRepo.save(
      this.auditRepo.create({
        inventoryEntryId: entry.id,
        organizationId: orgId,
        eventType: MrvAuditEventTypeEnum.LOCK_APPLIED,
        previousStatus: prevStatus,
        newStatus: MrvStatusEnum.LOCKED,
        actorId: user.id,
        actorEmail: user.email || null,
        comment: dto.comment || 'Official regulatory lock applied',
      }),
    );

    return saved;
  }

  /**
   * Bulk lock audited entries
   */
  async bulkLockEntries(
    user: IDecodeUserDetails,
    dto: BulkLockMrvDto,
  ): Promise<{ lockedCount: number; message: string }> {
    const orgId = this.resolveOrgId(user);
    let lockedCount = 0;

    for (const id of dto.entryIds) {
      const entry = await this.inventoryRepo.findOne({
        where: { id, organizationId: orgId, isActive: true },
      });
      if (entry && entry.mrvStatus === MrvStatusEnum.AUDITED) {
        entry.mrvStatus = MrvStatusEnum.LOCKED;
        entry.approvalStatus = 'LOCKED';
        entry.lockedBy = user.id;
        entry.lockedAt = new Date();
        await this.inventoryRepo.save(entry);

        await this.auditRepo.save(
          this.auditRepo.create({
            inventoryEntryId: entry.id,
            organizationId: orgId,
            eventType: MrvAuditEventTypeEnum.LOCK_APPLIED,
            previousStatus: MrvStatusEnum.AUDITED,
            newStatus: MrvStatusEnum.LOCKED,
            actorId: user.id,
            actorEmail: user.email || null,
            comment: dto.comment || 'Bulk regulatory lock applied',
          }),
        );
        lockedCount++;
      }
    }

    return {
      lockedCount,
      message: `Successfully locked ${lockedCount} inventory entries`,
    };
  }

  /**
   * Get full immutable audit history for an entry
   */
  async getAuditTrail(
    user: IDecodeUserDetails,
    entryId: number,
  ): Promise<InventoryAuditEvent[]> {
    const orgId = this.resolveOrgId(user);
    await this.findEntryOrThrow(entryId, orgId);

    return this.auditRepo.find({
      where: { inventoryEntryId: entryId, organizationId: orgId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Retrieve verification queue items
   */
  async getVerificationQueue(
    user: IDecodeUserDetails,
    query: GetMrvQueueQueryDto,
  ): Promise<{ items: InventoryEntry[]; total: number }> {
    const orgId = this.resolveOrgId(user);

    const qb = this.inventoryRepo
      .createQueryBuilder('entry')
      .where('entry.organizationId = :orgId', { orgId })
      .andWhere('entry.isActive = :isActive', { isActive: true });

    if (query.mrvStatus) {
      qb.andWhere('entry.mrvStatus = :mrvStatus', { mrvStatus: query.mrvStatus });
    } else {
      qb.andWhere('entry.mrvStatus IN (:...statuses)', {
        statuses: [MrvStatusEnum.SUBMITTED, MrvStatusEnum.AUDITED],
      });
    }

    if (query.facility) {
      qb.andWhere('entry.facility = :facility', { facility: query.facility });
    }

    if (query.year) {
      qb.andWhere(
        '(entry.dateFrom LIKE :yr OR entry.dateTo LIKE :yr)',
        { yr: `%${query.year}%` },
      );
    }

    qb.orderBy('entry.updatedAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
