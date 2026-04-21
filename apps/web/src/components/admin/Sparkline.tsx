type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
};

export default function Sparkline({
  values,
  width = 120,
  height = 28,
  className,
}: SparklineProps) {
  if (values.length === 0) {
    return <div className={className} style={{ height }} aria-hidden />;
  }

  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / max) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Trend of ${values.length} data points`}
    >
      <polygon points={areaPoints} fill="currentColor" fillOpacity={0.08} />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
