export function Bar({
  minValue,
  maxValue,
  range = 20,
  color,
  increase,
}: {
  minValue?: number;
  maxValue?: number;
  range?: number;
  color?: string;
  increase?: boolean;
}) {
  return (
    <div className="flex flex-row w-full h-3 bg-gray-light rounded-sm overflow-hidden">
      <div
        className="h-full"
        style={{
          backgroundColor: color,
          width: `${((minValue ?? 0) / range) * 100}%`,
          transition: 'width 0.3s',
          opacity: 1,
        }}
      />
      {minValue && maxValue && (
        <div
          className="h-full"
          style={{
            backgroundColor: color,
            width: `${((maxValue - minValue) / range) * 100}%`,
            transition: 'width 0.3s',
            opacity: increase ? 1 : 0.4,
            filter: increase
              ? 'brightness(1.4) saturate(1.4)'
              : 'brightness(0.9) grayscale(0.3)',
          }}
        />
      )}
    </div>
  );
}
