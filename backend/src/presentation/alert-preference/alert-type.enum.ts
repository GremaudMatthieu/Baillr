export enum AlertType {
  UNPAID_RENT = 'unpaid_rent',
  INSURANCE_EXPIRING = 'insurance_expiring',
  ESCALATION_THRESHOLD = 'escalation_threshold',
}

export const ALERT_TYPES = Object.values(AlertType);
