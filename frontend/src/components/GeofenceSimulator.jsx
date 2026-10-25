import React from 'react';
import { Sliders, MapPin, Compass, CheckCircle2 } from 'lucide-react';

export default function GeofenceSimulator({
  simulationMode,
  setSimulationMode,
  office,
  onCalibrateOfficeToCurrentGps,
  deviceGps
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
          <Sliders className="w-4 h-4" />
          <span>Location & Verification Simulator (Test & Demo Tool)</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Switch scenarios to test both approved & rejected conditions
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSimulationMode('REAL')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            simulationMode === 'REAL'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5 inline mr-1.5" />
          Device GPS (Real)
        </button>

        <button
          onClick={() => setSimulationMode('INSIDE_OFFICE')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            simulationMode === 'INSIDE_OFFICE'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-emerald-300" />
          Inside Office (25m, 12m acc)
        </button>

        <button
          onClick={() => setSimulationMode('OUTSIDE_RADIUS')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            simulationMode === 'OUTSIDE_RADIUS'
              ? 'bg-red-600 text-white border-red-500 shadow-sm'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block mr-1.5"></span>
          Outside Radius (2.5 km away)
        </button>

        <button
          onClick={() => setSimulationMode('POOR_ACCURACY')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            simulationMode === 'POOR_ACCURACY'
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mr-1.5"></span>
          Poor GPS (160m accuracy &gt; 100m)
        </button>

        {deviceGps && (
          <button
            onClick={onCalibrateOfficeToCurrentGps}
            title="Set Admin Office Location directly to your current device GPS"
            className="ml-auto px-3 py-1.5 rounded-lg border border-indigo-700/70 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60 text-xs font-medium transition-all flex items-center space-x-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>Set Office to My Real GPS</span>
          </button>
        )}
      </div>
    </div>
  );
}
