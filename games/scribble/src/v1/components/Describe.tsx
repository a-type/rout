import { withGame, useGameClient } from '../gameClient.js';
import { DrawCanvas } from './DrawCanvas.js';

export interface DescribeProps {}

export const Describe = withGame(function Describe({}: DescribeProps) {
  const client = useGameClient();
  const prompts = client.state?.prompts;

  return (
    <div>
      <DrawCanvas
        readonly
        value={prompts?.illustration}
        userId={prompts?.illustratorId ?? ''}
      />
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const description = (ev.target as any).description.value;
          client.prepareTurn((prev) => ({
            ...prev,
            description,
          }));
        }}
      >
        <label>
          <div>Describe the image.</div>
          <textarea name="description" />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
});
