import { Board } from './components/Board.js';
import { withGame } from './gameClient.js';

export interface ClientProps {}

export function Client() {
  return <ExampleGameUI />;
}

export default Client;

// Game UI components must be wrapped in withGame and
// rendered as children of a GameClientProvider.
// You can utilize useGameClient() to get the client,
// then access the client's state properties, which will
// be reactive.
const ExampleGameUI = withGame(function ExampleGameUI() {
  return <Board />;
});
