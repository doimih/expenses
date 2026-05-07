import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function darkenHexColor(color, factor = 0.72) {
  const value = String(color || '').trim();
  const hex = value.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return value;

  const r = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(4, 6), 16) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

const pseudo3dPlugin = {
  id: 'pseudo3dSlices',
  beforeDatasetsDraw(chart, _args, pluginOptions) {
    const depth = pluginOptions?.depth ?? 12;
    const shade = pluginOptions?.shade ?? 0.72;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets?.[0];

    if (!meta?.data?.length || !dataset) return;

    meta.data.forEach((arc, index) => {
      const { x, y, startAngle, endAngle, innerRadius, outerRadius } = arc.getProps(
        ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'],
        true,
      );

      const rawColor = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor[index]
        : dataset.backgroundColor;
      const sideColor = darkenHexColor(rawColor, shade);

      for (let i = depth; i >= 1; i -= 1) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y + i, outerRadius, startAngle, endAngle);
        if (innerRadius > 0) {
          ctx.arc(x, y + i, innerRadius, endAngle, startAngle, true);
        } else {
          ctx.lineTo(x, y + i);
        }
        ctx.closePath();
        ctx.fillStyle = sideColor;
        ctx.fill();
        ctx.restore();
      }
    });
  },
};

const baseOptions = {
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};

const pseudo3dOptions = {
  ...baseOptions,
  rotation: -0.52,
  layout: { padding: { top: 2, right: 6, bottom: 10, left: 6 } },
};

export default function PieChart({ data, variant = 'flat' }) {
  const isPseudo3d = variant === 'pseudo3d';

  return (
    <div style={isPseudo3d ? { filter: 'drop-shadow(0 10px 14px rgba(34, 24, 10, 0.22))' } : undefined}>
      <Pie
        data={data}
        options={isPseudo3d ? pseudo3dOptions : baseOptions}
        plugins={isPseudo3d ? [[pseudo3dPlugin, { depth: 12, shade: 0.72 }]] : undefined}
      />
    </div>
  );
}
