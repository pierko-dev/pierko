import { HttpMethod, OperationType, PathParameterType, QueryParameterType } from '../types.ts';

import { PierkoResolver } from './resolver.ts';

type ActionMetadata = {
  operation: OperationType;
  method: HttpMethod;
  path: string;
  parameters?: {
    path?: Record<string, PathParameterType>;
    query?: Record<string, QueryParameterType>;
    body?: Record<string, unknown>;
  };
  returnType: () => any;
};

export class ActionRegistry {
  #registry = new Map<string, Map<string, ActionMetadata>>();

  register(resolver: PierkoResolver, { name, ...action }: ActionMetadata & { name: string }) {
    const resolverActions = this.#registry.get(resolver.entityName) ?? new Map<string, ActionMetadata>();

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
    return this.#registry.get(resolver.entityName) ?? new Map<string, ActionMetadata>();
  }
}

export const actionRegistry = new ActionRegistry();
