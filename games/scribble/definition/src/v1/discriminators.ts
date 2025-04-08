import { DrawingItem, TaskCompletion } from './gameDefinition';

export function isDrawingCompletion(
  completion: TaskCompletion,
): completion is Omit<DrawingItem, 'playerId'> {
  return completion.kind === 'drawing';
}

export function isDescriptionCompletion(
  completion: TaskCompletion,
): completion is Omit<DrawingItem, 'playerId'> {
  return completion.kind === 'description';
}
