import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAlertPreferencesQuery } from './get-alert-preferences.query.js';
import { AlertPreferenceFinder } from '../finders/alert-preference.finder.js';
import { ALERT_TYPES } from '../alert-type.enum.js';

export interface AlertPreferenceResult {
  id: string | null;
  entityId: string;
  userId: string;
  alertType: string;
  enabled: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@QueryHandler(GetAlertPreferencesQuery)
export class GetAlertPreferencesHandler
  implements IQueryHandler<GetAlertPreferencesQuery>
{
  constructor(
    private readonly alertPreferenceFinder: AlertPreferenceFinder,
  ) {}

  async execute(
    query: GetAlertPreferencesQuery,
  ): Promise<AlertPreferenceResult[]> {
    const preferences =
      await this.alertPreferenceFinder.findAllByEntityAndUser(
        query.entityId,
        query.userId,
      );

    const existingTypes = new Set(preferences.map((p) => p.alertType));
    const defaults = ALERT_TYPES.filter((t) => !existingTypes.has(t)).map(
      (alertType) => ({
        id: null,
        entityId: query.entityId,
        userId: query.userId,
        alertType,
        enabled: true,
        createdAt: null,
        updatedAt: null,
      }),
    );

    return [...preferences, ...defaults];
  }
}
