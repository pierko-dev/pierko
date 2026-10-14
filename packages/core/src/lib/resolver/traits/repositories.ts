import type { ClassType } from 'type-graphql';
import type { Repository } from 'typeorm';

import { db } from '../../database.ts';
import { PierkoEntity } from '../../entity/index.ts';
import { BaseResolver, PierkoResolverTrait } from '../resolver.ts';

export const WithRepositories =
  <const Entities extends ReadonlyArray<PierkoEntity>>(
    entities: Entities,
  ): PierkoResolverTrait<{
    readonly repositories: { readonly [K in keyof Entities]: Repository<InstanceType<Entities[K]>> };
  }> =>
  <Base extends ClassType<BaseResolver>>(BaseClass: Base) => {
    class RepositoriesTrait extends BaseClass {
      get repositories(): {
        readonly [K in keyof Entities]: Repository<InstanceType<Entities[K]>>;
      } {
        // oxlint-disable-next-line typescript/no-explicit-any
        return entities.map((entity) => db.getRepository(entity)) as any;
      }
    }

    // oxlint-disable-next-line typescript/no-explicit-any
    return RepositoriesTrait as any;
  };
