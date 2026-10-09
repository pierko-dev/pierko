import { join } from 'node:path';

import { ClassType, ObjectType } from 'type-graphql';
import { DataSource, DataSourceOptions, Entity as TypeOrmEntity } from 'typeorm';

import { isPierkoEntity } from './entity/index.ts';
import { ConnectionType, EdgeType } from './relay/index.ts';
import { importFolder } from './utils/index.ts';

export type PierkoDatabaseOptions = {
  entitiesDir?: string;
  mainSource: DataSourceOptions;
  additionalSources?: Array<DataSourceOptions & { name: string }>;
};

type Db = DataSource & Readonly<Record<string, DataSource>>;

export const db = {} as Db;

const loadEntities = async (dir: string, ignore: Array<string> = []) => {
  const modules = await importFolder(dir, ignore);

  const entities = modules.flatMap((module) => Object.values(module).filter(isPierkoEntity));

  for (const Entity of entities) {
    TypeOrmEntity()(Entity);
    ObjectType()(Entity);

    @ObjectType(`${Entity.name}Edge`)
    class Edge extends EdgeType(Entity.name, Entity) {}

    @ObjectType(`${Entity.name}Connection`)
    class Connection extends ConnectionType(Entity.name, Edge) {}

    (Entity as unknown as { Connection: ClassType }).Connection = Connection;
  }

  return entities;
};

const createDataSources = async ({ entitiesDir, mainSource, additionalSources }: PierkoDatabaseOptions) => {
  const rootDir = entitiesDir ?? join(process.cwd(), 'entities');

  const main = new DataSource({
    entities: await loadEntities(
      rootDir,
      additionalSources?.map(({ name }) => `${name}/**`),
    ),
    ...mainSource,
  });

  if (additionalSources) {
    const additional = await additionalSources.reduce<Promise<Record<string, DataSource>>>(
      async (acc, { name, ...source }) => ({
        ...(await acc),
        [name]: new DataSource({ entities: await loadEntities(join(rootDir, name)), ...source }),
      }),
      Promise.resolve({}),
    );

    return { main, additional };
  }

  return { main };
};

export const initializeDatabase = async (options: PierkoDatabaseOptions) => {
  const { main, additional } = await createDataSources(options);

  await main.initialize();

  Object.setPrototypeOf(db, Object.getPrototypeOf(main));
  Object.assign(db, main);

  if (additional) {
    await Promise.all(Object.values(additional).map((connection) => connection.initialize()));

    Object.assign(db, { sources: additional });
  }
};
