import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import type { Property } from '@prisma/client';
import { GetAPropertyQuery } from './get-a-property.query.js';
import { PropertyFinder } from '../finders/property.finder.js';

@QueryHandler(GetAPropertyQuery)
export class GetAPropertyHandler implements IQueryHandler<GetAPropertyQuery> {
  constructor(private readonly finder: PropertyFinder) {}

  async execute(query: GetAPropertyQuery): Promise<Property> {
    const property = await this.finder.findByIdAndUser(query.id, query.userId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }
}
