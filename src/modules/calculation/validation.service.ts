import { Injectable } from '@nestjs/common';

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  field?: string;
}

export interface ValidationContext {
  category: string;
  name: string;
  amount: number;
  unit?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  facility?: string | null;
  factorFound?: boolean;
  factorUnit?: string | null;
  conversionSupported?: boolean;
  factorId?: number | null;
  inclusionStatus?: string | null;
  documentPath?: string | null;
  createdBy?: number | null;
}

@Injectable()
export class InventoryValidationService {
  /**
   * Structural + business validation (doc 23 §3).
   * Returns ERRORs (blocking) and WARNINGs (recorded, non-blocking).
   */
  validate(ctx: ValidationContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // ── Structural ──────────────────────────────────────────────────────────
    if (!ctx.category || !ctx.category.trim()) {
      issues.push({
        severity: 'ERROR',
        code: 'CATEGORY_REQUIRED',
        message:
          'A reporting category (e.g. Stationary Combustion) is required.',
        field: 'category',
      });
    }
    if (!ctx.name || !ctx.name.trim()) {
      issues.push({
        severity: 'ERROR',
        code: 'NAME_REQUIRED',
        message: 'An activity/source name is required.',
        field: 'name',
      });
    }
    if (ctx.amount === undefined || ctx.amount === null || !(ctx.amount > 0)) {
      issues.push({
        severity: 'ERROR',
        code: 'AMOUNT_POSITIVE',
        message: 'Activity amount must be a positive number.',
        field: 'amount',
      });
    }
    if (!ctx.unit || !ctx.unit.trim()) {
      issues.push({
        severity: 'ERROR',
        code: 'UNIT_REQUIRED',
        message:
          'Activity unit is required — factor resolution depends on unit compatibility.',
        field: 'unit',
      });
    }

    // ── Date range sanity ───────────────────────────────────────────────────
    if (ctx.dateFrom && ctx.dateTo) {
      const from = new Date(ctx.dateFrom);
      const to = new Date(ctx.dateTo);
      if (
        !Number.isNaN(from.getTime()) &&
        !Number.isNaN(to.getTime()) &&
        from > to
      ) {
        issues.push({
          severity: 'ERROR',
          code: 'DATE_RANGE_INVALID',
          message: 'dateFrom must be on or before dateTo.',
          field: 'dateTo',
        });
      } else if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        issues.push({
          severity: 'WARNING',
          code: 'DATE_FORMAT_UNRECOGNIZED',
          message:
            'Date format not recognized (dd.MM.yyyy expected). The entry is accepted with the raw value.',
          field: 'dateFrom',
        });
      }
    }

    // ── Factor / conversion feasibility ─────────────────────────────────────
    if (!ctx.factorFound) {
      issues.push({
        severity: 'ERROR',
        code: 'FACTOR_NOT_FOUND',
        message:
          'No emission factor could be resolved for this activity. Master data must be maintained first.',
      });
    } else if (ctx.factorUnit && ctx.unit) {
      const from = ctx.unit.trim().toLowerCase();
      const target = ctx.factorUnit.trim().toLowerCase();
      if (from !== target && !ctx.conversionSupported) {
        issues.push({
          severity: 'ERROR',
          code: 'UNIT_INCOMPATIBLE',
          message: `Activity unit "${ctx.unit}" is incompatible with factor unit "${ctx.factorUnit}". Register a unit conversion or choose a matching factor.`,
          field: 'unit',
        });
      }
    }

    // ── Inclusion / boundary ────────────────────────────────────────────────
    if (!ctx.inclusionStatus) {
      issues.push({
        severity: 'WARNING',
        code: 'INCLUSION_NOT_DECLARED',
        message:
          'Source inclusion (organizational boundary) is not declared; defaults to INCLUDED.',
      });
    } else if (ctx.inclusionStatus === 'EXCLUDED') {
      issues.push({
        severity: 'WARNING',
        code: 'INCLUSION_EXCLUDED',
        message:
          'This source is excluded from the inventory per organizational boundary. Emissions will not be calculated.',
      });
    }

    // ── Review readiness ────────────────────────────────────────────────────
    if (!ctx.factorId) {
      issues.push({
        severity: 'WARNING',
        code: 'FACTOR_LINK_MISSING',
        message: 'Entry is not linked to a durable master emission factor.',
      });
    }
    if (!ctx.createdBy) {
      issues.push({
        severity: 'WARNING',
        code: 'RESPONSIBLE_PERSON_MISSING',
        message: 'No responsible person is recorded for this entry.',
      });
    }

    return issues;
  }
}
