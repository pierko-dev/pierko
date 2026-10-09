// oxlint-disable-next-line typescript/no-explicit-any
type Fn = (arg: any) => any;

type PipeResult<Seed, Fns extends ReadonlyArray<Fn>> = Fns extends readonly [
  infer Head extends Fn,
  ...infer Rest extends ReadonlyArray<Fn>,
]
  ? Head extends (arg: Seed) => infer R
    ? PipeResult<R, Rest>
    : never
  : Seed;

export function pipe<Seed, Fns extends ReadonlyArray<Fn>>(seed: Seed, ...fns: Fns) {
  return fns.reduce((acc, fn) => fn(acc), seed) as PipeResult<Seed, Fns>;
}
