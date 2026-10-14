import { Context as HonoContext } from 'hono';
import { ParamKeys } from 'hono/types';

import { actionRegistry } from './action-registry.ts';
import { PierkoResolver } from './resolver.ts';

type CriticalActionOptions<Path extends string> = { operation?: OperationType; method?: HttpMethod; path?: Path };
type OptionalActionOptions<ReturnType extends ActionReturnType, Path extends string> = {
  deprecationReason?: string;
  nullable?: boolean;
  defaultValue?: ReturnType;
  schemaName?: string;
  body?: Record<string, unknown>;
  // TODO: default behavior without defining parameters (like sorting, pagination etc.)
  parameters?: {
    path?: Record<ParamKeys<Path>, (value: unknown) => string | number>;
    query?: Record<string, (value: unknown) => string | number | boolean | Date | [string] | [number] | [boolean] | [Date]>;
  };
};

export type ActionOptions<ReturnType extends ActionReturnType, Path extends string> = CriticalActionOptions<Path> &
  OptionalActionOptions<ReturnType, Path>;

export type NormalizedActionOptions<ReturnType extends ActionReturnType, Path extends string> = Required<
  CriticalActionOptions<Path>
> &
  OptionalActionOptions<ReturnType, Path> & { name: string };

type ActionContext<Path extends string> = {
  args: any; // TODO: map properly
  raw: HonoContext<any, Path>;
};

export type ActionSignature<ReturnType extends ActionReturnType = ActionReturnType, Path extends string = string> = (
  context?: ActionContext<Path>,
) => Awaitable<ExtractReturnType<ReturnType>>;

const DEFAULT_ROUTE_METHODS = { create: 'POST', edit: 'PATCH', update: 'PATCH', delete: 'DELETE' } as const;

const QUERY_KEYWORDS = ['get', 'find', 'list'];
const MUTATION_KEYWORDS = Object.keys(DEFAULT_ROUTE_METHODS) as Array<keyof typeof DEFAULT_ROUTE_METHODS>;
const MUTATION_METHODS = Object.values(DEFAULT_ROUTE_METHODS) as Array<HttpMethod>;

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
const inferActionPath = <Path extends string>(actionName: string) => {
  if (QUERY_KEYWORDS.some((keyword) => actionName.startsWith(`${keyword}One`))) {
    return `/:id` as Path;
  }

  return '/' as Path;
};

const resolveActionOptions = <ReturnType extends ActionReturnType, Path extends string>(
  resolver: PierkoResolver,
  actionName: string | symbol,
  {
    method: providedMethod,
    operation: providedOperation,
    path: providedPath,
    ...options
  }: ActionOptions<ReturnType, Path> = {},
): NormalizedActionOptions<ReturnType, Path> => {
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

export function Action<ReturnType extends ActionReturnType, Path extends string>(
  returnType: () => ReturnType,
  options?: ActionOptions<ReturnType, Path>,
) {
  return <MethodType extends ActionSignature<ReturnType, Path>>(
    // oxlint-disable-next-line typescript/no-explicit-any
    target: any,
    actionName: string | symbol,
    // oxlint-disable-next-line no-unused-vars
    _descriptor: TypedPropertyDescriptor<MethodType>,
  ) => {
    const resolver = target.constructor as PierkoResolver;

    const { body, parameters, operation, ...normalizedOptions } = resolveActionOptions(resolver, actionName, options);

    actionRegistry.register(resolver.name, {
      operation,
      parameters: { body, ...parameters },
      returnType,
      ...normalizedOptions,
    });
  };
}
