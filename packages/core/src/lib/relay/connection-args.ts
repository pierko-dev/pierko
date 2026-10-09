import type { ConnectionArguments, ConnectionCursor } from 'graphql-relay';

import { ArgsType, Field } from 'type-graphql';

@ArgsType()
export class ConnectionArgs implements ConnectionArguments {
  @Field(() => String, {
    nullable: true,
    description: 'Paginate before opaque cursor',
  })
  before?: ConnectionCursor;

  @Field(() => String, {
    nullable: true,
    description: 'Paginate after opaque cursor',
  })
  after?: ConnectionCursor;

  @Field(() => Number, { nullable: true, description: 'Paginate first' })
  first?: number;

  @Field(() => Number, { nullable: true, description: 'Paginate last' })
  last?: number;
}
