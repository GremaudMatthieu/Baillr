import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { TenantType } from './tenant-type.js';
import { FirstName } from './first-name.js';
import { LastName } from './last-name.js';
import { CompanyName } from './company-name.js';
import { TenantSiret } from './tenant-siret.js';
import { TenantEmail } from './tenant-email.js';
import { PhoneNumber } from './phone-number.js';
import { PostalAddress, type PostalAddressPrimitives } from './postal-address.js';
import { TenantRegistered } from './events/tenant-registered.event.js';
import { TenantUpdated, type TenantUpdatedData } from './events/tenant-updated.event.js';
import { TenantAlreadyExistsException } from './exceptions/tenant-already-exists.exception.js';
import { CompanyNameRequiredException } from './exceptions/company-name-required.exception.js';
import { TenantNotFoundException } from './exceptions/tenant-not-found.exception.js';
import { TenantUnauthorizedException } from './exceptions/tenant-unauthorized.exception.js';

export interface UpdateTenantFields {
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  siret?: string | null;
  email?: string;
  phoneNumber?: string | null;
  address?: PostalAddressPrimitives;
}

export class TenantAggregate extends AggregateRoot {
  private userId!: UserId;
  private entityId!: string;
  private type!: TenantType;
  private firstName!: FirstName;
  private lastName!: LastName;
  private companyName!: CompanyName;
  private siret!: TenantSiret;
  private email!: TenantEmail;
  private phoneNumber!: PhoneNumber;
  private address!: PostalAddress;
  private created = false;

  static readonly streamName = 'tenant';

  create(
    userId: string,
    entityId: string,
    type: string,
    firstName: string,
    lastName: string,
    companyName: string | null,
    siret: string | null,
    email: string,
    phoneNumber: string | null,
    address: PostalAddressPrimitives,
  ): void {
    if (this.created) {
      throw TenantAlreadyExistsException.create();
    }

    const voUserId = UserId.fromString(userId);
    const voType = TenantType.fromString(type);
    const voFirstName = FirstName.fromString(firstName);
    const voLastName = LastName.fromString(lastName);
    const voEmail = TenantEmail.fromString(email);

    // Normalize whitespace-only companyName to null
    const trimmedCompanyName = companyName?.trim() || null;
    const voCompanyName = trimmedCompanyName ? CompanyName.fromString(trimmedCompanyName) : CompanyName.empty();
    if (voType.isCompany && voCompanyName.isEmpty) {
      throw CompanyNameRequiredException.create();
    }

    const voSiret = siret ? TenantSiret.fromString(siret) : TenantSiret.empty();
    const voPhoneNumber = phoneNumber ? PhoneNumber.fromString(phoneNumber) : PhoneNumber.empty();
    const voAddress = PostalAddress.fromPrimitives(address);

    this.apply(
      new TenantRegistered({
        id: this.id,
        entityId,
        userId: voUserId.value,
        type: voType.value,
        firstName: voFirstName.value,
        lastName: voLastName.value,
        companyName: voCompanyName.isEmpty ? null : voCompanyName.value,
        siret: voSiret.isEmpty ? null : voSiret.value,
        email: voEmail.value,
        phoneNumber: voPhoneNumber.isEmpty ? null : voPhoneNumber.value,
        address: voAddress.toPrimitives(),
      }),
    );
  }

  update(userId: string, fields: UpdateTenantFields): void {
    if (!this.created) {
      throw TenantNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw TenantUnauthorizedException.create();
    }

    const eventData: TenantUpdatedData = { id: this.id };

    if (fields.firstName !== undefined) {
      eventData.firstName = FirstName.fromString(fields.firstName).value;
    }
    if (fields.lastName !== undefined) {
      eventData.lastName = LastName.fromString(fields.lastName).value;
    }
    if (fields.companyName !== undefined) {
      const trimmedCompanyName = fields.companyName !== null ? (fields.companyName.trim() || null) : null;
      const voCompanyName = trimmedCompanyName ? CompanyName.fromString(trimmedCompanyName) : CompanyName.empty();
      eventData.companyName = voCompanyName.isEmpty ? null : voCompanyName.value;
    }
    if (fields.siret !== undefined) {
      const voSiret = fields.siret !== null ? TenantSiret.fromString(fields.siret) : TenantSiret.empty();
      eventData.siret = voSiret.isEmpty ? null : voSiret.value;
    }
    if (fields.email !== undefined) {
      eventData.email = TenantEmail.fromString(fields.email).value;
    }
    if (fields.phoneNumber !== undefined) {
      const voPhone =
        fields.phoneNumber !== null ? PhoneNumber.fromString(fields.phoneNumber) : PhoneNumber.empty();
      eventData.phoneNumber = voPhone.isEmpty ? null : voPhone.value;
    }
    if (fields.address !== undefined) {
      eventData.address = PostalAddress.fromPrimitives(fields.address).toPrimitives();
    }

    // Guard: do not emit no-op events when no fields are being changed
    const hasChanges = Object.keys(eventData).length > 1;
    if (!hasChanges) return;

    this.apply(new TenantUpdated(eventData));
  }

  @EventHandler(TenantRegistered)
  onTenantRegistered(event: TenantRegistered): void {
    this.userId = UserId.fromString(event.data.userId);
    this.entityId = event.data.entityId;
    this.type = TenantType.fromString(event.data.type);
    this.firstName = FirstName.fromString(event.data.firstName);
    this.lastName = LastName.fromString(event.data.lastName);
    this.companyName = event.data.companyName
      ? CompanyName.fromString(event.data.companyName)
      : CompanyName.empty();
    this.siret = event.data.siret ? TenantSiret.fromString(event.data.siret) : TenantSiret.empty();
    this.email = TenantEmail.fromString(event.data.email);
    this.phoneNumber = event.data.phoneNumber
      ? PhoneNumber.fromString(event.data.phoneNumber)
      : PhoneNumber.empty();
    this.address = PostalAddress.fromPrimitives(event.data.address);
    this.created = true;
  }

  @EventHandler(TenantUpdated)
  onTenantUpdated(event: TenantUpdated): void {
    if (event.data.firstName !== undefined)
      this.firstName = FirstName.fromString(event.data.firstName);
    if (event.data.lastName !== undefined) this.lastName = LastName.fromString(event.data.lastName);
    if (event.data.companyName !== undefined) {
      this.companyName = event.data.companyName
        ? CompanyName.fromString(event.data.companyName)
        : CompanyName.empty();
    }
    if (event.data.siret !== undefined) {
      this.siret = event.data.siret
        ? TenantSiret.fromString(event.data.siret)
        : TenantSiret.empty();
    }
    if (event.data.email !== undefined) this.email = TenantEmail.fromString(event.data.email);
    if (event.data.phoneNumber !== undefined) {
      this.phoneNumber = event.data.phoneNumber
        ? PhoneNumber.fromString(event.data.phoneNumber)
        : PhoneNumber.empty();
    }
    if (event.data.address !== undefined)
      this.address = PostalAddress.fromPrimitives(event.data.address);
  }
}
