import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthRequest } from './auth.types';

@Injectable()
export class ClerkAuthGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  onModuleInit() {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY environment variable is required');
    }
    this.logger.log('ClerkAuthGuard initialized with CLERK_SECRET_KEY');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      request.user = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractToken(request: AuthRequest): string | null {
    const auth = request.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
