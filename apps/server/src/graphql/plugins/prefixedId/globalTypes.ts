import { PrefixedId, ResourceIdPrefix } from '@long-game/db';
import {
  FieldKind,
  FieldNullability,
  FieldRef,
  InputFieldMap,
  InputOrArgRef,
  NormalizeArgs,
  SchemaTypes,
  ShapeFromTypeParam,
} from '@pothos/core';
import type { PothosPrefixedIdPlugin } from './prefixedIdPlugin.js';
import {
  PrefixedIdFieldOptions,
  PrefixedIdInputFieldOptions,
} from './types.js';

declare global {
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      prefixedId: PothosPrefixedIdPlugin<Types>;
    }

    export interface InputFieldBuilder<
      Types extends SchemaTypes,
      Kind extends 'Arg' | 'InputObject',
    > {
      prefixedId: <
        Req extends boolean,
        Prefix extends ResourceIdPrefix = ResourceIdPrefix,
      >(
        ...args: NormalizeArgs<
          [options: PrefixedIdInputFieldOptions<Types, Req, Kind, Prefix>]
        >
      ) => InputOrArgRef<Types, PrefixedId<Prefix>, Kind>;
    }

    export interface RootFieldBuilder<
      Types extends SchemaTypes,
      ParentShape,
      Kind extends FieldKind = FieldKind,
    > {
      prefixedId: <
        Args extends InputFieldMap,
        Nullable extends FieldNullability<'ID'>,
        ResolveReturnShape,
      >(
        options: PrefixedIdFieldOptions<
          Types,
          ParentShape,
          Args,
          Nullable,
          ResolveReturnShape,
          Kind
        >,
      ) => FieldRef<Types, ShapeFromTypeParam<Types, 'ID', Nullable>>;
    }
  }
}
