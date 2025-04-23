import { Box } from '@a-type/ui';
import { TopographyBackground, Wordmark } from '@long-game/visual-components';
import { Scene } from './Scene';

const App = () => {
  return (
    <Box d="col" full layout="center start" p="xl">
      <TopographyBackground colorMode="dark" />
      <Box d="col" gap="xl" className="max-w-800px w-full">
        <Box full="width" layout="center center">
          <Wordmark className="text-10vmin" />
        </Box>
      </Box>
      <Scene className="w-full aspect-16/9" />
    </Box>
  );
};

export default App;
