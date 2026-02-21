import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InseeApiUnavailableException extends DomainException {
  private constructor(message: string) {
    super(message, 'INSEE_API_UNAVAILABLE', 503);
    this.name = 'InseeApiUnavailableException';
  }

  static networkError(): InseeApiUnavailableException {
    return new InseeApiUnavailableException(
      'Le service INSEE est temporairement indisponible (erreur réseau).',
    );
  }

  static httpError(status: number): InseeApiUnavailableException {
    return new InseeApiUnavailableException(
      `Le service INSEE est temporairement indisponible (HTTP ${status}).`,
    );
  }

  static parseError(): InseeApiUnavailableException {
    return new InseeApiUnavailableException(
      'Le service INSEE a renvoyé une réponse invalide.',
    );
  }
}
