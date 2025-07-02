import { Box } from '@a-type/ui';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SortableTokenList } from './SortableTokenList.js';
import { moveItem } from './sortHelpers.js';
import { Token } from './Token.js';
import { TokenRoot } from './TokenRoot.js';
import { TokenDragData } from './types.js';

const meta = {
  title: 'SortableTokenList',
  component: SortableTokenList,
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof SortableTokenList>;

export default meta;

type Story = StoryObj<typeof SortableTokenList>;

export const Default: Story = {
  render(args) {
    const [tokens, setTokens] = useState<string[]>([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
    ]);
    function moveToken(token: TokenDragData<string>, index: number) {
      setTokens((old) => moveItem(old, old.indexOf(token.id), index)); // Update the state with the new order
    }
    return (
      <SortableTokenList {...args} onMove={moveToken}>
        {tokens.map((token) => (
          <TokenCard id={token} key={token} />
        ))}
      </SortableTokenList>
    );
  },
  decorators: [
    (Story) => (
      <TokenRoot>
        <Story />
      </TokenRoot>
    ),
  ],
};

const TokenCard = ({ id }: { id: string }) => (
  <Token id={id}>
    <Box
      p="lg"
      className="aspect-3/4 w-80px text-xl font-bold"
      surface
      border
      layout="center center"
    >
      <span>{id}</span>
    </Box>
  </Token>
);
