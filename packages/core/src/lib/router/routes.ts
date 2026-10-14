import { Hono } from 'hono';

import { actionRegistry, ActionSignature, PierkoResolver, resolverRegistry } from '../resolver/index.ts';

import { NormalizedRouterOptions } from './index.ts';

const loadGraphqlDecorators = async (options: NormalizedRouterOptions['graphql']) => {
  if (!options.enabled) {
    return;
  }

  const { Mutation, Query } = await import('type-graphql');

  return {
    mutation: Mutation,
    query: Query,
  };
};

export const createRoutes = async ({ graphql }: NormalizedRouterOptions, Resolver: PierkoResolver) => {
  const resolver = resolverRegistry.get(Resolver.entityName);
  const actions = actionRegistry.getActions(Resolver.name);

  if (!actions) {
    return;
  }

  const resolverRoute = new Hono();

  const Decorators = await loadGraphqlDecorators(graphql);

  for (const [
    name,
    { defaultValue, deprecationReason, method, nullable, operation, path, returnType, schemaName },
  ] of actions) {
    if (graphql.enabled && Decorators) {
      const gqlOptions = { deprecationReason, nullable, defaultValue, name: schemaName };
      const descriptor = Object.getOwnPropertyDescriptor(Resolver.prototype, name);

      if (descriptor) {
        Decorators[operation](returnType, gqlOptions)(Resolver.prototype, name, descriptor);
        // TODO: map parameters to GQL args - call @Arg()
      }
    }

    resolverRoute.on(method, path, async (context) => {
      const action = resolver.getAction<ActionSignature>(name);

      // TODO: transform context to match the action signature
      const response = await action({ args: [], raw: context });

      return context.json(response);
    });
  }

  return resolverRoute;
};
