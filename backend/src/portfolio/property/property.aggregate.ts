import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { PropertyName } from './property-name.js';
import { PropertyType } from './property-type.js';
import { PropertyAddress, type PropertyAddressPrimitives } from './property-address.js';
import { PropertyCreated } from './events/property-created.event.js';
import { PropertyUpdated, type PropertyUpdatedData } from './events/property-updated.event.js';
import { PropertyAlreadyExistsException } from './exceptions/property-already-exists.exception.js';
import { PropertyNotFoundException } from './exceptions/property-not-found.exception.js';
import { UnauthorizedPropertyAccessException } from './exceptions/unauthorized-property-access.exception.js';

export interface UpdatePropertyFields {
  name?: string;
  type?: string | null;
  address?: PropertyAddressPrimitives;
}

export class PropertyAggregate extends AggregateRoot {
  private userId!: UserId;
  private entityId!: string;
  private name!: PropertyName;
  private type!: PropertyType;
  private address!: PropertyAddress;
  private created = false;

  static readonly streamName = 'property';

  create(
    userId: string,
    entityId: string,
    name: string,
    type: string | null,
    address: PropertyAddressPrimitives,
  ): void {
    if (this.created) {
      throw PropertyAlreadyExistsException.create();
    }

    const voUserId = UserId.fromString(userId);
    const voName = PropertyName.fromString(name);
    const voType = type ? PropertyType.fromString(type) : PropertyType.empty();
    const voAddress = PropertyAddress.fromPrimitives(address);

    this.apply(
      new PropertyCreated({
        id: this.id,
        entityId,
        userId: voUserId.value,
        name: voName.value,
        type: voType.isEmpty ? null : voType.value,
        address: voAddress.toPrimitives(),
      }),
    );
  }

  update(userId: string, fields: UpdatePropertyFields): void {
    if (!this.created) {
      throw PropertyNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw UnauthorizedPropertyAccessException.create();
    }

    const eventData: PropertyUpdatedData = { id: this.id };

    if (fields.name !== undefined) {
      eventData.name = PropertyName.fromString(fields.name).value;
    }
    if (fields.type !== undefined) {
      const newType =
        fields.type !== null ? PropertyType.fromString(fields.type) : PropertyType.empty();
      eventData.type = newType.isEmpty ? null : newType.value;
    }
    if (fields.address !== undefined) {
      eventData.address = PropertyAddress.fromPrimitives(fields.address).toPrimitives();
    }

    // Guard: do not emit no-op events when no fields are being changed
    const hasChanges = Object.keys(eventData).length > 1;
    if (!hasChanges) return;

    this.apply(new PropertyUpdated(eventData));
  }

  @EventHandler(PropertyCreated)
  onPropertyCreated(event: PropertyCreated): void {
    this.userId = UserId.fromString(event.data.userId);
    this.entityId = event.data.entityId;
    this.name = PropertyName.fromString(event.data.name);
    this.type = event.data.type ? PropertyType.fromString(event.data.type) : PropertyType.empty();
    this.address = PropertyAddress.fromPrimitives(event.data.address);
    this.created = true;
  }

  @EventHandler(PropertyUpdated)
  onPropertyUpdated(event: PropertyUpdated): void {
    if (event.data.name !== undefined) this.name = PropertyName.fromString(event.data.name);
    if (event.data.type !== undefined) {
      this.type = event.data.type ? PropertyType.fromString(event.data.type) : PropertyType.empty();
    }
    if (event.data.address !== undefined)
      this.address = PropertyAddress.fromPrimitives(event.data.address);
  }
}
