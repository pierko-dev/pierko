import { Field, FieldOptions } from 'type-graphql';
import {
  Column,
  ColumnOptions,
  JoinColumn,
  JoinTable,
  ManyToOne,
  ManyToMany,
  OneToMany,
  OneToOne,
  RelationOptions,
} from 'typeorm';

export type PropertyOptions = {
  nullable?: boolean;
  field?: Omit<FieldOptions, 'nullable'>;
} & (
  | { column?: Omit<ColumnOptions, 'nullable'>; relation?: never }
  | {
      column?: never;
      relation: {
        type?: 'many-to-one' | 'one-to-many' | 'many-to-many' | 'one-to-one';
        options?: RelationOptions;
      } & ({ inverseSide: string | ((object: any) => any); main?: never } | { inverseSide: never; main: true });
    }
);

const getRelationType = (isArray: boolean, main: boolean) => {
  if (isArray) {
    if (main) {
      return 'many-to-many';
    }

    return 'one-to-many';
  }

  if (main) {
    return 'one-to-one';
  }

  return 'many-to-one';
};

// oxlint-disable-next-line typescript/no-explicit-any
export function Property(propertyType: () => any, options: PropertyOptions = { nullable: false }) {
  return (target: object, propertyKey: string | symbol) => {
    const { column, field, nullable, relation } = options;

    Field(propertyType, { nullable, ...field })(target, propertyKey);

    if ('relation' in options && relation) {
      const { type: explicitType, inverseSide, main = false, options: relationOptions = {} } = relation;

      const resolvedType = propertyType();
      const isArray = Array.isArray(resolvedType);

      const targetEntity = isArray ? () => resolvedType[0] : propertyType;
      const mergedOptions = { nullable, ...relationOptions };

      const type = explicitType ?? getRelationType(isArray, main);

      switch (type) {
        case 'many-to-one':
          ManyToOne(targetEntity, inverseSide, mergedOptions)(target, propertyKey);

          JoinColumn()(target, propertyKey);

          break;
        case 'one-to-many':
          OneToMany(targetEntity, inverseSide, mergedOptions)(target, propertyKey);

          break;
        case 'many-to-many':
          ManyToMany(targetEntity, inverseSide, mergedOptions)(target, propertyKey);

          if (main) {
            JoinTable()(target, propertyKey);
          }

          break;
        case 'one-to-one':
          OneToOne(targetEntity, inverseSide, mergedOptions)(target, propertyKey);

          if (main) {
            JoinColumn()(target, propertyKey);
          }

          break;
      }

      return;
    }

    Column({ nullable, ...column })(target, propertyKey);
  };
}
