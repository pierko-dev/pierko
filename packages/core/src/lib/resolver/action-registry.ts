import { PathParameterType, QueryParameterType } from '../types.ts';

import { NormalizedActionOptions } from './action.ts';
import { PierkoResolver } from './resolver.ts';

type ActionMetadata<ReturnType, Path extends string> = Omit<
  NormalizedActionOptions<ReturnType, Path>,
  'name' | 'parameters'
> & {
  parameters?: {
    path?: Record<string, PathParameterType>;
    query?: Record<string, QueryParameterType>;
    body?: Record<string, unknown>;
  };
  returnType: () => ReturnType;
};

export class ActionRegistry {
  #registry = new Map<string, Map<string, ActionMetadata<any, any>>>();

  register<ReturnType, Path extends string>(
    resolver: PierkoResolver,
    { name, ...action }: ActionMetadata<ReturnType, Path> & { name: string },
  ) {
    const resolverActions = this.#registry.get(resolver.entityName) ?? new Map<string, ActionMetadata<any, any>>();

    if (resolverActions.has(name)) {
      throw new Error(
        `Duplicate action name "${name}" (from ${resolver.name}), names of actions on a single resolver must be unique.`,
      );
    }

    resolverActions.set(name, action);

    this.#registry.set(resolver.entityName, resolverActions);
  }

  getAll() {
    return this.#registry;
  }

  getActions(resolver: PierkoResolver) {
    return this.#registry.get(resolver.entityName);
  }
}

export const actionRegistry = new ActionRegistry();
