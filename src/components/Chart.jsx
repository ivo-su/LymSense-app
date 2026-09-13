import { useState } from 'react';

const chartBounds = {
  left: 50,
  right: 480,
  top: 20,
  bottom: 220,
};

function Chart({
  data = [],
  xKey = 'x',
  yKey = 'y',
  title = 'Gráfica',
  yAxisLabel = 'Valor',
  xAxisLabel = 'Tiempo',
  valueLabel = yAxisLabel,
  minValue,
  maxValue,
  formatX = (value) => String(value),
  formatY = (value) => String(value),
  tooltipFields,
  width = '100%',
  height = '260px',
  minHeight = '260px',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPoint, setTooltipPoint] = useState(null);
  const { left, right, top, bottom } = chartBounds;
  const numericValues = data
    .map((item) => Number(item[yKey]))
    .filter((value) => Number.isFinite(value));
  const dataMin = numericValues.length ? Math.min(...numericValues) : 0;
  const dataMax = numericValues.length ? Math.max(...numericValues) : 1;
  const rangeMin = minValue ?? dataMin;
  const rangeMax = maxValue ?? dataMax;
  const chartMin = rangeMin === rangeMax ? rangeMin - 1 : rangeMin;
  const chartMax = rangeMin === rangeMax ? rangeMax + 1 : rangeMax;
  const chartRange = chartMax - chartMin;
  const resolvedTooltipFields = tooltipFields ?? [
    { key: xKey, label: xAxisLabel, format: formatX },
    { key: yKey, label: valueLabel, format: formatY },
  ];
  const tooltipHeight = 10 + resolvedTooltipFields.length * 14;
  const chartPoints = data.map((item, index) => ({
    item,
    x: Math.round(data.length === 1
      ? (left + right) / 2
      : left + (index * (right - left)) / (data.length - 1)),
    y: Math.round(bottom - ((Number(item[yKey]) - chartMin) / chartRange) * (bottom - top)),
  }));
  const tickValues = Array.from({ length: 5 }, (_, index) => chartMin + (chartRange * index) / 4);
  const tooltipLines = tooltipPoint
    ? resolvedTooltipFields.map((field) => {
      const value = field.format
        ? field.format(tooltipPoint.item[field.key])
        : String(tooltipPoint.item[field.key]);
      return `${field.label}: ${value}`;
    })
    : [];
  const tooltipWidth = Math.max(120, ...tooltipLines.map((line) => line.length * 5.5 + 16));
  const tooltipX = tooltipPoint ? Math.min(tooltipPoint.x + 10, right - tooltipWidth) : 0;
  const tooltipY = tooltipPoint
    ? Math.max(tooltipPoint.y - tooltipHeight - 9, top)
    : 0;

  return (
    <div
      className="chart"
      style={{ width, height, minHeight, maxWidth: '100%' }}
    >
      {title && <h2>{title}</h2>}
      <svg
        viewBox="0 0 500 260"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={title}
      >
        <defs>
          <pattern id="chart-grid" width="43" height="40" patternUnits="userSpaceOnUse">
            <path d="M 43 0 L 0 0 0 40" fill="none" stroke="#dbeafe" />
          </pattern>
        </defs>
        <rect x="50" y="20" width="430" height="200" fill="url(#chart-grid)" />
        <line x1="50" y1="20" x2="50" y2="220" stroke="#555" />
        <line x1="50" y1="220" x2="480" y2="220" stroke="#555" />
        <polyline
          points={chartPoints.map(({ x, y }) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
        />
        {tickValues.map((value) => {
          const y = bottom - ((value - chartMin) / chartRange) * (bottom - top);
          return <text key={value} x="30" y={y + 4} fontSize="11">{Math.round(value)}</text>;
        })}
        {chartPoints.map((point, index) => (
          <circle
            key={point.item[xKey] ?? index}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#2563eb"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              setHoveredPoint(point);
              setTooltipPoint(point);
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
        {tooltipPoint && (
          <g
            pointerEvents="none"
            opacity={hoveredPoint ? 1 : 0}
            style={{ transition: 'opacity 200ms ease-in-out' }}
          >
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="4"
              fill="white"
              stroke="#c4c4c4"
              strokeWidth="0.2"
            />
            {tooltipLines.map((line, index) => (
              <text
                key={line}
                x={tooltipX + 6}
                y={tooltipY + 16 + index * 14}
                fontSize="10"
              >
                {line}
              </text>
            ))}
          </g>
        )}
        <text
          x="15"
          y="120"
          fontSize="12"
          textAnchor="middle"
          transform="rotate(-90 15 120)"
        >
          {yAxisLabel}
        </text>
        <text x="415" y="252" fontSize="12">{xAxisLabel}</text>
        {chartPoints.map((point, index) => (
          <text key={point.item[xKey] ?? index} x={point.x - 2} y="238" fontSize="9">
            {formatX(point.item[xKey])}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default Chart;