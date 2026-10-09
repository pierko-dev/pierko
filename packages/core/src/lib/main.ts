import { initializeDatabase, PierkoDatabaseOptions } from './database.ts';
import { initializeRouter, PierkoRouterOptions } from './router/index.ts';

export type PierkoOptions = {
  db: PierkoDatabaseOptions;
  router: PierkoRouterOptions;
};

export const pierko = async (config: PierkoOptions) => {
  await initializeDatabase(config.db);

  await initializeRouter(config.router);
};
