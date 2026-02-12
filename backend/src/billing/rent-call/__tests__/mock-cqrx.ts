const EVENTS = Symbol('events');

class MockEvent {
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  type: string;
  constructor(data?: Record<string, unknown>, metadata?: Record<string, unknown>) {
    this.data = data ?? {};
    this.metadata = metadata ?? {};
    this.type = this.constructor.name;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MockEventHandler(_event: unknown) {
  return function (_target: object, _key: string, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

class MockAggregateRoot {
  streamId: string;
  id: string;
  [EVENTS]: unknown[] = [];
  constructor(id?: string) {
    this.id = id ?? '';
    const streamName =
      'streamName' in this.constructor &&
      typeof (this.constructor as Record<string, unknown>).streamName === 'string'
        ? (this.constructor as Record<string, unknown>).streamName
        : this.constructor.name;
    this.streamId = `${String(streamName)}_${String(id)}`;
  }
  apply(event: { constructor: { name: string } }) {
    this[EVENTS].push(event);
    const handlerName = `on${event.constructor.name}`;
    const self = this as unknown as Record<string, (...args: unknown[]) => void>;
    if (typeof self[handlerName] === 'function') {
      self[handlerName](event);
    }
  }
  getUncommittedEvents() {
    return [...this[EVENTS]];
  }
  commit() {
    this[EVENTS].length = 0;
  }
}

export const mockCqrx = {
  AggregateRoot: MockAggregateRoot,
  Event: MockEvent,
  EventHandler: MockEventHandler,
  InjectAggregateRepository: () => () => {},
  AggregateRepository: class {},
  CqrxModule: { forRoot: () => ({}), forFeature: () => ({}) },
};
