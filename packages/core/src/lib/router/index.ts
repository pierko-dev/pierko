import { join } from 'node:path';

import { Hono } from 'hono';
import { Resolver as TypeGraphqlResolver } from 'type-graphql';

import { resolverRegistry } from '../resolver/index.ts';

import { loadResolvers } from './load-resolvers.ts';
import { createRoutes } from './routes.ts';

export type PierkoGraphQlOptions = {
  enabled?: boolean;
};

export type PierkoRouterOptions = {
  graphql?: PierkoGraphQlOptions | false;
  resolversDir?: string;
};

export type NormalizedRouterOptions = Required<Omit<PierkoRouterOptions, 'graphql'>> & {
  graphql: PierkoGraphQlOptions;
};

const DEFAULT_GRAPHQL_OPTIONS = {
  enabled: true,
};

const normalizeRouterOptions = (options: PierkoRouterOptions) => {
  const optionsWithDefaults = Object.assign(
    { graphql: DEFAULT_GRAPHQL_OPTIONS, resolversDir: join(process.cwd(), 'resolvers') },
    options,
  );

  if (optionsWithDefaults.graphql === false) {
    Object.assign(optionsWithDefaults, { graphql: { enabled: false } });
  }

  return optionsWithDefaults;
};

normalizeRouterOptions({ graphql: false });

export const initializeRouter = async (options: PierkoRouterOptions) => {
  const normalizedOptions = normalizeRouterOptions(options);

  const { graphql, resolversDir } = normalizedOptions;

  const Resolvers = await loadResolvers(resolversDir);

  resolverRegistry.register(Resolvers);

  const app = new Hono();

  for (const Resolver of Resolvers) {
    if (graphql.enabled) {
      TypeGraphqlResolver()(Resolver);
    }

    const routes = await createRoutes(normalizedOptions, Resolver);

    if (!routes) {
      continue;
    }

    app.route(Resolver.routePath, routes);
  }

  // TODO: Start Yoga
  // if (graphql.enabled) {
  //   app.post('/graphql')
  // }

  return app;
};
