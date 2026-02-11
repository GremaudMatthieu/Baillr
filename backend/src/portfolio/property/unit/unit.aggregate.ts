import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { UnitIdentifier } from './unit-identifier.js';
import { UnitType } from './unit-type.js';
import { Floor } from './floor.js';
import { SurfaceArea } from './surface-area.js';
import { BillableOption, type BillableOptionPrimitives } from './billable-option.js';
import { UnitCreated } from './events/unit-created.event.js';
import { UnitUpdated, type UnitUpdatedData } from './events/unit-updated.event.js';
import { UnitAlreadyExistsException } from './exceptions/unit-already-exists.exception.js';
import { UnitNotFoundException } from './exceptions/unit-not-found.exception.js';
import { UnauthorizedUnitAccessException } from './exceptions/unauthorized-unit-access.exception.js';

export interface BillableOptionState {
  label: string;
  amountCents: number;
}

export interface UpdateUnitFields {
  identifier?: string;
  type?: string;
  floor?: number | null;
  surfaceArea?: number;
  billableOptions?: BillableOptionPrimitives[];
}

export class UnitAggregate extends AggregateRoot {
  private userId!: UserId;
  private propertyId!: string;
  private identifier!: UnitIdentifier;
  private type!: UnitType;
  private floor!: Floor;
  private surfaceArea!: SurfaceArea;
  private billableOptions: Map<string, BillableOptionState> = new Map();
  private created = false;

  static readonly streamName = 'unit';

  create(
    userId: string,
    propertyId: string,
    identifier: string,
    type: string,
    floor: number | null,
    surfaceArea: number,
    billableOptions: BillableOptionPrimitives[],
  ): void {
    if (this.created) {
      throw UnitAlreadyExistsException.create();
    }

    const voUserId = UserId.fromString(userId);
    const voIdentifier = UnitIdentifier.fromString(identifier);
    const voType = UnitType.fromString(type);
    const voFloor = floor !== null && floor !== undefined ? Floor.fromNumber(floor) : Floor.empty();
    const voSurfaceArea = SurfaceArea.fromNumber(surfaceArea);

    const validatedOptions = billableOptions.map((opt) => BillableOption.fromPrimitives(opt));

    this.apply(
      new UnitCreated({
        id: this.id,
        propertyId,
        userId: voUserId.value,
        identifier: voIdentifier.value,
        type: voType.value,
        floor: voFloor.isEmpty ? null : voFloor.value,
        surfaceArea: voSurfaceArea.value,
        billableOptions: validatedOptions.map((opt) => opt.toPrimitives()),
      }),
    );
  }

  update(userId: string, fields: UpdateUnitFields): void {
    if (!this.created) {
      throw UnitNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw UnauthorizedUnitAccessException.create();
    }

    const eventData: UnitUpdatedData = { id: this.id };

    if (fields.identifier !== undefined) {
      eventData.identifier = UnitIdentifier.fromString(fields.identifier).value;
    }
    if (fields.type !== undefined) {
      eventData.type = UnitType.fromString(fields.type).value;
    }
    if (fields.floor !== undefined) {
      const newFloor = fields.floor !== null ? Floor.fromNumber(fields.floor) : Floor.empty();
      eventData.floor = newFloor.isEmpty ? null : newFloor.value;
    }
    if (fields.surfaceArea !== undefined) {
      eventData.surfaceArea = SurfaceArea.fromNumber(fields.surfaceArea).value;
    }
    if (fields.billableOptions !== undefined) {
      const validatedOptions = fields.billableOptions.map((opt) =>
        BillableOption.fromPrimitives(opt),
      );
      eventData.billableOptions = validatedOptions.map((opt) => opt.toPrimitives());
    }

    // Guard: do not emit no-op events when no fields are being changed
    const hasChanges = Object.keys(eventData).length > 1;
    if (!hasChanges) return;

    this.apply(new UnitUpdated(eventData));
  }

  @EventHandler(UnitCreated)
  onUnitCreated(event: UnitCreated): void {
    this.userId = UserId.fromString(event.data.userId);
    this.propertyId = event.data.propertyId;
    this.identifier = UnitIdentifier.fromString(event.data.identifier);
    this.type = UnitType.fromString(event.data.type);
    this.floor = event.data.floor !== null ? Floor.fromNumber(event.data.floor) : Floor.empty();
    this.surfaceArea = SurfaceArea.fromNumber(event.data.surfaceArea);
    this.billableOptions = new Map();
    for (const opt of event.data.billableOptions) {
      this.billableOptions.set(opt.label, { label: opt.label, amountCents: opt.amountCents });
    }
    this.created = true;
  }

  @EventHandler(UnitUpdated)
  onUnitUpdated(event: UnitUpdated): void {
    if (event.data.identifier !== undefined) {
      this.identifier = UnitIdentifier.fromString(event.data.identifier);
    }
    if (event.data.type !== undefined) {
      this.type = UnitType.fromString(event.data.type);
    }
    if (event.data.floor !== undefined) {
      this.floor = event.data.floor !== null ? Floor.fromNumber(event.data.floor) : Floor.empty();
    }
    if (event.data.surfaceArea !== undefined) {
      this.surfaceArea = SurfaceArea.fromNumber(event.data.surfaceArea);
    }
    if (event.data.billableOptions !== undefined) {
      this.billableOptions = new Map();
      for (const opt of event.data.billableOptions) {
        this.billableOptions.set(opt.label, { label: opt.label, amountCents: opt.amountCents });
      }
    }
  }
}
