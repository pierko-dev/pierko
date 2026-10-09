import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { BaseEntityType } from '../entity.ts';

export const WithTimestamps = (BaseClass: BaseEntityType) => {
  class TimestampsTrait extends BaseClass {
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
  }

  return TimestampsTrait;
};
