import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidPropertyAddressException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static streetRequired(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address street is required',
      'PROPERTY_ADDRESS_STREET_REQUIRED',
    );
  }

  static postalCodeRequired(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address postal code is required',
      'PROPERTY_ADDRESS_POSTAL_CODE_REQUIRED',
    );
  }

  static postalCodeInvalid(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address postal code must be 5 digits',
      'PROPERTY_ADDRESS_POSTAL_CODE_INVALID',
    );
  }

  static cityRequired(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address city is required',
      'PROPERTY_ADDRESS_CITY_REQUIRED',
    );
  }

  static countryRequired(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address country is required',
      'PROPERTY_ADDRESS_COUNTRY_REQUIRED',
    );
  }

  static streetTooLong(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address street exceeds 500 characters',
      'PROPERTY_ADDRESS_STREET_TOO_LONG',
    );
  }

  static cityTooLong(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address city exceeds 255 characters',
      'PROPERTY_ADDRESS_CITY_TOO_LONG',
    );
  }

  static countryTooLong(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address country exceeds 100 characters',
      'PROPERTY_ADDRESS_COUNTRY_TOO_LONG',
    );
  }

  static complementTooLong(): InvalidPropertyAddressException {
    return new InvalidPropertyAddressException(
      'Property address complement exceeds 500 characters',
      'PROPERTY_ADDRESS_COMPLEMENT_TOO_LONG',
    );
  }
}
