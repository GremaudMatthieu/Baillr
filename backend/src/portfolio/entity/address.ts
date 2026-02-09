import { InvalidAddressException } from './exceptions/invalid-address.exception.js';

export interface AddressPrimitives {
  street: string;
  postalCode: string;
  city: string;
  country: string;
  complement: string | null;
}

export class Address {
  private constructor(
    private readonly _street: string,
    private readonly _postalCode: string,
    private readonly _city: string,
    private readonly _country: string,
    private readonly _complement: string | null,
  ) {}

  static fromPrimitives(data: AddressPrimitives): Address {
    if (!data.street?.trim()) {
      throw InvalidAddressException.streetRequired();
    }
    if (!data.postalCode?.trim()) {
      throw InvalidAddressException.postalCodeRequired();
    }
    if (!/^\d{5}$/.test(data.postalCode.trim())) {
      throw InvalidAddressException.postalCodeInvalid();
    }
    if (!data.city?.trim()) {
      throw InvalidAddressException.cityRequired();
    }
    if (!data.country?.trim()) {
      throw InvalidAddressException.countryRequired();
    }
    return new Address(
      data.street.trim(),
      data.postalCode.trim(),
      data.city.trim(),
      data.country.trim(),
      data.complement?.trim() || null,
    );
  }

  toPrimitives(): AddressPrimitives {
    return {
      street: this._street,
      postalCode: this._postalCode,
      city: this._city,
      country: this._country,
      complement: this._complement,
    };
  }

  equals(other: Address): boolean {
    return (
      this._street === other._street &&
      this._postalCode === other._postalCode &&
      this._city === other._city &&
      this._country === other._country &&
      this._complement === other._complement
    );
  }
}
