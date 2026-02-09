import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthRequest } from './auth.types';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthRequest>();
  const userId = request.user?.userId;
  if (!userId) {
    throw new UnauthorizedException('User ID is required');
  }
  return userId;
});
