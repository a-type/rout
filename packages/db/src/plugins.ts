import { QueryResult, TableNode, UnknownRow } from 'kysely';
import {
  ColumnNode,
  ColumnUpdateNode,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  RootOperationNode,
  ValueNode,
} from 'kysely';

export class UpdatedAtPlugin<
  DB extends Record<string, any> = { [key: string]: any },
> implements KyselyPlugin
{
  private ignoredTables: (keyof DB)[];
  constructor({ ignoredTables = [] }: { ignoredTables?: (keyof DB)[] } = {}) {
    this.ignoredTables = ignoredTables;
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    if (args.node.kind === 'UpdateQueryNode') {
      const table = args.node.table;
      if (TableNode.is(table)) {
        if (this.ignoredTables.includes(table.table.identifier.name)) {
          return args.node;
        }
      }

      const arr: ColumnUpdateNode[] = [];

      arr.push(...args.node.updates!);
      arr.push(
        ColumnUpdateNode.create(
          ColumnNode.create('updatedAt'),
          ValueNode.create(new Date()),
        ),
      );

      return {
        ...args.node,
        updates: arr,
      };
    }

    return args.node;
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}
