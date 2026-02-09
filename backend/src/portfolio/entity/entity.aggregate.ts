import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { EntityName } from './entity-name.js';
import { EntityType } from './entity-type.js';
import { Siret } from './siret.js';
import { Address, type AddressPrimitives } from './address.js';
import { LegalInformation } from './legal-information.js';
import { EntityCreated } from './events/entity-created.event.js';
import { EntityUpdated, type EntityUpdatedData } from './events/entity-updated.event.js';
import { EntityAlreadyExistsException } from './exceptions/entity-already-exists.exception.js';
import { EntityNotFoundException } from './exceptions/entity-not-found.exception.js';
import { SiretRequiredForSciException } from './exceptions/siret-required-for-sci.exception.js';
import { UnauthorizedEntityAccessException } from './exceptions/unauthorized-entity-access.exception.js';

export interface UpdateEntityFields {
  name?: string;
  siret?: string | null;
  address?: AddressPrimitives;
  legalInformation?: string | null;
}

export class EntityAggregate extends AggregateRoot {
  private userId!: UserId;
  private type!: EntityType;
  private name!: EntityName;
  private siret!: Siret;
  private address!: Address;
  private legalInformation!: LegalInformation;
  private created = false;

  static readonly streamName = 'entity';

  create(
    userId: string,
    type: string,
    name: string,
    siret: string | null,
    address: AddressPrimitives,
    legalInformation: string | null,
  ): void {
    if (this.created) {
      throw EntityAlreadyExistsException.create();
    }

    // Validate userId before event emission
    const voUserId = UserId.fromString(userId);

    // Construct VOs — each self-validates
    const voName = EntityName.fromString(name);
    const voType = EntityType.fromString(type);
    const voSiret = siret ? Siret.create(siret) : Siret.empty();
    const voAddress = Address.fromPrimitives(address);
    const voLegalInfo = legalInformation
      ? LegalInformation.create(legalInformation)
      : LegalInformation.empty();

    // Domain rule: SCI requires SIRET
    if (voType.isSci && voSiret.isEmpty) {
      throw SiretRequiredForSciException.create();
    }

    this.apply(
      new EntityCreated({
        id: this.id,
        userId: voUserId.value,
        type: voType.value,
        name: voName.value,
        siret: voSiret.value,
        address: voAddress.toPrimitives(),
        legalInformation: voLegalInfo.value,
      }),
    );
  }

  update(userId: string, fields: UpdateEntityFields): void {
    if (!this.created) {
      throw EntityNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw UnauthorizedEntityAccessException.create();
    }

    // Validate each provided field through its VO
    const eventData: EntityUpdatedData = { id: this.id };

    if (fields.name !== undefined) {
      eventData.name = EntityName.fromString(fields.name).value;
    }
    if (fields.siret !== undefined) {
      const newSiret = fields.siret !== null ? Siret.create(fields.siret) : Siret.empty();
      if (this.type.isSci && newSiret.isEmpty) {
        throw SiretRequiredForSciException.create();
      }
      eventData.siret = newSiret.value;
    }
    if (fields.address !== undefined) {
      eventData.address = Address.fromPrimitives(fields.address).toPrimitives();
    }
    if (fields.legalInformation !== undefined) {
      eventData.legalInformation =
        fields.legalInformation !== null
          ? LegalInformation.create(fields.legalInformation).value
          : null;
    }

    this.apply(new EntityUpdated(eventData));
  }

  @EventHandler(EntityCreated)
  onEntityCreated(event: EntityCreated): void {
    this.userId = UserId.fromString(event.data.userId);
    this.type = EntityType.fromString(event.data.type);
    this.name = EntityName.fromString(event.data.name);
    this.siret = event.data.siret ? Siret.create(event.data.siret) : Siret.empty();
    this.address = Address.fromPrimitives(event.data.address);
    this.legalInformation = event.data.legalInformation
      ? LegalInformation.create(event.data.legalInformation)
      : LegalInformation.empty();
    this.created = true;
  }

  @EventHandler(EntityUpdated)
  onEntityUpdated(event: EntityUpdated): void {
    if (event.data.name !== undefined) this.name = EntityName.fromString(event.data.name);
    if (event.data.siret !== undefined) {
      this.siret = event.data.siret ? Siret.create(event.data.siret) : Siret.empty();
    }
    if (event.data.address !== undefined) this.address = Address.fromPrimitives(event.data.address);
    if (event.data.legalInformation !== undefined) {
      this.legalInformation = event.data.legalInformation
        ? LegalInformation.create(event.data.legalInformation)
        : LegalInformation.empty();
    }
  }
}
