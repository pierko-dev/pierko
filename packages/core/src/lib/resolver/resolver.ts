import { camelCase, kebabCase } from 'change-case';
import type { ClassType } from 'type-graphql';

import { db } from '../database.ts';
import { PierkoEntity } from '../entity/index.ts';
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

  get repository() {
    return db.getRepository((this.constructor as PierkoResolver).entityName);
  }

  get db() {
    return db;
  }

  getAction<T extends (...args: Array<any>) => any>(name: string): T {
    if (!(name in this)) {
      throw new Error(`Action ${name} not found in resolver ${this.constructor.name}`);
    }

    const action = (this as unknown as Record<string, unknown>)[name];

    if (typeof action !== 'function') {
      throw new Error(`Member ${name} of resolver ${this.constructor.name} is not a function`);
    }

    return action.bind(this) as T;
  }
}

export type PierkoResolverTrait<T = Record<string, unknown>> = <B extends typeof BaseResolver>(
  base: B,
) => B & ClassType<InstanceType<B> & T>;

export const Resolver = Object.assign(
  <T extends Array<PierkoResolverTrait>>(...traits: T) => pipe(BaseResolver, ...traits),
  {
    For: <E extends PierkoEntity, T extends Array<PierkoResolverTrait>>(entity: E, ...traits: T) => {
      class EntityResolver extends BaseResolver {
        static override get entityName() {
          return camelCase(entity.name);
        }
      }

      Object.defineProperty(EntityResolver, 'name', { value: `${entity.name}Resolver` });

      return pipe(EntityResolver, ...traits);
    },
  },
);

export type PierkoResolver = typeof BaseResolver;

export const isPierkoResolver = (Class: unknown): Class is PierkoResolver =>
  typeof Class === 'function' && PIERKO_RESOLVER in Class && Class[PIERKO_RESOLVER] === true;
