import { Box } from '@a-type/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RuleTip } from './RuleTip.js';

const meta = {
  title: 'Components/RuleTip',
  component: RuleTip,
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof RuleTip>;

export default meta;

type Story = StoryObj<typeof RuleTip>;

export const Default: Story = {
  render() {
    return (
      <RuleTip content={<Box p>Hello world</Box>}>
        <Box p surface border />
      </RuleTip>
    );
  },
};
