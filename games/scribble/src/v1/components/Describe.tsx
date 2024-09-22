import { DrawCanvas } from './DrawCanvas.js';

export interface DescribeProps {
  illustration: any;
  illustratorId: string;
  onDescription: (description: string) => void;
}

export const Describe = function Describe({
  illustration,
  illustratorId,
  onDescription,
}: DescribeProps) {
  return (
    <div>
      <DrawCanvas readonly value={illustration} playerId={illustratorId} />
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const description = (ev.target as any).description.value;
          onDescription(description);
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
};
