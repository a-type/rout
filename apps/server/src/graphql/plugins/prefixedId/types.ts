import { ResourceIdPrefix } from '@long-game/db';
import {
  FieldKind,
  FieldOptionsFromKind,
  InferredFieldOptionKeys,
  InputFieldMap,
  InputShapeFromFields,
  OutputRefShape,
  Resolver,
  SchemaTypes,
  ShapeFromTypeParam,
} from '@pothos/core';

export type PrefixedIdFieldOptions<
  Types extends SchemaTypes,
  ParentShape,
  Args extends InputFieldMap,
  Nullable extends boolean,
  ResolveReturnShape,
  Kind extends FieldKind = FieldKind,
> = Omit<
  FieldOptionsFromKind<
    Types,
    ParentShape,
    'ID',
    Nullable,
    Args,
    Kind,
    ParentShape,
    ResolveReturnShape
  >,
  'type' | InferredFieldOptionKeys
> & {
  resolve: Resolver<
    ParentShape,
    InputShapeFromFields<Args>,
    Types['Context'],
    ShapeFromTypeParam<Types, OutputRefShape<string>, true>,
    ResolveReturnShape
  >;
};

export type PrefixedIdInputFieldOptions<
  Types extends SchemaTypes,
  Req extends boolean,
  Kind extends 'Arg' | 'InputObject',
  Prefix extends ResourceIdPrefix = ResourceIdPrefix,
> = Omit<
  PothosSchemaTypes.InputFieldOptionsByKind<Types, 'ID', Req>[Kind],
  'type'
> & {
  prefix?: Prefix;
};
