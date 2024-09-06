import { isPrefixedId, ResourceIdPrefix } from '@long-game/db';
import SchemaBuilder, {
  BasePlugin,
  SchemaTypes,
  InputFieldBuilder,
  RootFieldBuilder,
  FieldKind,
  InputFieldMap,
  FieldNullability,
  InputShapeFromFields,
} from '@pothos/core';
import {
  PrefixedIdFieldOptions,
  PrefixedIdInputFieldOptions,
} from './types.js';
import { GraphQLResolveInfo } from 'graphql';

const pluginName = 'prefixedId';

export default pluginName;

export class PothosPrefixedIdPlugin<
  Types extends SchemaTypes,
> extends BasePlugin<Types> {}

type DefaultSchemaTypes = PothosSchemaTypes.ExtendDefaultTypes<{}>;

const inputFieldBuilder =
  InputFieldBuilder.prototype as PothosSchemaTypes.InputFieldBuilder<
    DefaultSchemaTypes,
    'Arg' | 'InputObject'
  >;

inputFieldBuilder.prefixedId = function prefixedId<
  Req extends boolean,
  Prefix extends ResourceIdPrefix = ResourceIdPrefix,
>(
  {
    prefix,
    ...options
  }: PrefixedIdInputFieldOptions<
    DefaultSchemaTypes,
    Req,
    'Arg' | 'InputObject',
    Prefix
  > = {} as never,
) {
  return this.id({
    validate: (v) => isPrefixedId(v, prefix),
    ...options,
  }) as never;
};

const fieldBuilderProto =
  RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
    SchemaTypes,
    unknown,
    FieldKind
  >;

fieldBuilderProto.prefixedId = function prefixedId<
  Args extends InputFieldMap,
  Nullable extends FieldNullability<'ID'>,
  ResolveReturnShape,
>({
  resolve,
  ...options
}: PrefixedIdFieldOptions<
  SchemaTypes,
  unknown,
  Args,
  Nullable,
  ResolveReturnShape,
  FieldKind
>) {
  return this.field({
    ...options,
    type: 'ID',
    resolve: (async (
      parent: unknown,
      args: InputShapeFromFields<Args>,
      context: object,
      info: GraphQLResolveInfo,
    ) => {
      return resolve(parent, args, context, info);
    }) as never, // resolve is not expected because we don't know FieldKind
  });
};

SchemaBuilder.registerPlugin(pluginName, PothosPrefixedIdPlugin);
