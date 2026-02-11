import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { UserId } from '@shared/user-id.js';
import { EntityName } from './entity-name.js';
import { EntityType } from './entity-type.js';
import { Siret } from './siret.js';
import { Address, type AddressPrimitives } from './address.js';
import { LegalInformation } from './legal-information.js';
import { Iban } from './iban.js';
import { Bic } from './bic.js';
import { BankAccountLabel } from './bank-account-label.js';
import { BankName } from './bank-name.js';
import { EntityCreated } from './events/entity-created.event.js';
import { EntityUpdated, type EntityUpdatedData } from './events/entity-updated.event.js';
import { BankAccountAdded } from './events/bank-account-added.event.js';
import { BankAccountUpdated } from './events/bank-account-updated.event.js';
import { BankAccountRemoved } from './events/bank-account-removed.event.js';
import { EntityAlreadyExistsException } from './exceptions/entity-already-exists.exception.js';
import { EntityNotFoundException } from './exceptions/entity-not-found.exception.js';
import { SiretRequiredForSciException } from './exceptions/siret-required-for-sci.exception.js';
import { UnauthorizedEntityAccessException } from './exceptions/unauthorized-entity-access.exception.js';
import { InvalidIbanException } from './exceptions/invalid-iban.exception.js';
import { CashRegisterCannotBeDefaultException } from './exceptions/cash-register-cannot-be-default.exception.js';
import { InvalidBankAccountTypeException } from './exceptions/invalid-bank-account-type.exception.js';
import { CashRegisterAlreadyExistsException } from './exceptions/cash-register-already-exists.exception.js';
import { BankAccountNotFoundException } from './exceptions/bank-account-not-found.exception.js';

export interface UpdateEntityFields {
  name?: string;
  siret?: string | null;
  address?: AddressPrimitives;
  legalInformation?: string | null;
}

export interface UpdateBankAccountFields {
  label?: string;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
  isDefault?: boolean;
}

interface BankAccountState {
  accountId: string;
  type: 'bank_account' | 'cash_register';
  label: string;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  isDefault: boolean;
}

export class EntityAggregate extends AggregateRoot {
  private userId!: UserId;
  private type!: EntityType;
  private name!: EntityName;
  private siret!: Siret;
  private address!: Address;
  private legalInformation!: LegalInformation;
  private created = false;
  private bankAccounts: Map<string, BankAccountState> = new Map();

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

  addBankAccount(
    userId: string,
    accountId: string,
    type: string,
    label: string,
    iban: string | null,
    bic: string | null,
    bankName: string | null,
    isDefault: boolean,
  ): void {
    if (!this.created) {
      throw EntityNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw UnauthorizedEntityAccessException.create();
    }

    // Validate VOs
    const voLabel = BankAccountLabel.fromString(label);
    if (type !== 'bank_account' && type !== 'cash_register') {
      throw InvalidBankAccountTypeException.create(type);
    }
    const voType = type;
    const voIban = iban ? Iban.fromString(iban) : Iban.empty();
    const voBic = bic ? Bic.fromString(bic) : Bic.empty();
    const voBankName = bankName ? BankName.fromString(bankName) : BankName.empty();

    // Domain rules
    if (voType === 'bank_account' && voIban.isEmpty) {
      throw InvalidIbanException.requiredForBankAccount();
    }
    if (voType === 'cash_register' && isDefault) {
      throw CashRegisterCannotBeDefaultException.create();
    }
    if (voType === 'cash_register') {
      const hasCashRegister = [...this.bankAccounts.values()].some(
        (a) => a.type === 'cash_register',
      );
      if (hasCashRegister) {
        throw CashRegisterAlreadyExistsException.create();
      }
    }

    // Unset previous default if setting new default
    if (isDefault) {
      const currentDefault = [...this.bankAccounts.entries()].find(([, a]) => a.isDefault);
      if (currentDefault) {
        this.apply(
          new BankAccountUpdated({
            id: this.id,
            entityId: this.id,
            accountId: currentDefault[0],
            isDefault: false,
          }),
        );
      }
    }

    this.apply(
      new BankAccountAdded({
        id: this.id,
        entityId: this.id,
        accountId,
        type: voType,
        label: voLabel.value,
        iban: voIban.value,
        bic: voBic.value,
        bankName: voBankName.value,
        isDefault,
      }),
    );
  }

  updateBankAccount(userId: string, accountId: string, fields: UpdateBankAccountFields): void {
    if (!this.created) {
      throw EntityNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw UnauthorizedEntityAccessException.create();
    }

    const account = this.bankAccounts.get(accountId);
    if (!account) {
      throw BankAccountNotFoundException.create(accountId);
    }

    // Validate provided fields through VOs
    if (fields.label !== undefined) {
      BankAccountLabel.fromString(fields.label);
    }
    if (fields.iban !== undefined && fields.iban !== null) {
      Iban.fromString(fields.iban);
    }
    if (fields.bic !== undefined && fields.bic !== null) {
      Bic.fromString(fields.bic);
    }
    if (fields.bankName !== undefined && fields.bankName !== null) {
      BankName.fromString(fields.bankName);
    }

    // Domain rules: cash register cannot be default
    if (account.type === 'cash_register' && fields.isDefault === true) {
      throw CashRegisterCannotBeDefaultException.create();
    }

    // Check if IBAN would become null on a bank_account
    if (account.type === 'bank_account' && fields.iban === null) {
      throw InvalidIbanException.requiredForBankAccount();
    }

    // Unset previous default if setting new default
    if (fields.isDefault === true) {
      const currentDefault = [...this.bankAccounts.entries()].find(
        ([id, a]) => a.isDefault && id !== accountId,
      );
      if (currentDefault) {
        this.apply(
          new BankAccountUpdated({
            id: this.id,
            entityId: this.id,
            accountId: currentDefault[0],
            isDefault: false,
          }),
        );
      }
    }

    this.apply(
      new BankAccountUpdated({
        id: this.id,
        entityId: this.id,
        accountId,
        label: fields.label,
        iban: fields.iban,
        bic: fields.bic,
        bankName: fields.bankName,
        isDefault: fields.isDefault,
      }),
    );
  }

  removeBankAccount(userId: string, accountId: string): void {
    if (!this.created) {
      throw EntityNotFoundException.create();
    }
    if (this.userId.value !== userId) {
      throw UnauthorizedEntityAccessException.create();
    }

    const account = this.bankAccounts.get(accountId);
    if (!account) {
      throw BankAccountNotFoundException.create(accountId);
    }

    this.apply(
      new BankAccountRemoved({
        id: this.id,
        entityId: this.id,
        accountId,
      }),
    );
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

  @EventHandler(BankAccountAdded)
  onBankAccountAdded(event: BankAccountAdded): void {
    this.bankAccounts.set(event.data.accountId, {
      accountId: event.data.accountId,
      type: event.data.type,
      label: event.data.label,
      iban: event.data.iban,
      bic: event.data.bic,
      bankName: event.data.bankName,
      isDefault: event.data.isDefault,
    });
  }

  @EventHandler(BankAccountUpdated)
  onBankAccountUpdated(event: BankAccountUpdated): void {
    const account = this.bankAccounts.get(event.data.accountId);
    if (!account) return;

    if (event.data.label !== undefined) account.label = event.data.label;
    if (event.data.iban !== undefined) account.iban = event.data.iban;
    if (event.data.bic !== undefined) account.bic = event.data.bic;
    if (event.data.bankName !== undefined) account.bankName = event.data.bankName;
    if (event.data.isDefault !== undefined) account.isDefault = event.data.isDefault;
  }

  @EventHandler(BankAccountRemoved)
  onBankAccountRemoved(event: BankAccountRemoved): void {
    this.bankAccounts.delete(event.data.accountId);
  }
}
