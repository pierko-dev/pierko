import { Hono } from 'hono';

import { actionRegistry } from '../resolver/action-registry.ts';
import { resolverRegistry } from '../resolver/index.ts';
import { PierkoResolver } from '../resolver/resolver.ts';

import { NormalizedRouterOptions } from './index.ts';

export const createRoutes = (_opts: NormalizedRouterOptions, Resolver: PierkoResolver) => {
  const resolver = resolverRegistry.get(Resolver.entityName);

  const resolverRoute = new Hono();

  for (const [name, action] of actionRegistry.getActions(Resolver)) {
    if (!(name in resolver)) {
      continue;
    }

    // oxlint-disable-next-line typescript/no-explicit-any
    const fn = resolver[name as keyof typeof resolver] as any;

    resolverRoute.on(action.method, action.path, (context) => {
      // TODO: transform context to match the action signature
      return fn(context);
    });
  }

  return resolverRoute;
};
