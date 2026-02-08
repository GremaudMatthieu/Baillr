import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user?.userId;
  },
);
