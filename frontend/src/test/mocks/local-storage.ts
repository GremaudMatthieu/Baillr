import { vi } from "vitest";

export function createMockLocalStorage() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    get length() {
      return store.size;
    },
    key: vi.fn((index: number) => {
      return Array.from(store.keys())[index] ?? null;
    }),
    _store: store,
  };
}

export function installMockLocalStorage() {
  const mock = createMockLocalStorage();
  Object.defineProperty(globalThis, "localStorage", { value: mock, writable: true });
  return mock;
}
