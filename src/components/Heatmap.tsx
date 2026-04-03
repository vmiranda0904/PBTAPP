import type { HeatmapCell } from '../lib/aiEngineService';

const cells = Array.from({ length: 9 }, (_, index) => ({ x: index % 3, y: Math.floor(index / 3) }));

export default function Heatmap({ cells: heatmapCells }: { cells: HeatmapCell[] }) {
  const maxCount = Math.max(...heatmapCells.map((cell) => cell.count), 1);

  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((cell) => {
        const match = heatmapCells.find((item) => item.x_bin === cell.x && item.y_bin === cell.y);
        const count = match?.count ?? 0;
        const intensity = count === 0 ? 0.08 : 0.18 + (count / maxCount) * 0.62;

        return (
          <div
            key={`${cell.x}-${cell.y}`}
            className="flex aspect-square items-center justify-center rounded-2xl border border-white/10 text-sm font-medium text-white"
            style={{ backgroundColor: `rgba(56, 189, 248, ${intensity.toFixed(2)})` }}
            title={`Column ${cell.x + 1}, row ${cell.y + 1}: ${count} plays`}
          >
            {count}
          </div>
        );
      })}
    </div>
  );
}
