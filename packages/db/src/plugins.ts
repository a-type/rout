import { dateTime } from '@a-type/kysely';
import {
  ColumnNode,
  ColumnUpdateNode,
  InsertQueryNode,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  TableNode,
  UnknownRow,
  UpdateQueryNode,
  ValueNode,
  ValuesNode,
} from 'kysely';

const ALWAYS_IGNORED = [/^kysely_/, /^sqlite_/];

export class TimestampsPlugin<
  DB extends Record<string, any> = { [key: string]: any },
> implements KyselyPlugin
{
  private ignoredTables: (keyof DB)[];
  constructor({ ignoredTables = [] }: { ignoredTables?: (keyof DB)[] } = {}) {
    this.ignoredTables = ignoredTables;
  }

  private ignoreTable(table: string) {
    if (ALWAYS_IGNORED.some((regex) => regex.test(table))) {
      return true;
    }
    return this.ignoredTables.includes(table);
  }

  private ignore(node: RootOperationNode) {
    if (InsertQueryNode.is(node)) {
      const table = node.into;
      if (table && TableNode.is(table)) {
        if (this.ignoreTable(table.table.identifier.name)) {
          return true;
        }
      }
    } else if (UpdateQueryNode.is(node)) {
      const table = node.table;
      if (table && TableNode.is(table)) {
        if (this.ignoreTable(table.table.identifier.name)) {
          return true;
        }
      }
    }

    return false;
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    if (this.ignore(args.node)) {
      return args.node;
    }
    if (UpdateQueryNode.is(args.node)) {
      const arr: ColumnUpdateNode[] = [];

      arr.push(...args.node.updates!);
      arr.push(
        ColumnUpdateNode.create(
          ColumnNode.create('updatedAt'),
          ValueNode.create(dateTime()),
        ),
      );

      return {
        ...args.node,
        updates: arr,
      };
    } else if (InsertQueryNode.is(args.node)) {
      if (!args.node.values) {
        return InsertQueryNode.cloneWith(args.node, {
          columns: [
            ColumnNode.create('createdAt'),
            ColumnNode.create('updatedAt'),
          ],
          values: ValuesNode.create([
            PrimitiveValueListNode.create([dateTime(), dateTime()]),
          ]),
        });
      } else if (ValuesNode.is(args.node.values)) {
        return InsertQueryNode.cloneWith(args.node, {
          columns: [
            ColumnNode.create('createdAt'),
            ColumnNode.create('updatedAt'),
            ...(args.node.columns || []),
          ],
          values: ValuesNode.create([
            PrimitiveValueListNode.create([
              dateTime(),
              dateTime(),
              ...args.node.values.values[0].values,
            ]),
          ]),
        });
      }
    }

    return args.node;
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}
