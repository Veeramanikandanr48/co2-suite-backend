import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MrvService } from './mrv.service';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { InventoryAuditEvent } from 'src/entities/inventory-audit-event.entity';
import { MrvAuditEventTypeEnum, MrvStatusEnum } from 'src/enums/mrv-status.enum';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

describe('MrvService (MRV Lifecycle & Audit Engine)', () => {
  let service: MrvService;
  let inventoryRepo: any;
  let auditRepo: any;

  const mockUser: IDecodeUserDetails = {
    iat: 123456,
    exp: 999999,
    id: 42,
    userId: 42,
    email: 'esg.auditor@enterprise.org',
    organizationId: 1,
    roleId: 2,
  };

  const createMockEntry = (status: MrvStatusEnum = MrvStatusEnum.DRAFT): Partial<InventoryEntry> => ({
    id: 101,
    organizationId: 1,
    serviceCode: 'CARBON',
    category: 'Stationary Combustion',
    name: 'Natural Gas',
    amount: 5000,
    unit: 'm3',
    ef: 1.942,
    emission: 9.71,
    mrvStatus: status,
    isActive: true,
    formulaId: 5,
    calculationMethod: 'FUEL_BASED',
    emissionFactorId: 12,
    efSource: 'DEFRA-2024',
  });

  beforeEach(async () => {
    const mockInventoryMap = new Map<number, InventoryEntry>();
    const auditEvents: InventoryAuditEvent[] = [];

    inventoryRepo = {
      findOne: jest.fn().mockImplementation(({ where }: { where: any }) => {
        const id = where.id;
        const entry = mockInventoryMap.get(id);
        if (entry && where.organizationId && entry.organizationId !== where.organizationId) {
          return Promise.resolve(null);
        }
        return Promise.resolve(entry || null);
      }),
      save: jest.fn().mockImplementation((entry: InventoryEntry) => {
        mockInventoryMap.set(entry.id, entry);
        return Promise.resolve({ ...entry });
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([Array.from(mockInventoryMap.values()), mockInventoryMap.size]),
      }),
    };

    auditRepo = {
      create: jest.fn().mockImplementation((dto: any) => ({ ...dto, id: auditEvents.length + 1, createdAt: new Date() })),
      save: jest.fn().mockImplementation((event: InventoryAuditEvent) => {
        auditEvents.push(event);
        return Promise.resolve(event);
      }),
      find: jest.fn().mockImplementation(({ where }: { where: any }) => {
        return Promise.resolve(auditEvents.filter(e => e.inventoryEntryId === where.inventoryEntryId));
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MrvService,
        { provide: getRepositoryToken(InventoryEntry), useValue: inventoryRepo },
        { provide: getRepositoryToken(InventoryAuditEvent), useValue: auditRepo },
      ],
    }).compile();

    service = module.get<MrvService>(MrvService);
  });

  describe('1. Submission: DRAFT -> SUBMITTED', () => {
    it('should transition a DRAFT entry to SUBMITTED and log audit event', async () => {
      const draft = createMockEntry(MrvStatusEnum.DRAFT) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(draft);

      const result = await service.submitEntry(mockUser, 101, {
        comment: 'Q1 Gas utility bill verified',
        evidenceSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      });

      expect(result.mrvStatus).toBe(MrvStatusEnum.SUBMITTED);
      expect(result.approvalStatus).toBe('SUBMITTED');
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryEntryId: 101,
          eventType: MrvAuditEventTypeEnum.STATUS_CHANGE,
          previousStatus: MrvStatusEnum.DRAFT,
          newStatus: MrvStatusEnum.SUBMITTED,
          actorId: 42,
          evidenceSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        }),
      );
    });

    it('should throw BadRequestException if already SUBMITTED', async () => {
      const submitted = createMockEntry(MrvStatusEnum.SUBMITTED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(submitted);

      await expect(service.submitEntry(mockUser, 101, {})).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if entry is LOCKED', async () => {
      const locked = createMockEntry(MrvStatusEnum.LOCKED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(locked);

      await expect(service.submitEntry(mockUser, 101, {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Verification / Audit: SUBMITTED -> AUDITED', () => {
    it('should transition SUBMITTED entry to AUDITED with reviewer timestamp', async () => {
      const submitted = createMockEntry(MrvStatusEnum.SUBMITTED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(submitted);

      const result = await service.auditEntry(mockUser, 101, {
        comment: 'Checked against supplier invoice #INV-2026-001',
      });

      expect(result.mrvStatus).toBe(MrvStatusEnum.AUDITED);
      expect(result.approvalStatus).toBe('AUDITED');
      expect(result.verifiedBy).toBe(42);
      expect(result.verifiedAt).toBeDefined();
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryEntryId: 101,
          eventType: MrvAuditEventTypeEnum.STATUS_CHANGE,
          previousStatus: MrvStatusEnum.SUBMITTED,
          newStatus: MrvStatusEnum.AUDITED,
          actorId: 42,
        }),
      );
    });

    it('should reject auditing an entry that is still in DRAFT', async () => {
      const draft = createMockEntry(MrvStatusEnum.DRAFT) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(draft);

      await expect(service.auditEntry(mockUser, 101, {})).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if trying to audit a LOCKED entry', async () => {
      const locked = createMockEntry(MrvStatusEnum.LOCKED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(locked);

      await expect(service.auditEntry(mockUser, 101, {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Rejection: SUBMITTED/AUDITED -> DRAFT', () => {
    it('should reject a SUBMITTED entry back to DRAFT with reason', async () => {
      const submitted = createMockEntry(MrvStatusEnum.SUBMITTED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(submitted);

      const result = await service.rejectEntry(mockUser, 101, {
        reason: 'Invoice attached was blurry and missing volume units',
      });

      expect(result.mrvStatus).toBe(MrvStatusEnum.DRAFT);
      expect(result.approvalStatus).toBe('REJECTED');
      expect(result.comment).toBe('Invoice attached was blurry and missing volume units');
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryEntryId: 101,
          eventType: MrvAuditEventTypeEnum.REJECTED,
          previousStatus: MrvStatusEnum.SUBMITTED,
          newStatus: MrvStatusEnum.DRAFT,
          comment: 'Invoice attached was blurry and missing volume units',
        }),
      );
    });

    it('should reject an AUDITED entry back to DRAFT when review fails', async () => {
      const audited = createMockEntry(MrvStatusEnum.AUDITED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(audited);

      const result = await service.rejectEntry(mockUser, 101, {
        reason: 'Internal audit found incorrect facility assignment',
      });

      expect(result.mrvStatus).toBe(MrvStatusEnum.DRAFT);
      expect(result.approvalStatus).toBe('REJECTED');
    });

    it('should throw ForbiddenException if trying to reject a LOCKED entry', async () => {
      const locked = createMockEntry(MrvStatusEnum.LOCKED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(locked);

      await expect(service.rejectEntry(mockUser, 101, { reason: 'test' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Regulatory Locking: AUDITED -> LOCKED', () => {
    it('should apply regulatory lock to an AUDITED entry', async () => {
      const audited = createMockEntry(MrvStatusEnum.AUDITED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(audited);

      const result = await service.lockEntry(mockUser, 101, {
        comment: 'Official ESG Annual Report 2026 Freeze',
      });

      expect(result.mrvStatus).toBe(MrvStatusEnum.LOCKED);
      expect(result.approvalStatus).toBe('LOCKED');
      expect(result.lockedBy).toBe(42);
      expect(result.lockedAt).toBeDefined();
      expect(auditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryEntryId: 101,
          eventType: MrvAuditEventTypeEnum.LOCK_APPLIED,
          previousStatus: MrvStatusEnum.AUDITED,
          newStatus: MrvStatusEnum.LOCKED,
          comment: 'Official ESG Annual Report 2026 Freeze',
        }),
      );
    });

    it('should not allow locking an entry in DRAFT status', async () => {
      const draft = createMockEntry(MrvStatusEnum.DRAFT) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(draft);

      await expect(service.lockEntry(mockUser, 101, {})).rejects.toThrow(BadRequestException);
    });

    it('should not allow locking an entry in SUBMITTED status (must be audited first)', async () => {
      const submitted = createMockEntry(MrvStatusEnum.SUBMITTED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(submitted);

      await expect(service.lockEntry(mockUser, 101, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Bulk Locking', () => {
    it('should lock only audited entries in batch', async () => {
      const audited1 = { ...createMockEntry(MrvStatusEnum.AUDITED), id: 201 } as InventoryEntry;
      const audited2 = { ...createMockEntry(MrvStatusEnum.AUDITED), id: 202 } as InventoryEntry;
      const draft3 = { ...createMockEntry(MrvStatusEnum.DRAFT), id: 203 } as InventoryEntry;

      inventoryRepo.findOne
        .mockResolvedValueOnce(audited1)
        .mockResolvedValueOnce(audited2)
        .mockResolvedValueOnce(draft3);

      const result = await service.bulkLockEntries(mockUser, {
        entryIds: [201, 202, 203],
        comment: 'Year-end bulk lock',
      });

      expect(result.lockedCount).toBe(2);
      expect(audited1.mrvStatus).toBe(MrvStatusEnum.LOCKED);
      expect(audited2.mrvStatus).toBe(MrvStatusEnum.LOCKED);
      expect(draft3.mrvStatus).toBe(MrvStatusEnum.DRAFT);
    });
  });

  describe('6. Immutable Audit Trail History', () => {
    it('should retrieve chronological audit events for an entry', async () => {
      const entry = createMockEntry(MrvStatusEnum.LOCKED) as InventoryEntry;
      inventoryRepo.findOne.mockResolvedValue(entry);

      const mockEvents = [
        { id: 1, inventoryEntryId: 101, eventType: MrvAuditEventTypeEnum.STATUS_CHANGE, newStatus: MrvStatusEnum.SUBMITTED },
        { id: 2, inventoryEntryId: 101, eventType: MrvAuditEventTypeEnum.STATUS_CHANGE, newStatus: MrvStatusEnum.AUDITED },
        { id: 3, inventoryEntryId: 101, eventType: MrvAuditEventTypeEnum.LOCK_APPLIED, newStatus: MrvStatusEnum.LOCKED },
      ];
      auditRepo.find.mockResolvedValue(mockEvents);

      const history = await service.getAuditTrail(mockUser, 101);
      expect(history.length).toBe(3);
      expect(history[0].newStatus).toBe(MrvStatusEnum.SUBMITTED);
      expect(history[2].newStatus).toBe(MrvStatusEnum.LOCKED);
    });

    it('should throw NotFoundException if entry does not exist or belongs to another org', async () => {
      inventoryRepo.findOne.mockResolvedValue(null);

      await expect(service.getAuditTrail(mockUser, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
