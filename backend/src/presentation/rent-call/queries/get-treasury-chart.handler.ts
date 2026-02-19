import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetTreasuryChartQuery } from './get-treasury-chart.query.js';
import {
  TreasuryChartFinder,
  type TreasuryMonthData,
} from '../finders/treasury-chart.finder.js';

@QueryHandler(GetTreasuryChartQuery)
export class GetTreasuryChartHandler
  implements IQueryHandler<GetTreasuryChartQuery>
{
  constructor(private readonly treasuryChartFinder: TreasuryChartFinder) {}

  async execute(query: GetTreasuryChartQuery): Promise<TreasuryMonthData[]> {
    return this.treasuryChartFinder.getChartData(
      query.entityId,
      query.userId,
      query.months,
    );
  }
}
