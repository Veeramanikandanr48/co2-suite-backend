import { ILoggerMethods } from 'src/utility/base-interface.interface';

export interface IApprovalData {
  readonly approvalModuleUniqueId: number;
  readonly approvalModuleId: number;
  readonly isRoleApproval: boolean;
  readonly toUserId?: number;
  readonly toRoleId?: number;
  readonly userId: number;
  readonly approvalStatusId?: number;
  readonly reason?: string;
  logger?: ILoggerMethods;
  readonly userRoleId: number;
  readonly servicePartnerId?: number;
  readonly masterServiceTypeId?: number;
}

export interface INextAprDetail {
  approvalOrder: number;
  approvalGroup: number;
  isParallel: boolean;
  toRoleId: number;
  approvalStatusId: number;
}

export interface ApprovalDetailsResponse {
  approvalModuleUniqueId: number;
  roleStatus: {
    apprStatusId: number;
    actionAccess: boolean;
    apprStatusName: string;
  };
  currentApprDet: {
    currentApprover: string;
    currentApprovalOrder: number;
  };
  previousApprDet: {
    previousAppr: string;
    previousApprId: number;
    roleName: string;
  };
}

export interface ApprovalAccessResult {
  hasAccess: boolean;
  message: string;
}

export interface IApprovalRemarksData {
  userApprovalId: number;
  remarks: string;
  approvalStatusId: number;
  createdBy: number;
}

export interface IApprovalUpdatePayload {
  approvalModuleId: number;
  approvalModuleUniqueId: number;
  updatedBy: number;
  isActive: boolean;
}
