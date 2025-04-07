import { Box } from '@a-type/ui';
import { hooks } from './gameClient.js';

const Client = hooks.withGame(function Client({ gameSuite }) {
  const { initialState } = gameSuite;
  return <Box>{JSON.stringify(initialState)}</Box>;
});

export default Client;
