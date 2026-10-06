import React from 'react';
import { StateBoundAnalysis } from '../algorithms/automata';
import { Layers, Database, Compass, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface StateBoundDashboardProps {
  analysis: StateBoundAnalysis;
}

export const StateBoundDashboard: React.FC<StateBoundDashboardProps> = ({ analysis }) => {
  const {
    qCount,
    theoreticalMax,
    actualDfaStates,
    unreachableSubsets,
    stateUtilization,
    ratioExplanation,
    dynamicInterpretation,
  } = analysis;

  // Logarithmic ratio calculation for visualization if theoreticalMax is high
  const maxLog = Math.log2(Math.max(theoreticalMax, 2));
  const actualLog = Math.log2(Math.max(actualDfaStates, 1));
  const logFillPercent = Math.min(100, Math.max(4, (actualLog / maxLog) * 100));

  return (
    <div className="space-y-6">
      {/* 5 Statistic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: NFA States Q */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">NFA States (|Q|)</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {qCount}
            </span>
            <span className="text-xs text-slate-500">states</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Primary automaton size</span>
          </div>
        </div>

        {/* Card 2: Theoretical Maximum 2^Q */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Theoretical Max</span>
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-indigo-700 dark:text-indigo-400 tabular-nums">
              {theoreticalMax}
            </span>
            <span className="text-xs font-mono text-slate-500">2^{qCount}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>Powerset bound |𝒫(Q)|</span>
          </div>
        </div>

        {/* Card 3: Actual Reachable DFA States */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium text-blue-900 dark:text-blue-300">Actual DFA States</span>
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-blue-700 dark:text-blue-400 tabular-nums">
              {actualDfaStates}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">reachable</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700/80 dark:text-blue-400 flex items-center gap-1">
            <span>Constructed by algorithm</span>
          </div>
        </div>

        {/* Card 4: Unreachable Subsets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Unreachable Subsets</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
              {unreachableSubsets}
            </span>
            <span className="text-xs text-slate-500">subsets</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>2^{qCount} − {actualDfaStates}</span>
          </div>
        </div>

        {/* Card 5: State Utilization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">State Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
              {stateUtilization}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate" title={ratioExplanation}>
            <span>{ratioExplanation.split(':')[0]}</span>
          </div>
        </div>
      </div>

      {/* Visual State-Bound Comparison Charts & Interpretation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visual Bar Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Visual Comparison: Theoretical vs Actual States
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {actualDfaStates} / {theoreticalMax} states
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Linear State Space Utilization</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{stateUtilization}%</span>
              </div>
              <div className="w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  style={{ width: `${Math.max(stateUtilization, 3)}%` }}
                  className="h-full bg-blue-600 rounded-lg transition-all duration-300 relative group flex items-center justify-end pr-1.5"
                >
                  {stateUtilization > 12 && (
                    <span className="text-[10px] text-white font-mono font-bold leading-none">
                      {actualDfaStates}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>0 (Empty)</span>
                <span>Actual: {actualDfaStates} states</span>
                <span>2^{qCount} = {theoreticalMax} states</span>
              </div>
            </div>

            {/* Logarithmic / Complexity Scale */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Bit-Dimension / Log₂ Growth Ratio</span>
                <span className="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">
                  {actualLog.toFixed(2)} / {maxLog.toFixed(2)} bits
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  style={{ width: `${logFillPercent}%` }}
                  className="h-full bg-indigo-600 rounded-lg transition-all duration-300"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Measures how much of the theoretical {qCount}-bit state register address space is
                utilized.
              </p>
            </div>
          </div>

          {/* Subsets Partition Diagram */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 rounded-xl">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Reachable Subsets ({actualDfaStates})</span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                Constructed starting from ε-closure(q₀) along real alphabet transitions.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Unreachable Subsets ({unreachableSubsets})</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Combinations of NFA states that no valid input string can simultaneously activate.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Interpretation Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-sm font-semibold">Academic Interpretation & Analysis</h3>
            </div>

            {/* Dynamic Paragraph generated based on calculated values */}
            <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11.5px] text-slate-700 dark:text-slate-300">
                {dynamicInterpretation}
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                  Theoretical Upper Bound Proof:
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  In automata theory, each deterministic DFA state corresponds to a distinct subset of
                  the original NFA state set Q. Because a set with |Q| elements has exactly 2^|Q|
                  subsets (the powerset 𝒫(Q)), the DFA can have <strong>at most 2^|Q| states</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Subset Construction: Rabbin & Scott (1959)</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">O(2^|Q| · |Σ|)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
