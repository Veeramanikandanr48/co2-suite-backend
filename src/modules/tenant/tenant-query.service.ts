import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface TenantUserItem {
  id: number;
  userName: string;
  email: string;
  password?: string;
  organizationId: string;
  isActive: boolean;
  isVerified: boolean;
  isTwoFactorAuthenticationEnabled: boolean;
  createdOn: Date;
}

@Injectable()
export class TenantQueryService {
  private readonly logger = new Logger(TenantQueryService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Sanitizes and validates schema identifiers to guarantee 100% SQL injection safety
   */
  sanitizeSchema(schemaName: string): string {
    if (!schemaName) {
      throw new BadRequestException('Schema name cannot be empty');
    }
    const clean = schemaName.trim().toLowerCase();
    if (clean === 'public') return 'public';
    if (!/^t_[a-z0-9_]+$/.test(clean)) {
      throw new BadRequestException(`Invalid tenant schema identifier format: '${schemaName}'`);
    }
    return clean;
  }

  /**
   * Resolves organization ID to target isolated schema identifier (e.g. 't_000001')
   */
  async getSchemaNameForOrg(organizationId: string): Promise<string | null> {
    if (!organizationId) return null;
    const orgs = await this.dataSource.query(
      `SELECT "schemaName" FROM public."organizations" WHERE "id" = $1 LIMIT 1;`,
      [organizationId],
    );
    return orgs && orgs.length > 0 ? this.sanitizeSchema(orgs[0].schemaName) : null;
  }

  /**
   * Ensures isolated tenant user_details table exists inside target schema
   */
  async ensureTenantUserTable(schemaName: string): Promise<void> {
    const safeSchema = this.sanitizeSchema(schemaName);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "${safeSchema}"."user_details" (
        "id" SERIAL PRIMARY KEY,
        "userName" varchar(255),
        "email" varchar(255) UNIQUE,
        "password" varchar(255),
        "googleSubId" varchar(255),
        "isActive" boolean DEFAULT true,
        "isVerified" boolean DEFAULT false,
        "isTwoFactorAuthenticationEnabled" boolean DEFAULT false,
        "twoFactorAuthenticationSecret" varchar(255),
        "organizationId" varchar(255),
        "profileImageKey" varchar(255),
        "createdBy" integer,
        "updatedBy" integer,
        "deletedBy" integer,
        "createdOn" timestamp with time zone DEFAULT now(),
        "updatedOn" timestamp with time zone DEFAULT now(),
        "deletedOn" timestamp with time zone
      );
    `);
  }

  /**
   * Queries users from an isolated tenant schema with optional search and status filters
   */
  async findTenantUsers(
    schemaName: string,
    options: { search?: string; status?: string; limit?: number; offset?: number },
  ): Promise<{ items: TenantUserItem[]; total: number }> {
    const safeSchema = this.sanitizeSchema(schemaName);
    await this.ensureTenantUserTable(safeSchema);

    let searchWhere = '';
    const params: any[] = [];
    if (options.search && options.search.trim() !== '') {
      params.push(`%${options.search.trim().toLowerCase()}%`);
      searchWhere += ` AND (LOWER("userName") LIKE $${params.length} OR LOWER("email") LIKE $${params.length})`;
    }
    if (options.status === 'active') {
      searchWhere += ` AND "isActive" = true`;
    } else if (options.status === 'inactive') {
      searchWhere += ` AND "isActive" = false`;
    }

    const countRes = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM "${safeSchema}"."user_details" WHERE "deletedOn" IS NULL${searchWhere};`,
      params,
    );
    const total = countRes[0]?.count || 0;

    const limit = options.limit || 10;
    const offset = options.offset || 0;
    params.push(limit, offset);

    const rows = await this.dataSource.query(
      `SELECT * FROM "${safeSchema}"."user_details" WHERE "deletedOn" IS NULL${searchWhere} ORDER BY "id" DESC LIMIT $${params.length - 1} OFFSET $${params.length};`,
      params,
    );

    return { items: rows, total };
  }

  /**
   * Creates a user record inside isolated tenant schema
   */
  async createTenantUser(
    schemaName: string,
    userData: {
      userName: string;
      email: string;
      password?: string;
      organizationId: string;
      isActive?: boolean;
      isVerified?: boolean;
      isTwoFactorAuthenticationEnabled?: boolean;
    },
  ): Promise<TenantUserItem> {
    const safeSchema = this.sanitizeSchema(schemaName);
    await this.ensureTenantUserTable(safeSchema);

    const inserted = await this.dataSource.query(
      `INSERT INTO "${safeSchema}"."user_details" ("userName", "email", "password", "organizationId", "isActive", "isVerified", "isTwoFactorAuthenticationEnabled")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [
        userData.userName,
        userData.email,
        userData.password || null,
        userData.organizationId,
        userData.isActive ?? true,
        userData.isVerified ?? true,
        userData.isTwoFactorAuthenticationEnabled ?? false,
      ],
    );

    return inserted[0];
  }

  /**
   * One-Time Migration Executable helper (Can be called via CLI command or admin action)
   */
  async executeOneTimeTenantUserMigration(userRepo: any): Promise<{ migratedCount: number }> {
    this.logger.log('Starting explicit tenant user migration command...');
    const { Not, IsNull } = await import('typeorm');
    const orgUsers = await userRepo.find({
      where: { organizationId: Not(IsNull()) },
      relations: { organization: true },
    });

    let migratedCount = 0;
    for (const u of orgUsers) {
      if (u.organization && u.organization.schemaName) {
        const safeSchema = this.sanitizeSchema(u.organization.schemaName);
        await this.ensureTenantUserTable(safeSchema);
        await this.dataSource.query(
          `INSERT INTO "${safeSchema}"."user_details" ("userName", "email", "password", "organizationId", "isActive", "isVerified", "isTwoFactorAuthenticationEnabled", "createdOn")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT ("email") DO UPDATE SET "userName" = EXCLUDED."userName";`,
          [
            u.userName,
            u.email,
            u.password,
            u.organizationId,
            u.isActive,
            u.isVerified,
            u.isTwoFactorAuthenticationEnabled ?? false,
            u.createdOn || new Date(),
          ],
        );
        await userRepo.delete(u.id);
        migratedCount++;
        this.logger.log(`Migrated tenant user '${u.email}' to schema '${safeSchema}'`);
      }
    }

    this.logger.log(`Migration command completed. Migrated ${migratedCount} organization users out of public schema.`);
    return { migratedCount };
  }
}
