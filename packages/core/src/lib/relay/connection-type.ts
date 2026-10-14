import {
  connectionFromArray as relayConnectionFromArray,
  type Connection as RelayConnection,
  type Edge as RelayEdge,
} from 'graphql-relay';
import { type ClassType, Field, InterfaceType } from 'type-graphql';

import { ConnectionArgs } from './connection-args.ts';
import { PageInfo } from './page-info.ts';

type ExtractNodeType<EdgeType> = EdgeType extends RelayEdge<infer NodeType> ? NodeType : never;

export function ConnectionType<EdgeType extends RelayEdge<NodeType>, NodeType = ExtractNodeType<EdgeType>>(
  nodeName: string,
  edgeClass: ClassType<EdgeType>,
) {
  @InterfaceType(`${nodeName}Connection`)
  abstract class Connection implements RelayConnection<NodeType> {
    @Field(() => PageInfo)
    pageInfo!: PageInfo;

    @Field(() => [edgeClass])
    edges!: EdgeType[];

    @Field()
    totalCount!: number;
  }

  return Connection;
}

export const connectionFromPromisedArray = async (
  response: Promise<[ReadonlyArray<unknown>, number]>,
  args: ConnectionArgs,
) => {
  const [nodes, totalCount] = await response;

  return { ...relayConnectionFromArray(nodes, args), totalCount };
};

export const connectionFromArray = async (
  [response, totalCount]: [ReadonlyArray<unknown>, number],
  args: ConnectionArgs,
) => ({
  ...relayConnectionFromArray(response, args),
  totalCount,
});
