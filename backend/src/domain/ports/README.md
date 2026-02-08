# Domain Ports

This directory contains port interfaces (hexagonal architecture).

Ports define the contracts that the domain layer uses to communicate with the outside world.
Infrastructure adapters implement these ports.

## Convention

- File naming: `{name}.port.ts`
- Each port is a TypeScript interface
- Domain code depends ONLY on these interfaces, never on concrete implementations
- Infrastructure adapters implement these interfaces and are injected via NestJS DI

## Examples (created in future stories)

- `tenant.repository.port.ts` — Tenant aggregate persistence
- `lease.repository.port.ts` — Lease aggregate persistence
- `event-store.port.ts` — Event sourcing interface
