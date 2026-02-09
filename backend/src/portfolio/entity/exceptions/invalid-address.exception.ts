import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidAddressException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static streetRequired(): InvalidAddressException {
    return new InvalidAddressException('Street is required', 'ADDRESS_STREET_REQUIRED');
  }

  static postalCodeRequired(): InvalidAddressException {
    return new InvalidAddressException('Postal code is required', 'ADDRESS_POSTAL_CODE_REQUIRED');
  }

  static postalCodeInvalid(): InvalidAddressException {
    return new InvalidAddressException(
      'Postal code must be 5 digits',
      'ADDRESS_POSTAL_CODE_INVALID',
    );
  }

  static cityRequired(): InvalidAddressException {
    return new InvalidAddressException('City is required', 'ADDRESS_CITY_REQUIRED');
  }

  static countryRequired(): InvalidAddressException {
    return new InvalidAddressException('Country is required', 'ADDRESS_COUNTRY_REQUIRED');
  }
}
