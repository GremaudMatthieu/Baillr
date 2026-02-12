import { InvalidPostalAddressException } from './exceptions/invalid-postal-address.exception.js';

export interface PostalAddressPrimitives {
  street: string | null;
  postalCode: string | null;
  city: string | null;
  complement: string | null;
}

export class PostalAddress {
  private constructor(
    private readonly _street: string | null,
    private readonly _postalCode: string | null,
    private readonly _city: string | null,
    private readonly _complement: string | null,
  ) {}

  static fromPrimitives(data: PostalAddressPrimitives): PostalAddress {
    const street = data.street?.trim() || null;
    const postalCode = data.postalCode?.trim() || null;
    const city = data.city?.trim() || null;
    const complement = data.complement?.trim() || null;

    if (street && street.length > 500) {
      throw InvalidPostalAddressException.streetTooLong();
    }
    if (postalCode && !/^\d{5}$/.test(postalCode)) {
      throw InvalidPostalAddressException.postalCodeInvalid();
    }
    if (city && city.length > 100) {
      throw InvalidPostalAddressException.cityTooLong();
    }
    if (complement && complement.length > 255) {
      throw InvalidPostalAddressException.complementTooLong();
    }

    return new PostalAddress(street, postalCode, city, complement);
  }

  static empty(): PostalAddress {
    return new PostalAddress(null, null, null, null);
  }

  get isEmpty(): boolean {
    return !this._street && !this._postalCode && !this._city;
  }

  toPrimitives(): PostalAddressPrimitives {
    return {
      street: this._street,
      postalCode: this._postalCode,
      city: this._city,
      complement: this._complement,
    };
  }

  equals(other: PostalAddress): boolean {
    return (
      this._street === other._street &&
      this._postalCode === other._postalCode &&
      this._city === other._city &&
      this._complement === other._complement
    );
  }
}
