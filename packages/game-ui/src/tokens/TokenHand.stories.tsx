import { Box } from '@a-type/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Token } from './Token.js';
import { TokenHand } from './TokenHand.js';
import { TokenSpace } from './TokenSpace.js';

const meta = {
  title: 'TokenHand',
  component: TokenHand,
  args: {
    debug: false,
  },
  argTypes: {
    debug: {
      control: 'boolean',
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof TokenHand>;

const tokens = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const Default: Story = {
  render(args) {
    const [selected, setSelected] = useState<string>();
    return (
      <Box col gap>
        <TokenSpace id="select" onDrop={(token) => setSelected(token.id)}>
          <Box border full layout="center center">
            {selected ? (
              <TokenCard id={selected} />
            ) : (
              <div className="h-80px flex items-center justify-center">
                Drop a token here
              </div>
            )}
          </Box>
        </TokenSpace>
        <TokenHand {...args} onDrop={() => setSelected(undefined)}>
          {tokens
            .filter((token) => token !== selected)
            .map((token) => (
              <TokenCard id={token} key={token} />
            ))}
        </TokenHand>
      </Box>
    );
  },
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
