import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SidebarItem } from 'src/entities/sidebar-item.entity';
import { AuditLog } from 'src/entities/audit-log.entity';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';
import { AuthService } from 'src/auth/auth/auth.service';
import {
  SidebarBadgeTypeEnum,
  SidebarItemTypeEnum,
  SidebarPermissionOperatorEnum,
  SidebarVisibilityEnum,
} from 'src/enums/sidebar.enum';
import {
  CreateSidebarItemDto,
  ReorderSidebarItemsDto,
  UpdateSidebarItemDto,
} from './dto/sidebar.dto';

export interface UserMenuItemNode {
  id: number;
  itemKey: string;
  title: string;
  path?: string;
  icon?: string;
  iconLibrary: string;
  itemType: SidebarItemTypeEnum;
  parentId?: number;
  sortOrder: number;
  permissionKey?: string;
  requiredPermissions?: string[];
  permissionOperator: SidebarPermissionOperatorEnum;
  requiredRoleKey?: string;
  featureKey?: string;
  activeMatch?: string;
  target: string;
  badge?: {
    type: SidebarBadgeTypeEnum;
    value?: string;
  };
  isExternal: boolean;
  visibility: SidebarVisibilityEnum;
  color?: string;
  cssClass?: string;
  tooltip?: string;
  description?: string;
  isPinned: boolean;
  isFavorite: boolean;
  analyticsKey?: string;
  disabled?: boolean;
  disabledReason?: string;
  children?: UserMenuItemNode[];
}

@Injectable()
export class SidebarService {
  constructor(
    @InjectRepository(SidebarItem)
    private readonly sidebarRepo: Repository<SidebarItem>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,

    private readonly authService: AuthService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Returns current maximum sidebar version counter for instant client cache invalidation.
   */
  async getGlobalVersion(): Promise<number> {
    const res = await this.sidebarRepo
      .createQueryBuilder('s')
      .select('MAX(s.version)', 'maxVersion')
      .getRawOne();
    return parseInt(res?.maxVersion || '1', 10);
  }

  /**
   * Main Evaluation Pipeline:
   *   1. loadSidebar()
   *   2. filterModuleEnabled()
   *   3. evaluatePermissions()
   *   4. evaluateRoleRestrictions()
   *   5. applyVisibility()
   *   6. buildRecursiveTree()
   *   7. decorateAndSort()
   */
  async getUserMenu(user: IDecodeUserDetails): Promise<UserMenuItemNode[]> {
    return this.evaluatePipeline(user.roleKey, user.currentRoleId ?? user.roleIds?.[0]);
  }

  /**
   * Admin Tooling: Previews navigation for any specified role.
   */
  async previewForRole(roleKey: string, roleId?: number): Promise<UserMenuItemNode[]> {
    return this.evaluatePipeline(roleKey, roleId);
  }

  private async evaluatePipeline(roleKey: string, activeRoleId?: number): Promise<UserMenuItemNode[]> {
    const isSuperAdmin = roleKey === 'SUPER_ADMIN';

    // 1. loadSidebar(): Fetch all active sidebar items ordered by sortOrder
    const allItems = await this.sidebarRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
      relations: { module: true },
    });

    // Collect granted permissions for the active role
    const grantedPermissionKeys = new Set<string>();
    if (!isSuperAdmin && activeRoleId) {
      const userPermissions = await this.authService.getAllUserPermission(activeRoleId);
      userPermissions.forEach((p) => {
        if (p.permissionKey) {
          grantedPermissionKeys.add(p.permissionKey);
        }
        if (p.subject && p.action) {
          grantedPermissionKeys.add(`${p.subject}:${p.action}`);
          grantedPermissionKeys.add(`${p.subject}:${p.action}:any`);
          grantedPermissionKeys.add(`${p.subject}:${p.action}:own`);
        }
      });
    }

    // Pipeline Step 2 & 3: Evaluate Module & Permissions
    const checkPermissions = (item: SidebarItem): boolean => {
      if (isSuperAdmin) return true;

      // Single permissionKey check
      if (item.permissionKey) {
        const direct = grantedPermissionKeys.has(item.permissionKey);
        const base = grantedPermissionKeys.has(item.permissionKey.replace(/:(any|own)$/, ''));
        if (!direct && !base) return false;
      }

      // Multi-requiredPermissions array check with AND / OR operator
      const reqPerms = item.requiredPermissions || (item.permissionKey ? [item.permissionKey] : []);
      if (reqPerms.length > 0) {
        const checkKey = (k: string) => {
          return grantedPermissionKeys.has(k) || grantedPermissionKeys.has(k.replace(/:(any|own)$/, ''));
        };

        if (item.permissionOperator === SidebarPermissionOperatorEnum.AND) {
          if (!reqPerms.every(checkKey)) return false;
        } else {
          // Default: OR operator
          if (!reqPerms.some(checkKey)) return false;
        }
      }

      return true;
    };

    // Pipeline Step 4 & 5: Evaluate Role & Apply Visibility
    const evaluateItem = (item: SidebarItem): { keep: boolean; disabled: boolean; reason?: string } => {
      // If visibility is explicitly HIDDEN, drop item
      if (item.visibility === SidebarVisibilityEnum.HIDDEN || item.isVisible === false) {
        return { keep: false, disabled: false };
      }

      // Role check
      if (item.requiredRoleKey && !isSuperAdmin && item.requiredRoleKey !== roleKey) {
        if (item.visibility === SidebarVisibilityEnum.DISABLED) {
          return { keep: true, disabled: true, reason: 'Restricted role' };
        }
        return { keep: false, disabled: false };
      }

      // Module feature check (if module is disabled)
      if (item.module && item.module.isActive === false) {
        if (item.visibility === SidebarVisibilityEnum.DISABLED) {
          return { keep: true, disabled: true, reason: 'Module disabled' };
        }
        return { keep: false, disabled: false };
      }

      // Permission check
      const hasPerm = checkPermissions(item);
      if (!hasPerm) {
        if (item.visibility === SidebarVisibilityEnum.DISABLED) {
          return { keep: true, disabled: true, reason: 'Insufficient permissions' };
        }
        return { keep: false, disabled: false };
      }

      return { keep: true, disabled: false };
    };

    // Pipeline Step 6 & 7: Build Recursive Tree & Decorate
    const nodeMap = new Map<number, UserMenuItemNode>();

    allItems.forEach((item) => {
      const { keep, disabled, reason } = evaluateItem(item);
      if (!keep) return;

      nodeMap.set(item.id, {
        id: item.id,
        itemKey: item.itemKey,
        title: item.title,
        path: item.path || undefined,
        icon: item.icon || undefined,
        iconLibrary: item.iconLibrary || 'lucide',
        itemType: item.itemType || SidebarItemTypeEnum.LINK,
        parentId: item.parentId || undefined,
        sortOrder: item.sortOrder,
        permissionKey: item.permissionKey || undefined,
        requiredPermissions: item.requiredPermissions || undefined,
        permissionOperator: item.permissionOperator || SidebarPermissionOperatorEnum.OR,
        requiredRoleKey: item.requiredRoleKey || undefined,
        featureKey: item.featureKey || undefined,
        activeMatch: item.activeMatch || undefined,
        target: item.target || '_self',
        badge: item.badgeText
          ? {
              type: item.badgeType || SidebarBadgeTypeEnum.INFO,
              value: item.badgeText,
            }
          : undefined,
        isExternal: item.isExternal,
        visibility: item.visibility || SidebarVisibilityEnum.VISIBLE,
        color: item.color || undefined,
        cssClass: item.cssClass || undefined,
        tooltip: item.tooltip || undefined,
        description: item.description || undefined,
        isPinned: item.isPinned || false,
        isFavorite: item.isFavorite || false,
        analyticsKey: item.analyticsKey || undefined,
        disabled,
        disabledReason: reason,
        children: [],
      });
    });

    const rootNodes: UserMenuItemNode[] = [];

    allItems.forEach((item) => {
      const node = nodeMap.get(item.id);
      if (!node) return;

      if (item.parentId && nodeMap.has(item.parentId)) {
        const parentNode = nodeMap.get(item.parentId);
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Unlimited depth recursive builder & sorter
    const buildRecursiveTree = (nodes: UserMenuItemNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          buildRecursiveTree(node.children);
        } else {
          delete node.children;
        }
      });
    };

    buildRecursiveTree(rootNodes);
    return rootNodes;
  }

  async findAll(): Promise<SidebarItem[]> {
    return this.sidebarRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
      relations: { parent: true, module: true },
    });
  }

  async findOne(id: number): Promise<SidebarItem> {
    const item = await this.sidebarRepo.findOne({
      where: { id, isActive: true },
      relations: { parent: true, children: true, module: true },
    });
    if (!item) throw new NotFoundException(`Sidebar item #${id} not found`);
    return item;
  }

  async create(dto: CreateSidebarItemDto, changedBy: number): Promise<SidebarItem> {
    const existing = await this.sidebarRepo.findOne({ where: { itemKey: dto.itemKey } });
    if (existing) {
      throw new ConflictException(`Sidebar item key '${dto.itemKey}' already exists`);
    }

    const item = this.sidebarRepo.create({
      ...dto,
      isActive: true,
      isVisible: dto.isVisible ?? true,
      version: 1,
    });
    const saved = await this.sidebarRepo.save(item);

    await this.writeAudit('sidebar_item', saved.id, 'created', null, saved, changedBy);
    return saved;
  }

  async update(id: number, dto: UpdateSidebarItemDto, changedBy: number): Promise<SidebarItem> {
    const item = await this.findOne(id);
    const before = { ...item };

    Object.assign(item, dto);
    item.version = (item.version || 1) + 1;

    const saved = await this.sidebarRepo.save(item);
    await this.writeAudit('sidebar_item', id, 'updated', before, saved, changedBy);
    return saved;
  }

  async remove(id: number, changedBy: number): Promise<void> {
    const item = await this.findOne(id);
    await this.sidebarRepo.update(id, { isActive: false, version: (item.version || 1) + 1 });
    await this.writeAudit('sidebar_item', id, 'deleted', item, null, changedBy);
  }

  async reorder(dto: ReorderSidebarItemsDto, changedBy: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const entry of dto.items) {
        const updatePayload: Partial<SidebarItem> = {
          sortOrder: entry.sortOrder,
        };
        if (entry.parentId !== undefined) {
          updatePayload.parentId = entry.parentId;
        }
        await manager.update(SidebarItem, { id: entry.id }, updatePayload);
      }
    });
    await this.writeAudit('sidebar_item', 0, 'reordered', null, dto.items, changedBy);
  }

  private async writeAudit(
    entityType: string,
    entityId: number,
    action: string,
    oldValue: unknown,
    newValue: unknown,
    changedBy: number,
  ): Promise<void> {
    await this.auditRepo.save({
      entityType,
      entityId,
      action,
      changedBy,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    });
  }
}
