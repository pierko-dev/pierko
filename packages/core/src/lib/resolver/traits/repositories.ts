import { db } from '../../database.ts';
import { PierkoEntity } from '../../entity/index.ts';
import { BaseResolverType } from '../resolver.ts';

export const WithRepositories = (entities: Array<PierkoEntity>) => (BaseClass: BaseResolverType) => {
  class RepositoriesTrait extends BaseClass {
    get repositories() {
      return entities.map((entity) => db.getRepository(entity));
    }
  }

  return RepositoriesTrait;
};
