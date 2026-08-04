import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { IDecodeUserDetails } from 'src/utility/base-interface.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IDecodeUserDetails => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request?.['user'] as IDecodeUserDetails;
  },
);
