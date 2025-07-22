import { Box } from '@a-type/ui';
import { BrowserRouter } from 'react-router';
import { hooks } from './gameClient.js';
import { PageContent } from './PageContent.js';
import { PageNav } from './PageNav.js';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export default hooks.withGame(function Client({ gameSuite }) {
  return (
    <BrowserRouter>
      <Gameplay />
    </BrowserRouter>
  );
});

// perhaps you'll want to move these to other modules.

const Gameplay = hooks.withGame(function Gameplay({ gameSuite }) {
  return (
    <Box className="flex flex-col gap-2">
      <PageNav />
      <div className="p-4 mt-8">
        <PageContent />
      </div>
    </Box>
  );
});
