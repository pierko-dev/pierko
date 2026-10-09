import { PierkoResolver } from './resolver.ts';

export class ResolverRegistry {
  #resolvers = new Map<string, InstanceType<PierkoResolver>>();

  register(Classes: Array<PierkoResolver>) {
    const resolvers = new Map<string, InstanceType<PierkoResolver>>();

    for (const Resolver of Classes) {
      const { entityName } = Resolver;

      if (resolvers.has(entityName)) {
        throw new Error(`Duplicate resolver name "${entityName}" (from ${Resolver.name}), resolver names must be unique.`);
      }

      resolvers.set(entityName, new Resolver());
    }

    this.#resolvers = resolvers;
  }

  get(name: string) {
    const resolver = this.#resolvers.get(name);

    if (!resolver) {
      throw new Error(`No resolver "${name}" registered. Known: ${[...this.#resolvers.keys()].join(', ') || '(none)'}`);
    }

    return resolver;
  }

  has(name: string) {
    return this.#resolvers.has(name);
  }

  clear() {
    this.#resolvers.clear();
  }
}

export const resolverRegistry = new ResolverRegistry();
