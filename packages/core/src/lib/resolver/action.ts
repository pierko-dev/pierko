import { ParamKeys } from 'hono/types';
import { Mutation, Query } from 'type-graphql';

import { HttpMethod, OperationType, PathParameterType, QueryParameterType } from '../types.ts';

import { actionRegistry } from './action-registry.ts';
import { PierkoResolver } from './resolver.ts';

type CriticalActionOptions<Path extends string> = { operation?: OperationType; method?: HttpMethod; path?: Path };
type OptionalActionOptions<Path extends string> = {
  body?: Record<string, unknown>;
  parameters?: {
    path?: Record<ParamKeys<Path>, PathParameterType>;
    query?: Record<string, QueryParameterType>;
  };
};

export type ActionOptions<Path extends string = string> = CriticalActionOptions<Path> & OptionalActionOptions<Path>;

export type NormalizedActionOptions<Path extends string = string> = Required<CriticalActionOptions<Path>> &
  OptionalActionOptions<Path> & { name: string };

const DEFAULT_ROUTE_METHODS = { create: 'POST', edit: 'PATCH', update: 'PATCH', delete: 'DELETE' } as const;

const MUTATION_KEYWORDS = Object.keys(DEFAULT_ROUTE_METHODS);
const QUERY_KEYWORDS = ['get', 'find', 'list'];

const GRAPHQL_OPERATION_DECORATORS = {
  query: Query,
  mutation: Mutation,
};

const isQuery = ({ entityName }: PierkoResolver, methodName: string) =>
  methodName === `${entityName}s` || QUERY_KEYWORDS.some((keyword) => methodName.startsWith(keyword));

const inferActionMethod = (resolver: PierkoResolver, methodName: string, hasBody = false) => {
  const defaultMethodMatch = Object.keys(DEFAULT_ROUTE_METHODS).find(methodName.startsWith) as
    | keyof typeof DEFAULT_ROUTE_METHODS
    | undefined;

  if (defaultMethodMatch) {
    return DEFAULT_ROUTE_METHODS[defaultMethodMatch];
  }

  if (isQuery(resolver, methodName)) {
    return hasBody ? 'QUERY' : 'GET';
  }

  return;
};

const inferActionOperation = (resolver: PierkoResolver, methodName: string) => {
  if (isQuery(resolver, methodName)) {
    return 'query';
  }

  if (MUTATION_KEYWORDS.some((keyword) => methodName.startsWith(keyword))) {
    return 'mutation';
  }

  return;
};

const inferActionPath = (methodName: string) => {
  if (QUERY_KEYWORDS.some((keyword) => methodName.startsWith(`${keyword}One`))) {
    return `/:id`;
  }

  return '/';
};

const resolveActionOptions = (
  resolver: PierkoResolver,
  methodName: string | symbol,
  options?: ActionOptions,
): NormalizedActionOptions => {
  if (typeof methodName !== 'string') {
    throw new Error(`Action name must be a string, got ${String(methodName)}`);
  }

  const method = inferActionMethod(resolver, methodName, typeof options?.body !== 'undefined') ?? options?.method;
  const operation = inferActionOperation(resolver, methodName) ?? options?.operation;
  const path = inferActionPath(methodName) ?? options?.path;

  if (!method) {
    throw new Error(
      `Could not infer action method for ${resolver.name}.${String(methodName)}, please specify it explicitly.`,
    );
  }

  if (!operation) {
    throw new Error(
      `Could not infer action operation for ${resolver.name}.${String(methodName)}, please specify it explicitly.`,
    );
  }

  if (!path) {
    throw new Error(`Could not infer action path for ${resolver.name}.${String(methodName)}, please specify it explicitly.`);
  }

  return {
    name: methodName,
    method,
    operation,
    path,
    body: options?.body,
    parameters: options?.parameters,
  };
};

export function Action(returnType: () => any, options?: ActionOptions) {
  // TODO: enforce action method shape using TypedPropertyDescriptor w/ generics
  return (resolver: PierkoResolver, methodName: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const { body, parameters, operation, ...normalizedOptions } = resolveActionOptions(resolver, methodName, options);

    // TODO: GQL decorator options
    GRAPHQL_OPERATION_DECORATORS[operation](returnType, {})(resolver, methodName, descriptor);

    const metadata = { operation, parameters: { body, ...parameters }, returnType, ...normalizedOptions };

    actionRegistry.register(resolver, metadata);
  };
}
