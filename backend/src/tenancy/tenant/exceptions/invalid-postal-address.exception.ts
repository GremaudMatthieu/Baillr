import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidPostalAddressException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }

  static streetTooLong(): InvalidPostalAddressException {
    return new InvalidPostalAddressException(
      'Postal address street exceeds 500 characters',
      'POSTAL_ADDRESS_STREET_TOO_LONG',
    );
  }

  static postalCodeInvalid(): InvalidPostalAddressException {
    return new InvalidPostalAddressException(
      'Postal code must be 5 digits',
      'POSTAL_ADDRESS_POSTAL_CODE_INVALID',
    );
  }

  static cityTooLong(): InvalidPostalAddressException {
    return new InvalidPostalAddressException(
      'Postal address city exceeds 100 characters',
      'POSTAL_ADDRESS_CITY_TOO_LONG',
    );
  }

  static complementTooLong(): InvalidPostalAddressException {
    return new InvalidPostalAddressException(
      'Postal address complement exceeds 255 characters',
      'POSTAL_ADDRESS_COMPLEMENT_TOO_LONG',
    );
  }
}
