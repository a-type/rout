export type NotificationContext = 'push' | 'email';

export interface NotificationConfig<DataShape extends { type: string }> {
  title(data: DataShape, context: NotificationContext): string;
  text(data: DataShape, context: NotificationContext): string;
  html?(data: DataShape, context: NotificationContext): string;
  link(data: DataShape): string;
  type: DataShape['type'];
}
