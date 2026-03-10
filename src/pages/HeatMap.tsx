import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { Target, Shield } from 'lucide-react';

export default function HeatMap() {
  const { heatMapPoints, addHeatMapPoint, players } = useApp();
  const [mode, setMode] = useState<'attack' | 'defense'>('attack');
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.id ?? '');
  const courtRef = useRef<HTMLDivElement>(null);

  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    addHeatMapPoint({ x, y, type: mode });
  };

  // Aggregate nearby points into intensity zones
  const getColor = (value: number, type: 'attack' | 'defense') => {
    const intensity = Math.min(value / 100, 1);
    if (type === 'attack') {
      const r = Math.round(255);
      const g = Math.round(100 * (1 - intensity));
      const b = 0;
      return `rgba(${r},${g},${b},${0.3 + intensity * 0.5})`;
    } else {
      const r = 0;
      const g = Math.round(100 + 155 * (1 - intensity));
      const b = 255;
      return `rgba(${r},${g},${b},${0.3 + intensity * 0.5})`;
    }
  };

  const attackPoints = heatMapPoints.filter(p => p.type === 'attack');
  const defensePoints = heatMapPoints.filter(p => p.type === 'defense');

  const statCards = [
    { label: 'Attack Zones', value: attackPoints.length, icon: Target, color: 'text-red-400' },
    { label: 'Defense Zones', value: defensePoints.length, icon: Shield, color: 'text-blue-400' },
    {
      label: 'Hottest Zone',
      value: heatMapPoints.length > 0
        ? `${heatMapPoints.reduce((a, b) => a.value > b.value ? a : b).type}`
        : '—',
      icon: Target,
      color: 'text-orange-400',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Heat Map & Attacking Locator"
        subtitle="Visualize attack and defense patterns on the court"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <Icon size={18} className={`${color} mb-2`} />
            <p className="text-white font-bold text-xl capitalize">{value}</p>
            <p className="text-slate-400 text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Controls */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
          <h3 className="text-white font-semibold text-sm">Controls</h3>

          <div>
            <p className="text-slate-400 text-xs mb-2">Plot Mode</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode('attack')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  mode === 'attack' ? 'bg-red-600/20 text-red-300 border border-red-600/30' : 'text-slate-400 bg-slate-700 hover:text-white'
                }`}
              >
                <Target size={14} /> Attack Zone
              </button>
              <button
                onClick={() => setMode('defense')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  mode === 'defense' ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30' : 'text-slate-400 bg-slate-700 hover:text-white'
                }`}
              >
                <Shield size={14} /> Defense Zone
              </button>
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-xs mb-2">Filter Player</p>
            <select
              value={selectedPlayer}
              onChange={e => setSelectedPlayer(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">All Players</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <p className="text-slate-500 text-xs mb-3">Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
                <span className="text-slate-400 text-xs">Attack Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 opacity-70" />
                <span className="text-slate-400 text-xs">Defense Point</span>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs italic">
            Click anywhere on the court to add a zone point.
          </p>
        </div>

        {/* Court */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold text-sm mb-4">Court View — Click to Add Points</h3>
            <div
              ref={courtRef}
              onClick={handleCourtClick}
              className="relative w-full bg-green-900 rounded-lg overflow-hidden cursor-crosshair select-none"
              style={{ paddingBottom: '60%' }}
            >
              {/* Court lines */}
              <div className="absolute inset-0">
                {/* Outer boundary */}
                <div className="absolute inset-[2%] border-2 border-white/60 rounded" />
                {/* Center net */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/80" />
                {/* Center line vertical */}
                <div className="absolute top-[2%] bottom-[2%] left-1/2 -translate-x-1/2 w-px bg-white/40" />
                {/* Service boxes */}
                <div className="absolute top-[2%] bottom-1/2 left-[2%] right-1/2 border border-white/30" />
                <div className="absolute top-[2%] bottom-1/2 left-1/2 right-[2%] border border-white/30" />
                <div className="absolute top-1/2 bottom-[2%] left-[2%] right-1/2 border border-white/30" />
                <div className="absolute top-1/2 bottom-[2%] left-1/2 right-[2%] border border-white/30" />
                {/* Net label */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 text-green-900 text-xs font-bold px-2 py-0.5 rounded">
                  NET
                </div>
                {/* Team labels */}
                <div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium">AWAY</div>
                <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium">HOME</div>
              </div>

              {/* Heat map points */}
              {heatMapPoints.map((pt, i) => (
                <div
                  key={i}
                  className="absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pt.x}%`,
                    top: `${pt.y}%`,
                    width: `${Math.max(24, pt.value * 0.6)}px`,
                    height: `${Math.max(24, pt.value * 0.6)}px`,
                    background: getColor(pt.value, pt.type),
                    border: `1px solid ${pt.type === 'attack' ? 'rgba(255,100,0,0.5)' : 'rgba(0,150,255,0.5)'}`,
                  }}
                />
              ))}

              {/* Tooltip placeholder — wire up onMouseEnter/Leave per point to enable */}
            </div>
          </div>

          {/* Recent Points */}
          <div className="mt-4 bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold text-sm mb-3">Recorded Zones</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
              {heatMapPoints.slice(-12).reverse().map((pt, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: getColor(pt.value, pt.type) }}
                  />
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium capitalize">{pt.type}</p>
                    <p className="text-slate-500 text-xs">({Math.round(pt.x)},{Math.round(pt.y)})</p>
                  </div>
                </div>
              ))}
              {heatMapPoints.length === 0 && (
                <p className="text-slate-500 text-xs col-span-4">Click on the court to add zones.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
