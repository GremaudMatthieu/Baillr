import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Property } from '@prisma/client';
import { GetPropertiesQuery } from './get-properties.query.js';
import { PropertyFinder } from '../finders/property.finder.js';

@QueryHandler(GetPropertiesQuery)
export class GetPropertiesHandler implements IQueryHandler<GetPropertiesQuery> {
  constructor(private readonly finder: PropertyFinder) {}

  async execute(query: GetPropertiesQuery): Promise<Property[]> {
    return this.finder.findAllByEntityAndUser(query.entityId, query.userId);
  }
}
