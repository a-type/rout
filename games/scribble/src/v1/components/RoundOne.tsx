import { withGame, useGameClient } from '../gameClient.js';

export interface RoundOneProps {}

export const RoundOne = withGame(function RoundOne({}: RoundOneProps) {
  const client = useGameClient();

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        const prompt = (ev.target as any).prompt.value;
        client.submitTurn({ description: prompt });
      }}
    >
      <label>
        <div>Write a prompt. Someone else will have to draw it.</div>
        <textarea name="prompt" />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
});
