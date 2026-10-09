import { DeleteDateColumn } from 'typeorm';

import { BaseEntityType } from '../entity.ts';

export const WithSoftDelete = (BaseClass: BaseEntityType) => {
  class SoftDeleteTrait extends BaseClass {
    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt!: Date;

    delete() {
      return this.softRemove();
    }
  }

  return SoftDeleteTrait;
};
