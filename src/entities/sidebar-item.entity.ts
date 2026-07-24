import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseColumns, MasterModule } from './master.entity';
import {
  SidebarBadgeTypeEnum,
  SidebarItemTypeEnum,
  SidebarPermissionOperatorEnum,
  SidebarVisibilityEnum,
} from 'src/enums/sidebar.enum';

@Entity({ name: 'sidebar_items' })
export class SidebarItem extends BaseColumns {
  @PrimaryGeneratedColumn()
  id: number;

  /** Unique identifier key (e.g. 'dashboard', 'header_admin', 'users') */
  @Column({ unique: true })
  itemKey: string;

  /** Display label shown in sidebar UI */
  @Column()
  title: string;

  /** Frontend route path (e.g. '/dashboard', '/users') */
  @Column({ nullable: true })
  path: string;

  /** Icon name or key (e.g. 'LayoutDashboard', 'Users', 'ShieldCheck') */
  @Column({ nullable: true })
  icon: string;

  /** Icon library name (default 'lucide'; future-proof for heroicons, tabler, material) */
  @Column({ default: 'lucide' })
  iconLibrary: string;

  /** Item type classification: LINK, MENU, GROUP, HEADER, DIVIDER */
  @Column({
    type: 'varchar',
    default: SidebarItemTypeEnum.LINK,
  })
  itemType: SidebarItemTypeEnum;

  /** Self-referencing FK for parent menu item (enables unlimited nested sub-menus) */
  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => SidebarItem, (item) => item.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent: SidebarItem;

  @OneToMany(() => SidebarItem, (item) => item.parent)
  children: SidebarItem[];

  /** Sorting sequence index */
  @Column({ default: 0 })
  sortOrder: number;

  /** Optional associated module ID */
  @Column({ nullable: true })
  moduleId: number;

  @ManyToOne(() => MasterModule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moduleId' })
  module: MasterModule;

  /** Primary permission key string (e.g. 'users:profile:read:any') */
  @Column({ nullable: true })
  permissionKey: string;

  /** Array of required permission key strings */
  @Column('simple-array', { nullable: true })
  requiredPermissions: string[];

  /** Logical operator used when evaluating requiredPermissions: 'OR' or 'AND' */
  @Column({
    type: 'varchar',
    default: SidebarPermissionOperatorEnum.OR,
  })
  permissionOperator: SidebarPermissionOperatorEnum;

  /** Required roleKey string restriction (e.g. 'SUPER_ADMIN'). Null means no role restriction. */
  @Column({ nullable: true })
  requiredRoleKey: string;

  /** Feature flag key (e.g. 'cbam', 'audit', 'co2', 'water') */
  @Column({ nullable: true })
  featureKey: string;

  /** Wildcard active path matching pattern (e.g. '/users/*') */
  @Column({ nullable: true })
  activeMatch: string;

  /** Link target attribute: '_self' or '_blank' */
  @Column({ default: '_self' })
  target: string;

  /** Optional badge text or counter tag */
  @Column({ nullable: true })
  badgeText: string;

  /** Badge classification type */
  @Column({
    type: 'varchar',
    default: SidebarBadgeTypeEnum.INFO,
    nullable: true,
  })
  badgeType: SidebarBadgeTypeEnum;

  /** Flag indicating whether the item opens an external link */
  @Column({ default: false })
  isExternal: boolean;

  /** Item visibility state: VISIBLE, DISABLED, HIDDEN, SYSTEM */
  @Column({
    type: 'varchar',
    default: SidebarVisibilityEnum.VISIBLE,
  })
  visibility: SidebarVisibilityEnum;

  /** Legacy visibility boolean flag for backward compatibility */
  @Column({ default: true })
  isVisible: boolean;

  /** Custom styling color class/hex */
  @Column({ nullable: true })
  color: string;

  /** Custom CSS class name */
  @Column({ nullable: true })
  cssClass: string;

  /** Hover tooltip text */
  @Column({ nullable: true })
  tooltip: string;

  /** Item description text */
  @Column({ nullable: true })
  description: string;

  /** Pinned to top flag */
  @Column({ default: false })
  isPinned: boolean;

  /** Favorite flag */
  @Column({ default: false })
  isFavorite: boolean;

  /** Analytics tracking key */
  @Column({ nullable: true })
  analyticsKey: string;

  /** Version counter incremented when item structure changes */
  @Column({ default: 1 })
  version: number;
}
