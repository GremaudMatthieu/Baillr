import { DomainException } from '@shared/exceptions/domain.exception.js';

export class RevisionNotCalculatedException extends DomainException {
  private constructor() {
    super(
      'Revision has not been calculated yet',
      'REVISION_NOT_CALCULATED',
      400,
    );
  }

  static create(): RevisionNotCalculatedException {
    return new RevisionNotCalculatedException();
  }
}
