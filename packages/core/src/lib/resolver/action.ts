import { Context as HonoContext } from 'hono';
import { ParamKeys } from 'hono/types';
import { Mutation, Query } from 'type-graphql';

import { HttpMethod, OperationType, PathParameterType, QueryParameterType } from '../types.ts';

import { actionRegistry } from './action-registry.ts';
import { PierkoResolver } from './resolver.ts';

type CriticalActionOptions<Path extends string> = { operation?: OperationType; method?: HttpMethod; path?: Path };
type OptionalActionOptions<ReturnType, Path extends string> = {
  deprecationReason?: string;
  nullable?: boolean;
  defaultValue?: ReturnType;
  schemaName?: string;
  body?: Record<string, unknown>;
  // TODO: default behavior without defining parameters (like sorting, pagination etc.)
  parameters?: {
    path?: Record<ParamKeys<Path>, PathParameterType>;
    query?: Record<string, QueryParameterType>;
  };
};

export type ActionOptions<ReturnType, Path extends string = string> = CriticalActionOptions<Path> &
  OptionalActionOptions<ReturnType, Path>;

export type NormalizedActionOptions<ReturnType, Path extends string = string> = Required<CriticalActionOptions<Path>> &
  OptionalActionOptions<ReturnType, Path> & { name: string };

type ActionContext<Path extends string> = {
  args: any; // TODO: map properly
  raw: HonoContext<never, Path>;
};

type ActionSignature<ReturnType, Path extends string> = (context: ActionContext<Path>) => ReturnType;

const DEFAULT_ROUTE_METHODS = { create: 'POST', edit: 'PATCH', update: 'PATCH', delete: 'DELETE' } as const;

const QUERY_KEYWORDS = ['get', 'find', 'list'];
const MUTATION_KEYWORDS = Object.keys(DEFAULT_ROUTE_METHODS) as Array<keyof typeof DEFAULT_ROUTE_METHODS>;
const MUTATION_METHODS = Object.values(DEFAULT_ROUTE_METHODS) as Array<HttpMethod>;

const GRAPHQL_OPERATION_DECORATORS = {
  query: Query,
  mutation: Mutation,
};

const isQuery = ({ entityName }: PierkoResolver, methodName: string) =>
  methodName === `${entityName}s` || QUERY_KEYWORDS.some((keyword) => methodName.startsWith(keyword));

const inferActionMethod = (resolver: PierkoResolver, actionName: string, hasBody: boolean, operation?: OperationType) => {
  const defaultMethodMatch = MUTATION_KEYWORDS.find(actionName.startsWith);

  if (defaultMethodMatch) {
    return DEFAULT_ROUTE_METHODS[defaultMethodMatch];
  }

  if (operation === 'query' || isQuery(resolver, actionName)) {
    return hasBody ? 'QUERY' : 'GET';
  }

  if (operation === 'mutation') {
    return 'POST';
  }

  return;
};

const inferActionOperation = (resolver: PierkoResolver, actionName: string, method?: HttpMethod) => {
  if (method === 'GET' || method === 'QUERY' || isQuery(resolver, actionName)) {
    return 'query';
  }

  if ((method && MUTATION_METHODS.includes(method)) || MUTATION_KEYWORDS.some((keyword) => actionName.startsWith(keyword))) {
    return 'mutation';
  }

  return;
};

// TODO: think of other possibilities
const inferActionPath = (actionName: string) => {
  if (QUERY_KEYWORDS.some((keyword) => actionName.startsWith(`${keyword}One`))) {
    return `/:id`;
  }

  return '/';
};

const resolveActionOptions = <ReturnType>(
  resolver: PierkoResolver,
  actionName: string | symbol,
  { method: providedMethod, operation: providedOperation, path: providedPath, ...options }: ActionOptions<ReturnType> = {},
): NormalizedActionOptions<ReturnType> => {
  if (typeof actionName !== 'string') {
    throw new Error(`Action name must be a string, got ${String(actionName)}`);
  }

  const method = providedMethod ?? inferActionMethod(resolver, actionName, Boolean(options?.body), providedOperation);
  const operation = providedOperation ?? inferActionOperation(resolver, actionName, providedMethod);
  const path = providedPath ?? inferActionPath(actionName);

  if (!method) {
    throw new Error(`Could not infer action method for ${resolver.name}.${actionName}, please specify it explicitly.`);
  }

  if (!operation) {
    throw new Error(`Could not infer action operation for ${resolver.name}.${actionName}, please specify it explicitly.`);
  }

  if (!path) {
    throw new Error(`Could not infer action path for ${resolver.name}.${actionName}, please specify it explicitly.`);
  }

  return {
    name: actionName,
    method,
    operation,
    path,
    ...options,
  };
};

type ActionReturnType = ReturnType<Parameters<typeof Query>[0]>;

export function Action<ReturnType extends ActionReturnType, Path extends string>(
  returnType: () => ReturnType,
  options?: ActionOptions<ReturnType, Path>,
) {
  return (
    resolver: PierkoResolver,
    actionName: string | symbol,
    descriptor: TypedPropertyDescriptor<ActionSignature<ReturnType, Path>>,
  ) => {
    const { body, parameters, operation, ...normalizedOptions } = resolveActionOptions(resolver, actionName, options);

    const { deprecationReason, nullable, defaultValue, schemaName } = normalizedOptions;
    const gqlOptions = { deprecationReason, nullable, defaultValue, name: schemaName };

    GRAPHQL_OPERATION_DECORATORS[operation](returnType, gqlOptions)(resolver, actionName, descriptor);
    // TODO: map parameters to GQL args - call @Arg()

    actionRegistry.register(resolver, { operation, parameters: { body, ...parameters }, returnType, ...normalizedOptions });
  };
}
