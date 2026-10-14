import { NormalizedActionOptions } from './action.ts';

type ActionMetadata<ReturnType extends ActionReturnType, Path extends string> = Omit<
  NormalizedActionOptions<ReturnType, Path>,
  'name' | 'parameters'
> & {
  parameters?: NormalizedActionOptions<ReturnType, Path>['parameters'] & {
    body?: Record<string, unknown>;
  };
  returnType: () => ReturnType;
};

export class ActionRegistry {
  #registry = new Map<string, Map<string, ActionMetadata<any, any>>>();

  register<ReturnType extends ActionReturnType, Path extends string>(
    resolverName: string,
    { name, ...action }: ActionMetadata<ReturnType, Path> & { name: string },
  ) {
    const resolverActions = this.#registry.get(resolverName) ?? new Map<string, ActionMetadata<any, any>>();

    resolverActions.set(name, action);

    this.#registry.set(resolverName, resolverActions);
  }

  getActions(resolverName: string) {
    return this.#registry.get(resolverName);
  }
}

export const actionRegistry = new ActionRegistry();
