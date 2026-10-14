import { ClassType } from 'type-graphql';
import { DeleteDateColumn } from 'typeorm';

import { BaseEntity, PierkoEntityTrait } from '../entity.ts';

export const WithSoftDelete: PierkoEntityTrait<{ deletedAt: Date; delete: () => Promise<unknown> }> = <
  Base extends ClassType<BaseEntity>,
>(
  BaseClass: Base,
) => {
  class SoftDeleteTrait extends BaseClass {
    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt!: Date;

    delete() {
      return this.softRemove();
    }
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  return SoftDeleteTrait as any;
};
