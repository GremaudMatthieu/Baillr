// Type declaration for nestjs-cqrx which lacks proper `types` condition in its package.json exports map.
// This allows TypeScript with `moduleResolution: "nodenext"` to resolve the module types.
// See: https://github.com/unlight/nestjs-cqrx/issues — exports map missing types condition
declare module 'nestjs-cqrx' {
  import { DynamicModule, Type } from '@nestjs/common';
  import { ModuleMetadata, FactoryProvider } from '@nestjs/common';

  interface CqrxModuleOptions {
    eventstoreConnectionString: string | undefined;
    subscribeToAll: boolean | undefined;
  }

  interface CqrxOptionsFactory {
    createCqrxOptions(): Partial<CqrxModuleOptions>;
  }

  interface CqrxModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useClass?: Type<CqrxOptionsFactory>;
    useExisting?: Type<CqrxOptionsFactory>;
    useFactory?: (
      ...args: unknown[]
    ) => Promise<Partial<CqrxModuleOptions>> | Partial<CqrxModuleOptions>;
    inject?: FactoryProvider['inject'];
  }

  export class CqrxModule {
    static forRoot(options: Partial<CqrxModuleOptions>): DynamicModule;
    static forRootAsync(options: CqrxModuleAsyncOptions): DynamicModule;
    static forFeature(aggregateRoots: Type[], classTransformers?: unknown): DynamicModule;
    static forFeatureAsync(factories?: unknown[]): DynamicModule;
  }

  export class AggregateRoot {
    commit(): void;
  }

  export function InjectAggregateRepository(
    aggregate: Type,
  ): (target: object, key: string | symbol | undefined, index?: number) => void;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export class AggregateRepository<T extends AggregateRoot = AggregateRoot> {}

  export function aggregateRepositoryToken(aggregate: Type): string;

  export const ANY: symbol;
  export const NO_STREAM: symbol;
  export const STREAM_EXISTS: symbol;
}
