import { DomainException } from '@shared/exceptions/domain.exception.js';

export class RevisionAlreadyApprovedException extends DomainException {
  private constructor() {
    super(
      'This revision has already been approved',
      'REVISION_ALREADY_APPROVED',
      400,
    );
  }

  static create(): RevisionAlreadyApprovedException {
    return new RevisionAlreadyApprovedException();
  }
}
