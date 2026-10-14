import { ClassType } from 'type-graphql';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { BaseEntity, PierkoEntityTrait } from '../entity.ts';

export const WithTimestamps: PierkoEntityTrait<{ createdAt: Date; updatedAt: Date }> = <Base extends ClassType<BaseEntity>>(
  BaseClass: Base,
) => {
  class TimestampsTrait extends BaseClass {
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  return TimestampsTrait as any;
};
