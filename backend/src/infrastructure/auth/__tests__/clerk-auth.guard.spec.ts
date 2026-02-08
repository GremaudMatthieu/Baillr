import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClerkAuthGuard } from '../clerk-auth.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

import { verifyToken } from '@clerk/backend';

const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

interface MockRequest {
  headers: Record<string, string>;
  user?: { userId: string };
}

function createMockExecutionContext(headers: Record<string, string> = {}): {
  context: ExecutionContext;
  request: MockRequest;
} {
  const request: MockRequest = { headers };

  const context = {
    switchToHttp: () => ({
      getRequest: <T = MockRequest>(): T => request as T,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ClerkAuthGuard(reflector);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should throw when CLERK_SECRET_KEY is not set', () => {
      const original = process.env.CLERK_SECRET_KEY;
      delete process.env.CLERK_SECRET_KEY;

      expect(() => guard.onModuleInit()).toThrow(
        'CLERK_SECRET_KEY environment variable is required',
      );

      process.env.CLERK_SECRET_KEY = original;
    });

    it('should not throw when CLERK_SECRET_KEY is set', () => {
      const original = process.env.CLERK_SECRET_KEY;
      process.env.CLERK_SECRET_KEY = 'sk_test_fake';

      expect(() => guard.onModuleInit()).not.toThrow();

      process.env.CLERK_SECRET_KEY = original;
    });
  });

  it('should return 401 when no Authorization header is present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockExecutionContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should return 401 when Authorization header has no Bearer prefix', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockExecutionContext({
      authorization: 'Basic some-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should return 401 when token is invalid/expired', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockedVerifyToken.mockRejectedValue(new Error('Token expired'));

    const { context } = createMockExecutionContext({
      authorization: 'Bearer invalid-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should extract userId and attach to request when token is valid', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockedVerifyToken.mockResolvedValue({ sub: 'user_123' } as never);

    const { context, request } = createMockExecutionContext({
      authorization: 'Bearer valid-token',
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ userId: 'user_123' });
    expect(mockedVerifyToken).toHaveBeenCalledWith('valid-token', {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  });

  it('should skip auth for routes decorated with @Public()', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return false;
    });

    const { context } = createMockExecutionContext({});

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockedVerifyToken).not.toHaveBeenCalled();
  });
});
