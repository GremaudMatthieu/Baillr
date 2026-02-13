const FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function formatEuroCents(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100);
}

export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const label = FRENCH_MONTHS[monthNum - 1];
  if (!label || isNaN(year)) {
    return month;
  }
  return `${label} ${year}`;
}
