export type OperationType = 'query' | 'mutation';

export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT' | 'QUERY';

type BaseParameterType = 'string' | 'number' | 'boolean' | 'datetime';

export type PathParameterType = 'string' | 'number';

export type QueryParameterType = BaseParameterType | `${BaseParameterType}[]`;
