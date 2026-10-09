import { GraphQLError } from 'graphql';
import { fromGlobalId as fromRelayId, toGlobalId as toRelayId } from 'graphql-relay';

export const fromGlobalId = (globalId: string) => {
  const { id, type } = fromRelayId(globalId);

  if (id === '' || type === '') {
    throw new GraphQLError('Invalid ID provided');
  }

  return { id, type };
};

export const toGlobalId = (type: string, id: string) => {
  if (id === '') {
    throw new GraphQLError('Missing ID to encode');
  }

  if (type === '') {
    throw new GraphQLError('Missing entity type to encode');
  }

  return toRelayId(type, id);
};
