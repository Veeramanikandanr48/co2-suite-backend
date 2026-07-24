import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
} from 'class-validator';
import { SubscriptionPlanEnum } from 'src/entities/organization.entity';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEnum(SubscriptionPlanEnum)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlanEnum = SubscriptionPlanEnum.STANDARD;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  moduleKeys?: string[] = ['carbon'];

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  adminPassword: string;
}

export class UpdateOrganizationModulesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  moduleKeys: string[];
}

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEnum(SubscriptionPlanEnum)
  @IsOptional()
  subscriptionPlan?: SubscriptionPlanEnum;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  moduleKeys?: string[];
}
