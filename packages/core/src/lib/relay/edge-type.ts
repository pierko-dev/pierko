import type { ConnectionCursor, Edge as RelayEdge } from 'graphql-relay';
import { type ClassType, Field, InterfaceType } from 'type-graphql';

export function EdgeType<NodeType extends object>(nodeName: string, nodeType: ClassType<NodeType>) {
  @InterfaceType(`${nodeName}Edge`)
  abstract class Edge implements RelayEdge<NodeType> {
    @Field(() => nodeType)
    node!: NodeType;

    @Field(() => String, { description: 'Used in `before` and `after` args' })
    cursor!: ConnectionCursor;
  }

  return Edge;
}
