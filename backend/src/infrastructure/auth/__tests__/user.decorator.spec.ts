import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from '../user.decorator';

type DecoratorFactory = (data: unknown, ctx: ExecutionContext) => string;

function getParamDecoratorFactory(): DecoratorFactory {
  class TestController {
    testMethod(@CurrentUser() user: string) {
      return user;
    }
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'testMethod') as Record<
    string,
    { factory: DecoratorFactory }
  >;
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

function createMockExecutionContext(requestUser: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: <T>(): T => ({ user: requestUser }) as T,
    }),
  } as unknown as ExecutionContext;
}

describe('CurrentUser decorator', () => {
  it('should extract userId from request.user', () => {
    const factory = getParamDecoratorFactory();
    const ctx = createMockExecutionContext({ userId: 'user_abc123' });

    const result = factory(undefined, ctx);

    expect(result).toBe('user_abc123');
  });

  it('should throw UnauthorizedException when request.user is not set', () => {
    const factory = getParamDecoratorFactory();
    const ctx = createMockExecutionContext(undefined);

    expect(() => factory(undefined, ctx)).toThrow(UnauthorizedException);
  });
});
