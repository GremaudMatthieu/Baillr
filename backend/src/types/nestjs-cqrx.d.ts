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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class Event<TData = any> {
    streamId: string;
    id: string;
    revision: bigint;
    created: Date;
    isJson: boolean;
    type: string;
    data: TData;
    metadata: Record<string, unknown>;
    constructor(data?: TData, metadata?: Record<string, unknown>);
    static isRecordedEvent(event: unknown): boolean;
  }

  export function EventHandler(
    event: Type,
  ): (target: object, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

  export class AggregateRoot {
    streamId: string;
    id: string;
    constructor(id?: string);
    get version(): number;
    get revision(): bigint;
    apply(event: Event): void;
    commit(): void;
    getUncommittedEvents(): Event[];
  }

  export function InjectAggregateRepository(
    aggregate: Type,
  ): (target: object, key: string | symbol | undefined, index?: number) => void;

  export class AggregateRepository<T extends AggregateRoot = AggregateRoot> {
    save(aggregate: T): Promise<void>;
    load(id: string): Promise<T>;
  }

  export function aggregateRepositoryToken(aggregate: Type): string;

  export const ANY: symbol;
  export const NO_STREAM: symbol;
  export const STREAM_EXISTS: symbol;
}
