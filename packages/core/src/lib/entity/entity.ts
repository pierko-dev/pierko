import { ClassType } from 'type-graphql';
import { BaseEntity as TypeOrmBaseEntity, PrimaryGeneratedColumn } from 'typeorm';

import { Node } from '../relay/index.ts';
import { pipe } from '../utils/index.ts';

const PIERKO_ENTITY = Symbol('pierko:entity');

class BaseEntity extends TypeOrmBaseEntity implements Node {
  static [PIERKO_ENTITY] = true;

  constructor(props?: Partial<BaseEntity>) {
    super();

    if (props) {
      Object.assign(this, props);
    }
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;
}

export type BaseEntityType = ClassType<BaseEntity, ConstructorParameters<typeof BaseEntity>>;

type PierkoEntityTrait<T = Record<string, unknown>> = <
  B extends ClassType<BaseEntity, ConstructorParameters<typeof BaseEntity>>,
>(
  base: B,
) => B & ClassType<InstanceType<B> & T, ConstructorParameters<typeof BaseEntity>>;

type WithConnection<B extends typeof BaseEntity> = B & { Connection: ClassType };

const exposeConnection = <B extends typeof BaseEntity>(base: B) =>
  Object.assign(base, { Connection: undefined as unknown as ClassType });

export const Entity = <T extends Array<PierkoEntityTrait>>(...traits: T) => exposeConnection(pipe(BaseEntity, ...traits));

export type PierkoEntity = WithConnection<typeof BaseEntity>;

export const isPierkoEntity = (Class: unknown): Class is PierkoEntity =>
  typeof Class === 'function' && PIERKO_ENTITY in Class && Class[PIERKO_ENTITY] === true;
