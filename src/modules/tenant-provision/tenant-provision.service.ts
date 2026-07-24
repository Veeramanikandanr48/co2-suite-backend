import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization, OrganizationStatusEnum } from 'src/entities/organization.entity';
import { TenantProvisionLog, ProvisionStepStatusEnum } from 'src/entities/tenant-provision-log.entity';
import { TenantSchemaVersion } from 'src/entities/tenant-schema-version.entity';
import { OrganizationSettings } from 'src/entities/organization-settings.entity';
import { TenantHealth } from 'src/entities/tenant-health.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TenantProvisionService {
  private readonly logger = new Logger(TenantProvisionService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(TenantProvisionLog)
    private readonly logRepo: Repository<TenantProvisionLog>,
    @InjectRepository(TenantSchemaVersion)
    private readonly schemaVersionRepo: Repository<TenantSchemaVersion>,
    @InjectRepository(OrganizationSettings)
    private readonly settingsRepo: Repository<OrganizationSettings>,
    @InjectRepository(TenantHealth)
    private readonly healthRepo: Repository<TenantHealth>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generates next sequential immutable tenant code (e.g. 'TEN000001') and short schema name ('t_000001')
   */
  async generateNextTenantCode(): Promise<{ tenantCode: string; schemaName: string }> {
    const lastOrg = await this.orgRepo.createQueryBuilder('org')
      .where("org.tenantCode LIKE 'TEN%'")
      .orderBy('org.createdAt', 'DESC')
      .getOne();

    let nextNum = 1;
    if (lastOrg && lastOrg.tenantCode) {
      const match = lastOrg.tenantCode.match(/TEN(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    const padded = String(nextNum).padStart(6, '0');
    return {
      tenantCode: `TEN${padded}`,
      schemaName: `t_${padded}`,
    };
  }

  /**
   * Orchestrates tenant schema creation, settings, versioned SQL migrations, master data seeding, health initialization, and logging
   */
  async provisionTenant(organizationId: string): Promise<void> {
    const org = await this.orgRepo.findOne({ where: { id: organizationId } });
    if (!org) {
      throw new BadRequestException(`Organization ID '${organizationId}' not found for provisioning`);
    }

    const schemaName = org.schemaName;
    this.logger.log(`🚀 Starting Enterprise Tenant Provisioning Pipeline for '${org.name}' (${schemaName})`);

    // Update status to PROVISIONING
    await this.orgRepo.update(org.id, { status: OrganizationStatusEnum.PROVISIONING });

    try {
      // 1. Create Organization Settings
      await this.logStep(org.id, 'CREATE_SETTINGS', async () => {
        const existingSettings = await this.settingsRepo.findOne({ where: { organizationId: org.id } });
        if (!existingSettings) {
          await this.settingsRepo.save(
            this.settingsRepo.create({
              organizationId: org.id,
              timezone: 'UTC',
              currency: 'USD',
              language: 'en',
            }),
          );
        }
      });

      // 2. Create Schema
      await this.logStep(org.id, 'CREATE_SCHEMA', async () => {
        await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      });

      // 3. Run Versioned Tenant Migrations & Record Versions
      await this.logStep(org.id, 'RUN_MIGRATIONS', async () => {
        await this.runMigrations(org.tenantCode, schemaName);
      });

      // 4. Seed Tenant Default Master Data (Emission Factors)
      await this.logStep(org.id, 'SEED_MASTER_DATA', async () => {
        await this.seedTenantDefaults(schemaName);
      });

      // 5. Initialize Tenant Health Monitoring Record
      await this.logStep(org.id, 'INIT_TENANT_HEALTH', async () => {
        const existingHealth = await this.healthRepo.findOne({ where: { organizationId: org.id } });
        if (!existingHealth) {
          await this.healthRepo.save(
            this.healthRepo.create({
              organizationId: org.id,
              schemaVersion: 1,
              migrationStatus: 'HEALTHY',
              storageUsedMB: 0.5,
              lastActivityAt: new Date(),
            }),
          );
        }
      });

      // Update status to ACTIVE
      await this.orgRepo.update(org.id, { status: OrganizationStatusEnum.ACTIVE, migrationVersion: 1 });
      this.logger.log(`✅ Enterprise Tenant Provisioning completed successfully for '${org.name}' (${schemaName})`);
    } catch (err) {
      this.logger.error(`❌ Tenant Provisioning Pipeline failed for '${org.name}': ${err.message}`, err.stack);
      await this.orgRepo.update(org.id, { status: OrganizationStatusEnum.FAILED });
      throw err;
    }
  }

  /**
   * Reads versioned SQL migration files and records execution in public.tenant_schema_versions
   */
  private async runMigrations(tenantCode: string, schemaName: string): Promise<void> {
    const migrationsDir = path.join(process.cwd(), 'src/database/tenant-migrations');
    if (!fs.existsSync(migrationsDir)) {
      this.logger.warn(`Migrations directory '${migrationsDir}' does not exist.`);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const version = i + 1;

        // Check if version was already executed
        const existingVersion = await this.schemaVersionRepo.findOne({
          where: { tenantCode, version },
        });

        if (!existingVersion) {
          const filePath = path.join(migrationsDir, file);
          const sqlContent = fs.readFileSync(filePath, 'utf-8');
          const formattedSql = sqlContent.replace(/\{\{SCHEMA_NAME\}\}/g, `"${schemaName}"`);
          
          this.logger.log(`Executing migration v${version} ('${file}') for schema '${schemaName}'...`);
          await queryRunner.query(formattedSql);

          // Record executed version
          await this.schemaVersionRepo.save(
            this.schemaVersionRepo.create({
              tenantCode,
              schemaName,
              version,
              migrationName: file,
            }),
          );
        }
      }
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Seeds default emission factor templates into tenant schema
   */
  private async seedTenantDefaults(schemaName: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`
        INSERT INTO "${schemaName}"."emission_factors" ("factor_name", "factor_value", "unit", "source", "year", "region")
        VALUES 
          ('Grid Electricity Defra 2024', 0.20707, 'kg CO2e / kWh', 'DEFRA', 2024, 'UK'),
          ('Natural Gas Combustion', 0.18293, 'kg CO2e / kWh', 'DEFRA', 2024, 'Global'),
          ('Diesel Fuel Combustion', 2.68697, 'kg CO2e / L', 'DEFRA', 2024, 'Global'),
          ('Grid Electricity US EPA eGRID', 0.38520, 'kg CO2e / kWh', 'US EPA', 2024, 'US')
        ON CONFLICT DO NOTHING;
      `);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Step logging helper
   */
  private async logStep(
    organizationId: string,
    stepName: string,
    action: () => Promise<void>,
  ): Promise<void> {
    const log = this.logRepo.create({
      organizationId,
      stepName,
      status: ProvisionStepStatusEnum.STARTED,
      startedAt: new Date(),
    });
    const savedLog = await this.logRepo.save(log);

    try {
      await action();
      savedLog.status = ProvisionStepStatusEnum.COMPLETED;
      savedLog.completedAt = new Date();
      await this.logRepo.save(savedLog);
    } catch (err) {
      savedLog.status = ProvisionStepStatusEnum.FAILED;
      savedLog.completedAt = new Date();
      savedLog.errorMessage = err.message || String(err);
      await this.logRepo.save(savedLog);
      throw err;
    }
  }
}
