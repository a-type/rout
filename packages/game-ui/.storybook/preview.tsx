import { Provider } from '@a-type/ui';
import '@a-type/ui/main.css';
import type { Preview } from '@storybook/react-vite';
import 'virtual:uno.css';
import { DndRoot } from '../src/dnd/DndRoot';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider>
        <DndRoot>
          <Story />
        </DndRoot>
      </Provider>
    ),
  ],
};

export default preview;
