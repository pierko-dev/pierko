import { Query } from 'type-graphql';

declare global {
  type OperationType = 'query' | 'mutation';

  type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT' | 'QUERY';

  type ActionReturnType = ReturnType<Parameters<typeof Query>[0]>;

  type ExtractReturnType<T, Depth extends Array<1> = []> = Depth['length'] extends 3
    ? any
    : T extends typeof Date
      ? Date
      : T extends Array<infer U>
        ? Array<ExtractReturnType<U, [...Depth, 1]>>
        : T extends (...args: Array<any>) => infer R
          ? R
          : T extends abstract new (...args: Array<any>) => infer I
            ? I
            : T;

  type Awaitable<T> = Promise<T> | T;
}
