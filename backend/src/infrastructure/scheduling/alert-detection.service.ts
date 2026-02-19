import { Injectable } from '@nestjs/common';
import type { AlertItem } from '../email/templates/alert-email.template.js';
import { formatEuroCents } from '../document/format-euro.util.js';
import { RentCallFinder } from '../../presentation/rent-call/finders/rent-call.finder.js';
import { TenantFinder } from '../../presentation/tenant/finders/tenant.finder.js';
import { EscalationFinder } from '../../presentation/escalation/finders/escalation.finder.js';

export interface DetectedAlert {
  alertItem: AlertItem;
  referenceId: string;
}

@Injectable()
export class AlertDetectionService {
  constructor(
    private readonly rentCallFinder: RentCallFinder,
    private readonly tenantFinder: TenantFinder,
    private readonly escalationFinder: EscalationFinder,
  ) {}

  async detectUnpaidAlerts(
    entityId: string,
    userId: string,
    appUrl: string,
  ): Promise<DetectedAlert[]> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const unpaidRentCalls = await this.rentCallFinder.findUnpaidBeforeMonth(
      entityId,
      currentMonth,
    );

    return unpaidRentCalls.map((rc) => {
      const tenantName =
        rc.tenant.type === 'company' && rc.tenant.companyName
          ? rc.tenant.companyName
          : `${rc.tenant.firstName} ${rc.tenant.lastName}`;
      const amount = formatEuroCents(rc.totalAmountCents);

      return {
        referenceId: rc.id,
        alertItem: {
          description: `Loyer impayé — ${tenantName} — ${rc.unit.identifier} — ${amount} — ${rc.month}`,
          suggestedAction:
            'Consultez le détail du loyer et envoyez un rappel',
          applicationLink: `${appUrl}/rent-calls`,
        },
      };
    });
  }

  async detectInsuranceAlerts(
    entityId: string,
    userId: string,
    appUrl: string,
  ): Promise<DetectedAlert[]> {
    const now = new Date();
    const fifteenDaysFromNow = new Date(
      now.getTime() + 15 * 24 * 60 * 60 * 1000,
    );
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const tenants = await this.tenantFinder.findWithExpiringInsurance(
      entityId,
      fifteenDaysFromNow,
    );

    return tenants.map((tenant) => {
      const renewalDate = tenant.renewalDate!;
      const isExpired = renewalDate < now;
      const dateStr = renewalDate.toLocaleDateString('fr-FR');
      const fullName =
        tenant.type === 'company' && tenant.companyName
          ? tenant.companyName
          : `${tenant.firstName} ${tenant.lastName}`;

      return {
        referenceId: `${tenant.id}-${monthKey}`,
        alertItem: {
          description: isExpired
            ? `Assurance expirée — ${fullName} — expirée depuis le ${dateStr}`
            : `Assurance expirante — ${fullName} — expire le ${dateStr}`,
          suggestedAction:
            'Contactez le locataire pour renouveler son assurance',
          applicationLink: `${appUrl}/tenants/${tenant.id}`,
        },
      };
    });
  }

  async detectEscalationAlerts(
    entityId: string,
    userId: string,
    appUrl: string,
  ): Promise<DetectedAlert[]> {
    const escalations = await this.escalationFinder.findAllByEntity(
      entityId,
      userId,
    );

    if (escalations.length === 0) return [];

    const rentCallIds = escalations.map((e) => e.rentCallId);
    const unpaidRentCalls = await this.rentCallFinder.findUnpaidByIds(
      rentCallIds,
    );

    const unpaidRentCallMap = new Map(
      unpaidRentCalls.map((rc) => [rc.id, rc]),
    );

    const alerts: DetectedAlert[] = [];

    for (const escalation of escalations) {
      const rentCall = unpaidRentCallMap.get(escalation.rentCallId);
      if (!rentCall) continue;

      const tenantName =
        rentCall.tenant.type === 'company' && rentCall.tenant.companyName
          ? rentCall.tenant.companyName
          : `${rentCall.tenant.firstName} ${rentCall.tenant.lastName}`;

      let currentTier = 1;
      if (escalation.tier3SentAt) currentTier = 3;
      else if (escalation.tier2SentAt) currentTier = 2;

      const amount = formatEuroCents(rentCall.totalAmountCents);

      alerts.push({
        referenceId: `${rentCall.id}-tier${currentTier}`,
        alertItem: {
          description: `Seuil d'escalade atteint — ${tenantName} — ${amount} — Niveau ${currentTier} envoyé sans paiement`,
          suggestedAction:
            'Passez au niveau suivant de la procédure de recouvrement',
          applicationLink: `${appUrl}/rent-calls`,
        },
      });
    }

    return alerts;
  }
}
