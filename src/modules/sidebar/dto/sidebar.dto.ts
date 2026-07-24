import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SidebarBadgeTypeEnum,
  SidebarItemTypeEnum,
  SidebarPermissionOperatorEnum,
  SidebarVisibilityEnum,
} from 'src/enums/sidebar.enum';

export class CreateSidebarItemDto {
  @IsString()
  @IsNotEmpty()
  itemKey: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  iconLibrary?: string;

  @IsEnum(SidebarItemTypeEnum)
  @IsOptional()
  itemType?: SidebarItemTypeEnum;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsInt()
  @IsOptional()
  moduleId?: number;

  @IsString()
  @IsOptional()
  permissionKey?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredPermissions?: string[];

  @IsEnum(SidebarPermissionOperatorEnum)
  @IsOptional()
  permissionOperator?: SidebarPermissionOperatorEnum;

  @IsString()
  @IsOptional()
  requiredRoleKey?: string;

  @IsString()
  @IsOptional()
  featureKey?: string;

  @IsString()
  @IsOptional()
  activeMatch?: string;

  @IsString()
  @IsOptional()
  target?: string;

  @IsString()
  @IsOptional()
  badgeText?: string;

  @IsEnum(SidebarBadgeTypeEnum)
  @IsOptional()
  badgeType?: SidebarBadgeTypeEnum;

  @IsBoolean()
  @IsOptional()
  isExternal?: boolean;

  @IsEnum(SidebarVisibilityEnum)
  @IsOptional()
  visibility?: SidebarVisibilityEnum;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  cssClass?: string;

  @IsString()
  @IsOptional()
  tooltip?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @IsString()
  @IsOptional()
  analyticsKey?: string;
}

export class UpdateSidebarItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  iconLibrary?: string;

  @IsEnum(SidebarItemTypeEnum)
  @IsOptional()
  itemType?: SidebarItemTypeEnum;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsInt()
  @IsOptional()
  moduleId?: number;

  @IsString()
  @IsOptional()
  permissionKey?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredPermissions?: string[];

  @IsEnum(SidebarPermissionOperatorEnum)
  @IsOptional()
  permissionOperator?: SidebarPermissionOperatorEnum;

  @IsString()
  @IsOptional()
  requiredRoleKey?: string;

  @IsString()
  @IsOptional()
  featureKey?: string;

  @IsString()
  @IsOptional()
  activeMatch?: string;

  @IsString()
  @IsOptional()
  target?: string;

  @IsString()
  @IsOptional()
  badgeText?: string;

  @IsEnum(SidebarBadgeTypeEnum)
  @IsOptional()
  badgeType?: SidebarBadgeTypeEnum;

  @IsBoolean()
  @IsOptional()
  isExternal?: boolean;

  @IsEnum(SidebarVisibilityEnum)
  @IsOptional()
  visibility?: SidebarVisibilityEnum;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  cssClass?: string;

  @IsString()
  @IsOptional()
  tooltip?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @IsString()
  @IsOptional()
  analyticsKey?: string;
}

export class ReorderItemDto {
  @IsInt()
  id: number;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderSidebarItemsDto {
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class PreviewNavigationDto {
  @IsString()
  @IsNotEmpty()
  roleKey: string;
}
