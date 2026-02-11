import { InvalidPropertyAddressException } from './exceptions/invalid-property-address.exception.js';

export interface PropertyAddressPrimitives {
  street: string;
  postalCode: string;
  city: string;
  country: string;
  complement: string | null;
}

export class PropertyAddress {
  private constructor(
    private readonly _street: string,
    private readonly _postalCode: string,
    private readonly _city: string,
    private readonly _country: string,
    private readonly _complement: string | null,
  ) {}

  static fromPrimitives(data: PropertyAddressPrimitives): PropertyAddress {
    const street = data.street?.trim() ?? '';
    const postalCode = data.postalCode?.trim() ?? '';
    const city = data.city?.trim() ?? '';
    const country = data.country?.trim() ?? '';
    const complement = data.complement?.trim() || null;

    if (!street) {
      throw InvalidPropertyAddressException.streetRequired();
    }
    if (street.length > 500) {
      throw InvalidPropertyAddressException.streetTooLong();
    }
    if (!postalCode) {
      throw InvalidPropertyAddressException.postalCodeRequired();
    }
    if (!/^\d{5}$/.test(postalCode)) {
      throw InvalidPropertyAddressException.postalCodeInvalid();
    }
    if (!city) {
      throw InvalidPropertyAddressException.cityRequired();
    }
    if (city.length > 255) {
      throw InvalidPropertyAddressException.cityTooLong();
    }
    if (!country) {
      throw InvalidPropertyAddressException.countryRequired();
    }
    if (country.length > 100) {
      throw InvalidPropertyAddressException.countryTooLong();
    }
    if (complement && complement.length > 500) {
      throw InvalidPropertyAddressException.complementTooLong();
    }
    return new PropertyAddress(street, postalCode, city, country, complement);
  }

  static empty(): PropertyAddress {
    return new PropertyAddress('', '', '', '', null);
  }

  get isEmpty(): boolean {
    return (
      this._street === '' && this._postalCode === '' && this._city === '' && this._country === ''
    );
  }

  toPrimitives(): PropertyAddressPrimitives {
    return {
      street: this._street,
      postalCode: this._postalCode,
      city: this._city,
      country: this._country,
      complement: this._complement,
    };
  }

  equals(other: PropertyAddress): boolean {
    return (
      this._street === other._street &&
      this._postalCode === other._postalCode &&
      this._city === other._city &&
      this._country === other._country &&
      this._complement === other._complement
    );
  }
}
