import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDashboardKpisQuery } from './get-dashboard-kpis.query.js';
import {
  DashboardKpisFinder,
  type DashboardKpisResult,
} from '../finders/dashboard-kpis.finder.js';

@QueryHandler(GetDashboardKpisQuery)
export class GetDashboardKpisHandler
  implements IQueryHandler<GetDashboardKpisQuery>
{
  constructor(private readonly dashboardKpisFinder: DashboardKpisFinder) {}

  async execute(query: GetDashboardKpisQuery): Promise<DashboardKpisResult> {
    return this.dashboardKpisFinder.getKpis(
      query.entityId,
      query.userId,
      query.month,
    );
  }
}
