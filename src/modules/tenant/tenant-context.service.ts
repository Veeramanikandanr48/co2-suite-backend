import { Injectable, Scope } from '@nestjs/common';

export interface ITenantContext {
  organizationId: string | null;
  schemaName: string;
  roleKey: string;
  isRootUser: boolean;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantContext: ITenantContext = {
    organizationId: null,
    schemaName: 'public',
    roleKey: 'ROOT',
    isRootUser: true,
  };

  setTenantContext(context: ITenantContext): void {
    this.tenantContext = context;
  }

  getTenantContext(): ITenantContext {
    return this.tenantContext;
  }

  get schemaName(): string {
    return this.tenantContext.schemaName;
  }

  get organizationId(): string | null {
    return this.tenantContext.organizationId;
  }

  get isRootUser(): boolean {
    return this.tenantContext.isRootUser;
  }
}
