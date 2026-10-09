import { camelCase, kebabCase } from 'change-case';
import { ClassType } from 'type-graphql';

import { db } from '../database.ts';
import { pipe } from '../utils/index.ts';

const PIERKO_RESOLVER = Symbol('pierko:resolver');

export class BaseResolver {
  static [PIERKO_RESOLVER] = true;

  static get entityName() {
    return camelCase(this.name.replace(/Resolver$/, ''));
  }

  static get routeSegment() {
    return kebabCase(this.entityName);
  }

  static get routePath() {
    return `/${this.routeSegment}`;
  }

  static get repository() {
    return db.getRepository(this.entityName);
  }

  static get db() {
    return db;
  }
}

export type BaseResolverType = ClassType<BaseResolver, ConstructorParameters<typeof BaseResolver>>;

type PierkoResolverTrait<T = Record<string, unknown>> = <
  B extends ClassType<BaseResolver, ConstructorParameters<typeof BaseResolver>>,
>(
  base: B,
) => B & ClassType<InstanceType<B> & T, ConstructorParameters<typeof BaseResolver>>;

export const Resolver = <T extends Array<PierkoResolverTrait>>(...traits: T) => pipe(BaseResolver, ...traits);

export type PierkoResolver = typeof BaseResolver;

export const isPierkoResolver = (Class: unknown): Class is PierkoResolver =>
  typeof Class === 'function' && PIERKO_RESOLVER in Class && Class[PIERKO_RESOLVER] === true;
